export type SourceId = "olympus" | "dragon" | "mangadex" | "local";

export interface MangaItem {
  id: string;
  source: SourceId;
  title: string;
  slug: string;
  coverUrl: string;
  status?: "ongoing" | "completed" | "unknown";
  totalChapters?: number;
  lastChapter?: string;
  updatedAt?: string;
  synopsis?: string;
  genres?: string[];
  author?: string;
}

export interface MangaDetails extends MangaItem {
  alternativeTitles?: string[];
  bannerUrl?: string;
  genres: string[];
  chapters: ChapterItem[];
}

export interface ChapterItem {
  id: string;
  mangaId: string;
  source: SourceId;
  number: string;
  title?: string;
  date?: string;
  scanlator?: string;
  url?: string;
}

export interface ChapterPages {
  chapterId: string;
  mangaId: string;
  source: SourceId;
  pages: string[];
  title?: string;
  chapterNumber: string;
}

export interface SourceProvider {
  id: SourceId;
  name: string;
  baseUrl: string;
  description: string;
  languages: string[];
  isConfigurable: boolean;
  getPopular(page?: number): Promise<{ items: MangaItem[]; hasNextPage: boolean }>;
  getLatest(page?: number): Promise<{ items: MangaItem[]; hasNextPage: boolean }>;
  search(query: string, page?: number): Promise<{ items: MangaItem[]; hasNextPage: boolean }>;
  getDetails(idOrSlug: string): Promise<MangaDetails>;
  getPages(mangaId: string, chapterId: string): Promise<ChapterPages>;
}

export type ReaderMode = "webtoon" | "single" | "double";
export type ReadingDirection = "ltr" | "rtl";
export type FitMode = "width" | "height" | "original";

export interface ReaderSettings {
  mode: ReaderMode;
  direction: ReadingDirection;
  fit: FitMode;
  zoom: number; // percentage, default 100
  gap: number; // px gap between images in webtoon mode
  showNavControls: boolean;
  background: "black" | "dark" | "zinc";
}

export interface LibraryEntry {
  manga: MangaItem;
  addedAt: number;
  status: "reading" | "completed" | "plan_to_read" | "dropped";
  lastReadChapterId?: string;
  lastReadChapterNumber?: string;
  lastReadAt?: number;
  lastReadPage?: number;
  totalChaptersRead: number;
}

export interface HistoryEntry {
  mangaId: string;
  source: SourceId;
  mangaTitle: string;
  mangaCover: string;
  chapterId: string;
  chapterNumber: string;
  chapterTitle?: string;
  page: number;
  totalPages: number;
  timestamp: number;
}
