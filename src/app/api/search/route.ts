import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources";
import { MangaItem, SourceId } from "@/types";

export const dynamic = "force-dynamic";

const ALL_SOURCES: SourceId[] = ["olympus", "dragon", "mangadex", "rncalation"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || searchParams.get("query") || "").trim();
  const sourceFilter = searchParams.get("source") || "all";

  if (!query) {
    return NextResponse.json({
      items: [],
      counts: { all: 0, olympus: 0, dragon: 0, mangadex: 0, rncalation: 0 },
    });
  }

  const sourcesToQuery: SourceId[] =
    sourceFilter === "all" || !ALL_SOURCES.includes(sourceFilter as SourceId)
      ? ALL_SOURCES
      : [sourceFilter as SourceId];

  try {
    const promises = sourcesToQuery.map(async (srcId) => {
      try {
        const provider = getSource(srcId);
        const res = await provider.search(query, 1);
        return {
          source: srcId,
          items: res.items || [],
        };
      } catch (err) {
        console.warn(`[Global Search] Failed searching ${srcId} for "${query}":`, err);
        return {
          source: srcId,
          items: [] as MangaItem[],
        };
      }
    });

    const results = await Promise.allSettled(promises);
    const allItems: MangaItem[] = [];
    const counts: Record<string, number> = {
      all: 0,
      olympus: 0,
      dragon: 0,
      mangadex: 0,
      rncalation: 0,
    };

    for (const r of results) {
      if (r.status === "fulfilled") {
        const { source, items } = r.value;
        counts[source] = items.length;
        allItems.push(...items);
      }
    }

    counts.all = allItems.length;

    // Deduplicate or sort by title relevance if desired
    return NextResponse.json({
      items: allItems,
      counts,
    });
  } catch (error) {
    console.error("[Global Search] Fatal error:", error);
    return NextResponse.json({ items: [], counts: {} }, { status: 500 });
  }
}
