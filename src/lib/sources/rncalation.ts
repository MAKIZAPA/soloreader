import * as cheerio from "cheerio";
import { ChapterItem, ChapterPages, MangaDetails, MangaItem, SourceProvider } from "@/types";

const BASE_URL = "https://rncalation.online";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  "Referer": `${BASE_URL}/`,
};

export class RncalationSource implements SourceProvider {
  id = "rncalation" as const;
  name = "Rncalation";
  baseUrl = BASE_URL;
  description = "Scanlation en español especializado en Manhwa, Novelas y Webcomics (Traducciones Amistosas / Knight No Scanlation).";
  languages = ["es"];
  isConfigurable = false;

  private isCloudflareChallenge(html: string): boolean {
    return (
      html.includes("challenges.cloudflare.com") ||
      html.includes("Verificando tu navegador") ||
      html.includes("cf-mitigated") ||
      html.includes("Un momento…")
    );
  }

  private parseCatalogHtml(html: string): { items: MangaItem[]; hasNextPage: boolean } {
    if (this.isCloudflareChallenge(html)) {
      console.warn("[Rncalation] Cloudflare challenge detected on catalog page.");
      return { items: [], hasNextPage: false };
    }

    const $ = cheerio.load(html);
    const items: MangaItem[] = [];

    $(".lib-grid a.comic-card").each((_, el) => {
      const $el = $(el);
      const typeText = $el.find("span.absolute.top-2.left-2").text().trim();
      if (typeText.toLowerCase().includes("novel")) {
        return;
      }

      const href = $el.attr("href") || "";
      const slug = href.replace(/\/$/, "").split("/").pop() || "";
      if (!slug) return;

      const title = $el.find("p.leading-snug").text().trim() || slug;
      let cover = $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";
      if (cover.startsWith("/")) {
        cover = `${BASE_URL}${cover}`;
      }

      items.push({
        id: slug,
        source: "rncalation",
        title,
        slug,
        coverUrl: cover,
        status: "ongoing",
      });
    });

    const hasNextPage = $("a.lib-page-btn--nav:last-child").length > 0;
    return { items, hasNextPage };
  }

