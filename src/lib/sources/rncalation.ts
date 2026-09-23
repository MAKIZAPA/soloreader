import * as cheerio from "cheerio";
import { ChapterItem, ChapterPages, MangaDetails, MangaItem, SourceProvider } from "@/types";

const BASE_URL = "https://rncalation.online";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9",
  "Referer": `${BASE_URL}/`,
};

export class RncalationSource implements SourceProvider {
  id = "rncalation" as const;
  name = "Rncalation";
  baseUrl = BASE_URL;
  description = "Scanlation en español especializado en Manhwa, Novelas y Webcomics (Traducciones Amistosas / Knight No Scanlation).";
  languages = ["es"];
  isConfigurable = false;

  private sessionCookie: string | null = null;
  private cookieTimestamp = 0;

  /**
   * Retrieves or refreshes the required verification cookie (mv_ck).
   */
  private async getValidCookie(): Promise<string> {
    const now = Date.now();
    // Use cached cookie if less than 24 hours old
    if (this.sessionCookie && now - this.cookieTimestamp < 24 * 60 * 60 * 1000) {
      return this.sessionCookie;
    }

    try {
      const res = await fetch(`${BASE_URL}/library`, {
        headers: HEADERS,
        signal: AbortSignal.timeout(10000),
      });

      const setCookie = res.headers.get("set-cookie");
      if (setCookie) {
        const match = setCookie.match(/mv_ck=[^;]+/);
        if (match) {
          this.sessionCookie = match[0];
          this.cookieTimestamp = now;
          return this.sessionCookie;
        }
      }
    } catch (err) {
      console.warn("[Rncalation] Cookie handshake error:", err);
    }

    return this.sessionCookie || "";
  }

  private isCloudflareChallenge(html: string): boolean {
    return (
      html.includes("challenges.cloudflare.com") ||
      html.includes("Verificando tu navegador") ||
      html.includes("mv-verifying") ||
      html.includes("Un momento…")
    );
  }

  /**
   * Executes an HTTP GET request with automatic cookie handling and 1-time challenge retry.
   */
  private async fetchHtml(url: string, timeoutMs = 12000): Promise<string> {
    let cookie = await this.getValidCookie();
    let reqHeaders: Record<string, string> = {
      ...HEADERS,
      ...(cookie ? { Cookie: cookie } : {}),
    };

    let res = await fetch(url, { headers: reqHeaders, signal: AbortSignal.timeout(timeoutMs) });
    let text = await res.text();

    if (this.isCloudflareChallenge(text) || res.status === 403) {
      // Force cookie handshake refresh and retry once
      this.sessionCookie = null;
      cookie = await this.getValidCookie();
      reqHeaders = {
        ...HEADERS,
        ...(cookie ? { Cookie: cookie } : {}),
      };

      res = await fetch(url, { headers: reqHeaders, signal: AbortSignal.timeout(timeoutMs) });
      text = await res.text();
    }

    return text;
  }

  private parseCatalogHtml(html: string): { items: MangaItem[]; hasNextPage: boolean } {
    if (this.isCloudflareChallenge(html)) {
      console.warn("[Rncalation] Cloudflare challenge active; returning empty catalog.");
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

      const statusText = $el.find("span:contains('Completado')").length > 0 ? "completed" : "ongoing";

      items.push({
        id: slug,
        source: "rncalation",
        title,
        slug,
        coverUrl: cover,
        status: statusText,
      });
    });

    const hasNextPage = $("nav.lib-pagination a[href*='page='], a.lib-page-btn--nav:last-child").length > 0;
    return { items, hasNextPage };
  }

  async getPopular(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    try {
      const url = `${BASE_URL}/library?sort=views&page=${page}`;
      const html = await this.fetchHtml(url);
      return this.parseCatalogHtml(html);
    } catch (error) {
      console.error("[Rncalation] getPopular error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async getLatest(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    try {
      const url = `${BASE_URL}/library?sort=updated&page=${page}`;
      const html = await this.fetchHtml(url);
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
      const html = await this.fetchHtml(url);
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
      const html = await this.fetchHtml(url);
      if (this.isCloudflareChallenge(html)) {
        throw new Error("Rncalation requiere verificación de navegador.");
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

      // Fetch chapters list
      const chapters: ChapterItem[] = [];
      try {
        const chapUrl = `${BASE_URL}/comics/${slug}/chapters?page=1`;
        const chapHtml = await this.fetchHtml(chapUrl);
        const $chap = cheerio.load(chapHtml);

        $chap("a[data-chapter-id]").each((idx, el) => {
          const $a = $chap(el);
          const href = $a.attr("href") || "";
          // Extract chapter slug (e.g. from /leer/PMNGSVACBSv5XNB-bEtTO)
          const chapterSlug = href.replace(/^\/leer\//, "").replace(/\/$/, "") || String(idx + 1);
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
      } catch (chapErr) {
        console.warn("[Rncalation] Error fetching chapter list:", chapErr);
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
    const cleanChapterId = chapterId.trim();
    const url = cleanChapterId.startsWith("http")
      ? cleanChapterId
      : cleanChapterId.startsWith("/")
        ? `${BASE_URL}${cleanChapterId}`
        : `${BASE_URL}/leer/${cleanChapterId}`;

    try {
      const html = await this.fetchHtml(url, 15000);
      if (this.isCloudflareChallenge(html)) {
        throw new Error("Rncalation requiere verificación de navegador.");
      }

      const $ = cheerio.load(html);
      const pages: string[] = [];

      $("img.page-img, .page-img-wrap img, img[src*=\"/uploads/pages/\"], img[data-src*=\"/uploads/pages/\"]").each(
        (_, el) => {
          let src = $(el).attr("data-src") || $(el).attr("src") || "";
          src = src.trim();
          if (!src) return;

          // Exclude ads and site icons
          if (src.includes("/site/logos/") || src.includes("/site/ad-") || src.includes("/icons/")) {
            return;
          }

          if (src.startsWith("/")) {
            src = `${BASE_URL}${src}`;
          }

          if (!pages.includes(src)) {
            pages.push(src);
          }
        }
      );

      return {
        chapterId: cleanChapterId,
        mangaId,
        source: "rncalation",
        pages,
        chapterNumber: cleanChapterId,
      };
    } catch (error) {
      console.error("[Rncalation] getPages error:", error);
      throw error;
    }
  }
}

export const rncalationSource = new RncalationSource();
