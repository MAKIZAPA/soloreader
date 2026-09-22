import * as cheerio from "cheerio";
import { ChapterItem, ChapterPages, MangaDetails, MangaItem, SourceProvider } from "@/types";

const BASE_URL = "https://dragontranslation.org";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Referer": "https://dragontranslation.org/",
};

export class DragonTranslationSource implements SourceProvider {
  id = "dragon" as const;
  name = "Dragon Translation";
  baseUrl = BASE_URL;
  description = "Scanlation en español con amplio catálogo de Manhwas y Webtoons populares.";
  languages = ["es"];
  isConfigurable = false;

  private parseCatalogHtml(html: string): { items: MangaItem[]; hasNextPage: boolean } {
    const $ = cheerio.load(html);
    const items: MangaItem[] = [];

    $("div#mkAgrid > a.acard").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      const slug = href.replace(/\/$/, "").split("/").pop() || "";
      if (!slug) return;

      const title = $el.find("div.ac-t").text().trim() || $el.attr("title") || slug;
      const cover =
        $el.find("img.ac-cover").attr("src") ||
        $el.find("img.ac-cover").attr("data-src") ||
        "";
      const statusText = $el.find("div.ac-status").text().toLowerCase();
      const lastChapter = $el.find("div.ac-ch").text().trim();

      items.push({
        id: slug,
        source: "dragon",
        title,
        slug,
        coverUrl: cover,
        status: statusText.includes("complet") ? "completed" : "ongoing",
        lastChapter: lastChapter || undefined,
      });
    });

    const hasNextPage = $("div.wp-pagenavi > a.nextpostslink, a.next").length > 0;
    return { items, hasNextPage };
  }

  async getPopular(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    try {
      const url =
        page === 1
          ? `${BASE_URL}/manga/?m_orderby=views`
          : `${BASE_URL}/manga/page/${page}/?m_orderby=views`;

      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`Dragon popular error: ${res.status}`);
      const html = await res.text();
      return this.parseCatalogHtml(html);
    } catch (error) {
      console.error("[DragonTranslation] getPopular error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async getLatest(page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    try {
      const url =
        page === 1
          ? `${BASE_URL}/manga/?m_orderby=latest`
          : `${BASE_URL}/manga/page/${page}/?m_orderby=latest`;

      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`Dragon latest error: ${res.status}`);
      const html = await res.text();
      return this.parseCatalogHtml(html);
    } catch (error) {
      console.error("[DragonTranslation] getLatest error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async search(query: string, page = 1): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
    if (!query.trim()) return this.getPopular(page);

    try {
      const encoded = encodeURIComponent(query.trim());
      const url =
        page === 1
          ? `${BASE_URL}/?s=${encoded}&post_type=wp-manga`
          : `${BASE_URL}/page/${page}/?s=${encoded}&post_type=wp-manga`;

      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`Dragon search error: ${res.status}`);
      const html = await res.text();
      return this.parseCatalogHtml(html);
    } catch (error) {
      console.error("[DragonTranslation] search error:", error);
      return { items: [], hasNextPage: false };
    }
  }

  async getDetails(idOrSlug: string): Promise<MangaDetails> {
    const cleanSlug = idOrSlug.replace(/\/$/, "");
    const url = `${BASE_URL}/manga/${cleanSlug}/`;

    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Dragon details error: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $("div.hcol > .htitle, h1.entry-title, .post-title h1").first().text().trim() ||
      cleanSlug;

    const cover =
      $("div.hposter__card > img, .summary_image img, img.ac-cover").first().attr("src") ||
      $("div.hposter__card > img, .summary_image img, img.ac-cover").first().attr("data-src") ||
      "";

    const synopsis =
      $("div#syn > p, .manga-excerpt p, .summary__content p")
        .map((_, el) => $(el).text().trim())
        .get()
        .join("\n\n") || "Sin sinopsis disponible.";

    const statusText = $("div.hcol > .htags > .htag--status, .post-status").text().toLowerCase();
    const status = statusText.includes("complet") ? ("completed" as const) : ("ongoing" as const);

    const genres: string[] = [];
    $("div.hcol > .hchips--genres > a.chip, .genres-content a").each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    const chapters: ChapterItem[] = [];

    // Parse chapters from embedded json script
    const scriptContent = $("script#mk-chapters-data").html();
    if (scriptContent) {
      try {
        const json = JSON.parse(scriptContent);
        const list = Array.isArray(json.items) ? json.items : [];
        for (const item of list) {
          const chUrl = item.url || "";
          const chSlug = chUrl.replace(/\/$/, "").split("/").pop() || String(item.id || item.num);

          chapters.push({
            id: chSlug,
            mangaId: cleanSlug,
            source: "dragon",
            number: String(item.num || item.name || "0").replace(/[^0-9.]/g, ""),
            title: item.name || `Capítulo ${item.num}`,
            date: item.ago,
            scanlator: "Dragon Translation",
            url: chUrl,
          });
        }
      } catch (e) {
        console.error("[DragonTranslation] JSON chapters parse failed:", e);
      }
    }

    // Fallback: parse from HTML anchors if script missing
    if (chapters.length === 0) {
      $("ul.main.version-chap li.wp-manga-chapter a, a[href*='/manga/']").each((_, el) => {
        const href = $(el).attr("href") || "";
        if (href.includes(`/manga/${cleanSlug}/capitulo-`)) {
          const chSlug = href.replace(/\/$/, "").split("/").pop() || "";
          const name = $(el).text().trim() || chSlug;
          chapters.push({
            id: chSlug,
            mangaId: cleanSlug,
            source: "dragon",
            number: name.replace(/[^0-9.]/g, "") || "0",
            title: name,
            scanlator: "Dragon Translation",
            url: href,
          });
        }
      });
    }

    return {
      id: cleanSlug,
      source: "dragon",
      title,
      slug: cleanSlug,
      coverUrl: cover,
      bannerUrl: cover,
      synopsis,
      status,
      totalChapters: chapters.length,
      genres,
      chapters,
      author: "Dragon Translation",
    };
  }

  async getPages(mangaId: string, chapterId: string): Promise<ChapterPages> {
    const cleanManga = mangaId.replace(/\/$/, "");
    const cleanChapter = chapterId.replace(/\/$/, "");
    const url = `${BASE_URL}/manga/${cleanManga}/${cleanChapter}/`;

    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Dragon pages error: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const pages: string[] = [];
    const seen = new Set<string>();

    $("div.reading-content img, div.page-break img, div#chapter_images img, .entry-content img").each(
      (_, el) => {
        const src =
          $(el).attr("data-src") ||
          $(el).attr("src") ||
          $(el).attr("data-lazy-src") ||
          "";
        const cleanSrc = src.trim();
        if (cleanSrc && (cleanSrc.includes("WP-manga") || cleanSrc.includes("uploads"))) {
          if (!seen.has(cleanSrc)) {
            seen.add(cleanSrc);
            pages.push(cleanSrc);
          }
        }
      }
    );

    return {
      chapterId: cleanChapter,
      mangaId: cleanManga,
      source: "dragon",
      chapterNumber: cleanChapter.replace(/[^0-9.]/g, "") || cleanChapter,
      title: `Capítulo ${cleanChapter.replace(/[^0-9.]/g, "") || cleanChapter}`,
      pages,
    };
  }
}

export const dragonSource = new DragonTranslationSource();
