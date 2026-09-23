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

const STOP_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "de", "del", "en", "y", "a", "al",
  "the", "an", "of", "in", "and", "to", "for", "with", "no", "por"
]);

function calculateMatchScore(query: string, candidate: string): number {
  const normQuery = normalizeTitle(query);
  const normCand = normalizeTitle(candidate);

  // Exact normalized match
  if (normQuery === normCand) return 1.0;

  // Subtitle match (e.g. "Solo Leveling" vs "Solo Leveling Ragnarok")
  if (normCand.startsWith(normQuery + " ") || normQuery.startsWith(normCand + " ")) {
    if (Math.min(normQuery.length, normCand.length) >= 6) {
      return 0.88;
    }
  }

  const queryWords = normQuery.split(" ").filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  const candWords = normCand.split(" ").filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  if (queryWords.length === 0 || candWords.length === 0) {
    return normQuery === normCand ? 1.0 : 0;
  }

  // Prevent single common words from matching long compound titles
  if (queryWords.length === 1 && candWords.length > 1) {
    return 0;
  }
  if (candWords.length === 1 && queryWords.length > 1) {
    return 0;
  }

  let common = 0;
  for (const w of queryWords) {
    if (candWords.includes(w)) common++;
  }

  // Dice coefficient: (2 * common) / (queryWords.length + candWords.length)
  return (2 * common) / (queryWords.length + candWords.length);
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

    // Search providers in order of preferred priority: Olympus -> MangaDex -> Dragon -> Rncalation
    const sourcesToSearch: SourceId[] = ["olympus", "mangadex", "dragon", "rncalation"];

    let bestMatch: MangaItem | null = null;
    let highestScore = 0;

    for (const sourceId of sourcesToSearch) {
      try {
        const provider = getSource(sourceId);
        const searchResult = await provider.search(title, 1);

        for (const item of searchResult.items || []) {
          const score = calculateMatchScore(title, item.title);
          if (score > highestScore && score >= 0.78) {
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
