export type SourceId = "olympus" | "dragon" | "mangadex" | "local" | "external";

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
  originalSource?: string;
  isExternal?: boolean;
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
  title: string;
  date?: string;
  scanlator?: string;
  read?: boolean;
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
  readChapterIds?: string[];
  readChapterNumbers?: string[];
  savedChapters?: ChapterItem[];
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

export interface MangaReadingStats {
  mangaId: string;
  source: SourceId;
  mangaTitle: string;
  mangaCover: string;
  totalSeconds: number;
  sessionsCount: number;
  lastReadTimestamp: number;
}

export interface MihonManga {
  sourceId: string;
  sourceName?: string;
  url: string;
  title: string;
  artist?: string;
  author?: string;
  description?: string;
  thumbnailUrl?: string;
  favorite: boolean;
  totalChapters: number;
  readChapters: number;
  lastReadChapterName?: string;
  chapters: Array<{
    name: string;
    url: string;
    read: boolean;
    chapterNumber: number;
    lastPageRead: number;
  }>;
  matchedSource?: SourceId;
  matchedId?: string;
  matchedTitle?: string;
  isMatched?: boolean;
  realReadingSeconds?: number;
  lastReadTimestamp?: number;
}

export interface MihonBackupResult {
  mangas: MihonManga[];
  totalMangas: number;
  totalChaptersRead: number;
  sources: Record<string, string>;
  categories: string[];
}

