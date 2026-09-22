import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources";
import { MangaItem, SourceId } from "@/types";

export const dynamic = "force-dynamic";

function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateMatchScore(query: string, candidate: string): number {
  const normQuery = normalizeTitle(query);
  const normCand = normalizeTitle(candidate);

  if (normQuery === normCand) return 1.0;
  if (normCand.includes(normQuery) || normQuery.includes(normCand)) return 0.85;

  const queryWords = normQuery.split(" ").filter((w) => w.length > 2);
  const candWords = normCand.split(" ").filter((w) => w.length > 2);

  if (queryWords.length === 0 || candWords.length === 0) return 0;

  let common = 0;
  for (const w of queryWords) {
    if (candWords.includes(w)) common++;
  }

  return common / Math.max(queryWords.length, candWords.length);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "El título es requerido para la búsqueda." },
        { status: 400 }
      );
    }

    // Search providers in order of preferred priority: Olympus -> MangaDex -> Dragon
    const sourcesToSearch: SourceId[] = ["olympus", "mangadex", "dragon"];

    let bestMatch: MangaItem | null = null;
    let highestScore = 0;

    for (const sourceId of sourcesToSearch) {
      try {
        const provider = getSource(sourceId);
        const searchResult = await provider.search(title, 1);

        for (const item of searchResult.items || []) {
          const score = calculateMatchScore(title, item.title);
          if (score > highestScore && score >= 0.5) {
            highestScore = score;
            bestMatch = item;
            if (score === 1.0) break;
          }
        }

        if (highestScore >= 0.85) {
          break; // Excellent match found, no need to search further
        }
      } catch (err) {
        console.warn(`[Auto-Matcher] Search in ${sourceId} failed for "${title}":`, err);
      }
    }

    if (bestMatch) {
      return NextResponse.json({
        matched: true,
        source: bestMatch.source,
        id: bestMatch.id,
        title: bestMatch.title,
        coverUrl: bestMatch.coverUrl,
        score: highestScore,
      });
    }

    return NextResponse.json({
      matched: false,
      originalTitle: title,
    });
  } catch (error: unknown) {
    console.error("[Auto-Matcher] Error:", error);
    const details = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error en el detector de fuentes.", details },
      { status: 500 }
    );
  }
}
