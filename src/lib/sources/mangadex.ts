import { ChapterItem, ChapterPages, MangaDetails, MangaItem, SourceProvider } from "@/types";

const MANGADEX_API = "https://api.mangadex.org";
const HEADERS = {
  "User-Agent": "LectorManga/1.0.0 (https://github.com/MAKIZAPA/lector-manga)",
  "Accept": "application/json",
};

interface MDManga {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
    status: string;
    lastChapter?: string;
    updatedAt: string;
    tags: { attributes: { name: Record<string, string> } }[];
  };
  relationships: {
    id: string;
    type: string;
    attributes?: { fileName?: string; name?: string };
  }[];
}

function getCoverUrl(manga: MDManga): string {
  const coverRel = manga.relationships?.find((r) => r.type === "cover_art");
  if (coverRel && coverRel.attributes?.fileName) {
    return `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.512.jpg`;
  }
  return "";
}

function getTitle(manga: MDManga): string {
  const titles = manga.attributes.title;
  return titles.es || titles["es-la"] || titles.en || Object.values(titles)[0] || "Sin título";
}

export class MangaDexSource implements SourceProvider {
  id = "mangadex" as const;
  name = "MangaDex";
  baseUrl = "https://mangadex.org";
  description = "Catálogo global sin fines de lucro con API abierta y soporte multilingüe.";
  languages = ["es", "es-la", "en"];
  isConfigurable = false;

  async getPopular(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    const limit = 24;
    const offset = (page - 1) * limit;

    try {
      const url = `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`;
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`MangaDex popular error: ${res.status}`);

      const json = await res.json();
      const items: MangaItem[] = (json.data || []).map((m: MDManga) => ({
        id: m.id,
        source: "mangadex" as const,
        title: getTitle(m),
        slug: m.id,
        coverUrl: getCoverUrl(m),
        status: m.attributes.status === "completed" ? "completed" : "ongoing",
        updatedAt: m.attributes.updatedAt,
      }));

      const total = json.total || 0;
      return { items, hasNextPage: offset + limit < total };
    } catch (error) {
      console.error("[MangaDex] getPopular error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async getLatest(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    const limit = 24;
    const offset = (page - 1) * limit;

    try {
      const url = `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[latestUploadedChapter]=desc&contentRating[]=safe&contentRating[]=suggestive`;
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`MangaDex latest error: ${res.status}`);

      const json = await res.json();
      const items: MangaItem[] = (json.data || []).map((m: MDManga) => ({
        id: m.id,
        source: "mangadex" as const,
        title: getTitle(m),
        slug: m.id,
        coverUrl: getCoverUrl(m),
        status: m.attributes.status === "completed" ? "completed" : "ongoing",
        updatedAt: m.attributes.updatedAt,
      }));

      const total = json.total || 0;
      return { items, hasNextPage: offset + limit < total };
    } catch (error) {
      console.error("[MangaDex] getLatest error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async search(query: string, page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    if (!query.trim()) return this.getPopular(page);

    const limit = 24;
    const offset = (page - 1) * limit;

    try {
      const url = `${MANGADEX_API}/manga?title=${encodeURIComponent(
        query.trim()
      )}&limit=${limit}&offset=${offset}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive`;
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`MangaDex search error: ${res.status}`);

      const json = await res.json();
      const items: MangaItem[] = (json.data || []).map((m: MDManga) => ({
        id: m.id,
        source: "mangadex" as const,
        title: getTitle(m),
        slug: m.id,
        coverUrl: getCoverUrl(m),
        status: m.attributes.status === "completed" ? "completed" : "ongoing",
        updatedAt: m.attributes.updatedAt,
      }));

      const total = json.total || 0;
      return { items, hasNextPage: offset + limit < total };
    } catch (error) {
      console.error("[MangaDex] search error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async getDetails(id: string): Promise<MangaDetails> {
    const url = `${MANGADEX_API}/manga/${id}?includes[]=cover_art&includes[]=author`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`MangaDex details error: ${res.status}`);

    const json = await res.json();
    const m: MDManga = json.data;

    const descriptions = m.attributes.description || {};
    const synopsis =
      descriptions.es ||
      descriptions["es-la"] ||
      descriptions.en ||
      Object.values(descriptions)[0] ||
      "Sin sinopsis disponible.";

    const authorRel = m.relationships?.find((r) => r.type === "author");
    const author = authorRel?.attributes?.name || "Desconocido";

    const genres = (m.attributes.tags || [])
      .map((t) => t.attributes?.name?.es || t.attributes?.name?.en)
      .filter(Boolean);

    // Fetch chapters prioritized in Spanish, falling back to English
    const chapters: ChapterItem[] = [];
    try {
      const chUrl = `${MANGADEX_API}/manga/${id}/feed?translatedLanguage[]=es&translatedLanguage[]=es-la&translatedLanguage[]=en&order[chapter]=desc&limit=100`;
      const chRes = await fetch(chUrl, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (chRes.ok) {
        const chJson = await chRes.json();
        const rawChapters = chJson.data || [];

        // Deduplicate by chapter number, preferring Spanish
        const seenChapters = new Set<string>();
        for (const ch of rawChapters) {
          const num = ch.attributes.chapter || "0";
          const lang = ch.attributes.translatedLanguage;
          const key = `${num}_${lang}`;
          if (!seenChapters.has(key)) {
            seenChapters.add(key);
            chapters.push({
              id: ch.id,
              mangaId: id,
              source: "mangadex",
              number: num,
              title: ch.attributes.title || `Capítulo ${num} [${lang.toUpperCase()}]`,
              date: ch.attributes.publishAt,
              scanlator: lang.toUpperCase(),
              url: `https://mangadex.org/chapter/${ch.id}`,
            });
          }
        }
      }
    } catch (e) {
      console.error("[MangaDex] chapters error:", e);
    }

    return {
      id: m.id,
      source: "mangadex",
      title: getTitle(m),
      slug: m.id,
      coverUrl: getCoverUrl(m),
      bannerUrl: getCoverUrl(m),
      synopsis,
      status: m.attributes.status === "completed" ? "completed" : "ongoing",
      totalChapters: chapters.length,
      genres,
      chapters,
      author,
    };
  }

  async getPages(mangaId: string, chapterId: string): Promise<ChapterPages> {
    const url = `${MANGADEX_API}/at-home/server/${chapterId}`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`MangaDex at-home error: ${res.status}`);

    const json = await res.json();
    const { baseUrl, chapter } = json;
    const { hash, data } = chapter;

    const pages = (data || []).map((file: string) => `${baseUrl}/data/${hash}/${file}`);

    return {
      chapterId,
      mangaId,
      source: "mangadex",
      chapterNumber: chapterId,
      title: `Capítulo`,
      pages,
    };
  }
}

export const mangaDexSource = new MangaDexSource();