  async getPopular(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    try {
      const url = `${BASE_URL}/library?sort=views&page=${page}`;
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        if (res.status === 403 || res.status === 503) {
          console.warn(`[Rncalation] Cloudflare status ${res.status}`);
          return { items: [], hasNextPage: false };
        }
        throw new Error(`Rncalation popular HTTP error: ${res.status}`);
      }
      const html = await res.text();
      return this.parseCatalogHtml(html);
    } catch (error) {
      console.error("[Rncalation] getPopular error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async getLatest(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    try {
      const url = `${BASE_URL}/library?sort=updated&page=${page}`;
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        if (res.status === 403 || res.status === 503) {
          console.warn(`[Rncalation] Cloudflare status ${res.status}`);
          return { items: [], hasNextPage: false };
        }
        throw new Error(`Rncalation latest HTTP error: ${res.status}`);
      }
      const html = await res.text();
      return this.parseCatalogHtml(html);
    } catch (error) {
      console.error("[Rncalation] getLatest error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async search(query: string, page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    try {
      const cleanQuery = query.trim();
      const url = `${BASE_URL}/library?q=${encodeURIComponent(cleanQuery)}&page=${page}`;
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        if (res.status === 403 || res.status === 503) {
          console.warn(`[Rncalation] Cloudflare status ${res.status}`);
          return { items: [], hasNextPage: false };
        }
        throw new Error(`Rncalation search HTTP error: ${res.status}`);
      }
      const html = await res.text();
      return this.parseCatalogHtml(html);
    } catch (error) {
      console.error("[Rncalation] search error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async getDetails(idOrSlug: string): Promise<MangaDetails> {
    const slug = idOrSlug.trim();
    const url = `${BASE_URL}/comics/${slug}`;

    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`Rncalation details HTTP error: ${res.status}`);
      const html = await res.text();

      if (this.isCloudflareChallenge(html)) {
        throw new Error("Rncalation esta protegido por verificacion Cloudflare en este momento.");
      }

      const $ = cheerio.load(html);
      const title = $("h1").first().text().trim() || slug;
      let cover =
        $("div.comic-page-wrap img").first().attr("src") ||
        $("img.cover-img").attr("src") ||
        "";
      if (cover.startsWith("/")) {
        cover = `${BASE_URL}${cover}`;
      }

      const synopsis = $("div.comic-page-wrap p[class*=\"text-\"]").first().text().trim();

      const badges: string[] = [];
      $("span.inline-flex.items-center.rounded").each((_, el) => {
        badges.push($(el).text().trim());
      });

      const lowerBadges = badges.map((b) => b.toLowerCase());
      let status: "ongoing" | "completed" | "unknown" = "ongoing";
      if (lowerBadges.some((b) => b.includes("completado") || b.includes("completed"))) {
        status = "completed";
      }

      const genres = badges.filter(
        (b) => !["emisión", "completado", "pausa", "cancelado", "ongoing", "hiatus"].includes(b.toLowerCase())
      );

      let author: string | undefined;
      $(".flex.items-baseline.justify-between.gap-2").each((_, el) => {
        const label = $(el).find("span.text-\\[var\\(--color-text3\\)\\]").text().trim();
        const val = $(el).find("span.text-\\[var\\(--color-text2\\)\\]").text().trim();
        if (label.toLowerCase().includes("autor")) author = val;
      });

      // Fetch chapters
      const chapters: ChapterItem[] = [];
      try {
        const chapRes = await fetch(`${BASE_URL}/comics/${slug}/chapters?page=1`, {
          headers: HEADERS,
          signal: AbortSignal.timeout(10000),
        });
        if (chapRes.ok) {
          const chapHtml = await chapRes.text();
          const $chap = cheerio.load(chapHtml);
          $chap("a[data-chapter-id]").each((idx, el) => {
            const $a = $chap(el);
            const href = $a.attr("href") || "";
            const chapterSlug = href.replace(/\/$/, "").split("/").pop() || String(idx + 1);
            const num = $a.attr("data-chapter-num") || String(idx + 1);
            const name = $a.attr("data-chapter-label") || `Capítulo ${num}`;
            const date = $a.find(".text-\\[0\\.65rem\\]").text().trim();

            chapters.push({
              id: chapterSlug,
              mangaId: slug,
              source: "rncalation",
              number: num,
              title: name,
              date: date || undefined,
              url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
            });
          });
        }
      } catch (chapErr) {
        console.warn("[Rncalation] Error loading chapters:", chapErr);
      }

      return {
        id: slug,
        source: "rncalation",
        title,
        slug,
        coverUrl: cover,
        synopsis,
        status,
        genres,
        author,
        chapters,
      };
    } catch (error) {
      console.error("[Rncalation] getDetails error:", error);
      throw error;
    }
  }

  async getPages(mangaId: string, chapterId: string): Promise<ChapterPages> {
    const url = `${BASE_URL}/comics/${mangaId}/${chapterId}`;
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Rncalation pages HTTP error: ${res.status}`);
      const html = await res.text();

      if (this.isCloudflareChallenge(html)) {
        throw new Error("Rncalation requiere verificacion Cloudflare en este momento.");
      }

      const $ = cheerio.load(html);
      const pages: string[] = [];

      $("img.page-img, .page-wrap img, div.comic-page img").each((_, el) => {
        let src = $(el).attr("data-src") || $(el).attr("src") || "";
        src = src.trim();
        if (src) {
          if (src.startsWith("/")) {
            src = `${BASE_URL}${src}`;
          }
          if (!pages.includes(src)) {
            pages.push(src);
          }
        }
      });

      return {
        chapterId,
        mangaId,
        source: "rncalation",
        pages,
        chapterNumber: chapterId,
      };
    } catch (error) {
      console.error("[Rncalation] getPages error:", error);
      throw error;
    }
  }
}

export const rncalationSource = new RncalationSource();
