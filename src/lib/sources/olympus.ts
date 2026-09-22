import { ChapterItem, ChapterPages, MangaDetails, MangaItem, SourceProvider } from "@/types";

interface CachedDomain {
  baseUrl: string;
  panelUrl: string;
  timestamp: number;
}

let cachedDomain: CachedDomain = {
  baseUrl: "https://olympusbiblioteca.com",
  panelUrl: "https://panel.olympusxyz.com",
  timestamp: 0,
};

let cachedSeriesList: { id: number; name: string; slug: string; cover: string; type: string }[] = [];
let cachedSeriesTime = 0;

const DOMAIN_CACHE_MS = 60 * 60 * 1000; // 1 hour
const SERIES_CACHE_MS = 30 * 60 * 1000; // 30 minutes

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Referer": "https://olympusbiblioteca.com/",
};

async function resolveDomain(): Promise<{ baseUrl: string; panelUrl: string }> {
  const now = Date.now();
  if (cachedDomain.timestamp && now - cachedDomain.timestamp < DOMAIN_CACHE_MS) {
    return cachedDomain;
  }

  try {
    const res = await fetch("https://olympus.pages.dev", {
      headers: { "User-Agent": HEADERS["User-Agent"] },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const html = await res.text();
      const match = html.match(/property="og:url"\s+content="([^"]+)"/i);
      if (match && match[1]) {
        let cleanUrl = match[1].trim();
        if (cleanUrl.endsWith("/")) cleanUrl = cleanUrl.slice(0, -1);
        cachedDomain = {
          baseUrl: cleanUrl,
          panelUrl: "https://panel.olympusxyz.com",
          timestamp: now,
        };
        return cachedDomain;
      }
    }
  } catch {
    // Keep existing fallback
  }

  return cachedDomain;
}

export class OlympusSource implements SourceProvider {
  id = "olympus" as const;
  name = "Olympus Scan";
  baseUrl = "https://olympusbiblioteca.com";
  description = "Manhwas y mangas en español con alta calidad y actualizaciones diarias.";
  languages = ["es"];
  isConfigurable = true;

  async getPopular(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    const { baseUrl } = await resolveDomain();
    try {
      const res = await fetch(`${baseUrl}/api/rankings?page=${page}&period=total_ranking`, {
        headers: {
          ...HEADERS,
          Referer: `${baseUrl}/`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`Olympus rankings error: ${res.status}`);
      }

      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];

      const items: MangaItem[] = list
        .filter((item: { type?: string }) => !item.type || item.type === "comic")
        .map((item: {
          id: number;
          name: string;
          slug: string;
          cover?: string;
          chapter_count?: number;
          status?: { name?: string };
        }) => ({
          id: item.slug || String(item.id),
          source: "olympus" as const,
          title: item.name || "Sin título",
          slug: item.slug,
          coverUrl: item.cover || "",
          totalChapters: item.chapter_count,
          status: item.status?.name?.toLowerCase().includes("final") ? "completed" : "ongoing",
        }));

      const hasNextPage = Boolean(json.next_page_url || (json.current_page && json.last_page && json.current_page < json.last_page));
      return { items, hasNextPage };
    } catch (error) {
      console.error("[Olympus] getPopular error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async getLatest(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    const { baseUrl } = await resolveDomain();
    try {
      const res = await fetch(`${baseUrl}/api/new-chapters?page=${page}`, {
        headers: {
          ...HEADERS,
          Referer: `${baseUrl}/`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`Olympus latest error: ${res.status}`);
      }

      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];

      const items: MangaItem[] = list
        .filter((item: { type?: string }) => !item.type || item.type === "comic")
        .map((item: {
          id: number;
          name: string;
          slug: string;
          cover?: string;
          last_chapters?: { name?: string; published_at?: string }[];
        }) => {
          const lastCh = item.last_chapters && item.last_chapters.length > 0 ? item.last_chapters[0] : undefined;
          return {
            id: item.slug || String(item.id),
            source: "olympus" as const,
            title: item.name || "Sin título",
            slug: item.slug,
            coverUrl: item.cover || "",
            lastChapter: lastCh?.name ? `Capítulo ${lastCh.name}` : undefined,
            updatedAt: lastCh?.published_at,
            status: "ongoing" as const,
          };
        });

      const hasNextPage = Boolean(json.next_page_url || (json.current_page && json.last_page && json.current_page < json.last_page));
      return { items, hasNextPage };
    } catch (error) {
      console.error("[Olympus] getLatest error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  private async fetchSeriesCache(): Promise<{ id: number; name: string; slug: string; cover: string; type: string }[]> {
    const now = Date.now();
    if (cachedSeriesList.length > 0 && now - cachedSeriesTime < SERIES_CACHE_MS) {
      return cachedSeriesList;
    }

    const { baseUrl } = await resolveDomain();
    try {
      const res = await fetch(`${baseUrl}/api/series/list`, {
        headers: {
          ...HEADERS,
          Referer: `${baseUrl}/`,
        },
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        cachedSeriesList = data.filter((item: { type?: string }) => !item.type || item.type === "comic");
        cachedSeriesTime = now;
        return cachedSeriesList;
      }
    } catch (e) {
      console.error("[Olympus] fetchSeriesCache failed:", e);
    }
    return cachedSeriesList;
  }

  async search(query: string, page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return this.getPopular(page);
    }

    const series = await this.fetchSeriesCache();
    const filtered = series.filter((item) => item.name.toLowerCase().includes(cleanQuery));

    const pageSize = 24;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);
    const hasNextPage = start + pageSize < filtered.length;

    const items: MangaItem[] = paginated.map((item) => ({
      id: item.slug || String(item.id),
      source: "olympus" as const,
      title: item.name,
      slug: item.slug,
      coverUrl: item.cover,
      status: "ongoing" as const,
    }));

    return { items, hasNextPage };
  }

  async getDetails(idOrSlug: string): Promise<MangaDetails> {
    const { baseUrl, panelUrl } = await resolveDomain();
    const cleanSlug = idOrSlug.replace(/^comic-/, "");

    // 1. Fetch metadata
    const metaRes = await fetch(`${baseUrl}/api/series/${cleanSlug}?type=comic`, {
      headers: {
        ...HEADERS,
        Referer: `${baseUrl}/`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!metaRes.ok) {
      throw new Error(`Olympus details failed: ${metaRes.status}`);
    }

    const metaJson = await metaRes.json();
    const data = metaJson.data || metaJson;

    const genres: string[] = Array.isArray(data.genres)
      ? data.genres.map((g: { name?: string } | string) => (typeof g === "string" ? g : g.name || "")).filter(Boolean)
      : [];

    // 2. Fetch chapter list from panel
    let chapters: ChapterItem[] = [];
    try {
      const chRes = await fetch(
        `${panelUrl}/api/series/${cleanSlug}/chapters?page=1&direction=desc&type=comic`,
        {
          headers: {
            ...HEADERS,
            Referer: `${baseUrl}/`,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (chRes.ok) {
        const chJson = await chRes.json();
        const rawList = Array.isArray(chJson.data) ? chJson.data : [];

        chapters = rawList.map((ch: {
          id: number;
          name: string;
          published_at?: string;
          team?: { name?: string };
        }) => ({
          id: String(ch.id),
          mangaId: cleanSlug,
          source: "olympus" as const,
          number: ch.name || "0",
          title: `Capítulo ${ch.name}`,
          date: ch.published_at,
          scanlator: ch.team?.name?.trim() || "Olympus",
          url: `${baseUrl}/capitulo/${ch.id}/comic-${cleanSlug}`,
        }));

        // Fetch remaining chapters if paginated
        const total = chJson.meta?.total || chapters.length;
        if (total > chapters.length) {
          const totalPages = Math.ceil(total / (chJson.meta?.per_page || 100));
          const extraPromises = [];
          for (let p = 2; p <= Math.min(totalPages, 5); p++) {
            extraPromises.push(
              fetch(`${panelUrl}/api/series/${cleanSlug}/chapters?page=${p}&direction=desc&type=comic`, {
                headers: { ...HEADERS, Referer: `${baseUrl}/` },
                signal: AbortSignal.timeout(8000),
              })
                .then((r) => r.json())
                .catch(() => null)
            );
          }
          const extraResults = await Promise.all(extraPromises);
          for (const res of extraResults) {
            if (res && Array.isArray(res.data)) {
              for (const ch of res.data) {
                chapters.push({
                  id: String(ch.id),
                  mangaId: cleanSlug,
                  source: "olympus" as const,
                  number: ch.name || "0",
                  title: `Capítulo ${ch.name}`,
                  date: ch.published_at,
                  scanlator: ch.team?.name?.trim() || "Olympus",
                  url: `${baseUrl}/capitulo/${ch.id}/comic-${cleanSlug}`,
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("[Olympus] chapters fetch error:", e);
    }

    return {
      id: cleanSlug,
      source: "olympus",
      title: data.name || cleanSlug,
      slug: cleanSlug,
      coverUrl: data.cover || "",
      bannerUrl: data.cover,
      synopsis: data.summary?.trim() || "Sin sinopsis disponible.",
      status: data.status?.name?.toLowerCase().includes("final") ? "completed" : "ongoing",
      totalChapters: chapters.length || data.chapter_count,
      genres,
      chapters,
      author: data.team?.name || "Olympus",
    };
  }

  async getPages(mangaId: string, chapterId: string): Promise<ChapterPages> {
    const { baseUrl } = await resolveDomain();
    const cleanSlug = mangaId.replace(/^comic-/, "");

    const res = await fetch(`${baseUrl}/api/capitulo/comic-${cleanSlug}/${chapterId}`, {
      headers: {
        ...HEADERS,
        Referer: `${baseUrl}/`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`Olympus chapter pages error: ${res.status}`);
    }

    const json = await res.json();
    const chapterData = json.chapter || json.data || json;
    const rawPages: string[] = Array.isArray(chapterData.pages) ? chapterData.pages : [];

    return {
      chapterId,
      mangaId: cleanSlug,
      source: "olympus",
      chapterNumber: chapterData.name || chapterId,
      title: chapterData.title || `Capítulo ${chapterData.name || chapterId}`,
      pages: rawPages.filter(Boolean),
    };
  }
}

export const olympusSource = new OlympusSource();
