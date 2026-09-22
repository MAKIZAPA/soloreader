import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  HistoryEntry,
  LibraryEntry,
  MangaItem,
  MangaReadingStats,
  MihonManga,
  ReaderSettings,
  SourceId,
} from "@/types";

interface AppState {
  // Active Source
  activeSource: SourceId;
  setActiveSource: (source: SourceId) => void;

  // Library
  library: Record<string, LibraryEntry>;
  addToLibrary: (manga: MangaItem, status?: LibraryEntry["status"]) => void;
  removeFromLibrary: (mangaId: string) => void;
  updateLibraryStatus: (mangaId: string, status: LibraryEntry["status"]) => void;
  updateLibraryProgress: (
    mangaId: string,
    chapterId: string,
    chapterNumber: string,
    page?: number
  ) => void;
  isInLibrary: (mangaId: string) => boolean;

  // History
  history: HistoryEntry[];
  recordHistory: (entry: Omit<HistoryEntry, "timestamp">) => void;
  clearHistory: () => void;
  removeHistoryItem: (chapterId: string) => void;

  // Statistics (Tachimanga Style Time Tracking)
  stats: Record<string, MangaReadingStats>;
  recordReadingTime: (
    mangaId: string,
    source: SourceId,
    mangaTitle: string,
    mangaCover: string,
    seconds: number
  ) => void;
  clearStats: () => void;

  // Mihon / Tachiyomi Backup Integration
  importMihonBackup: (mangas: MihonManga[], mode?: "merge" | "replace") => void;
  exportBackup: () => string;

  // Reader Settings
  readerSettings: ReaderSettings;
  updateReaderSettings: (settings: Partial<ReaderSettings>) => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  mode: "webtoon",
  direction: "ltr",
  fit: "width",
  zoom: 100,
  gap: 0,
  showNavControls: true,
  background: "black",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeSource: "olympus",
      setActiveSource: (source) => set({ activeSource: source }),

      library: {},
      addToLibrary: (manga, status = "reading") =>
        set((state) => {
          const key = `${manga.source}:${manga.id}`;
          return {
            library: {
              ...state.library,
              [key]: {
                manga,
                addedAt: Date.now(),
                status,
                totalChaptersRead: state.library[key]?.totalChaptersRead || 0,
              },
            },
          };
        }),
      removeFromLibrary: (mangaId) =>
        set((state) => {
          const next = { ...state.library };
          for (const key of Object.keys(next)) {
            if (next[key].manga.id === mangaId || key.endsWith(`:${mangaId}`)) {
              delete next[key];
            }
          }
          return { library: next };
        }),
      updateLibraryStatus: (mangaId, status) =>
        set((state) => {
          const next = { ...state.library };
          for (const key of Object.keys(next)) {
            if (next[key].manga.id === mangaId || key.endsWith(`:${mangaId}`)) {
              next[key] = { ...next[key], status };
            }
          }
          return { library: next };
        }),
      updateLibraryProgress: (mangaId, chapterId, chapterNumber, page = 1) =>
        set((state) => {
          const next = { ...state.library };
          for (const key of Object.keys(next)) {
            if (next[key].manga.id === mangaId || key.endsWith(`:${mangaId}`)) {
              next[key] = {
                ...next[key],
                lastReadChapterId: chapterId,
                lastReadChapterNumber: chapterNumber,
                lastReadAt: Date.now(),
                lastReadPage: page,
                totalChaptersRead: (next[key].totalChaptersRead || 0) + 1,
              };
            }
          }
          return { library: next };
        }),
      isInLibrary: (mangaId) => {
        const lib = get().library;
        return Object.values(lib).some((entry) => entry.manga.id === mangaId);
      },

      history: [],
      recordHistory: (entry) =>
        set((state) => {
          const filtered = state.history.filter((h) => h.chapterId !== entry.chapterId);
          return {
            history: [{ ...entry, timestamp: Date.now() }, ...filtered].slice(0, 100),
          };
        }),
      clearHistory: () => set({ history: [] }),
      removeHistoryItem: (chapterId) =>
        set((state) => ({
          history: state.history.filter((h) => h.chapterId !== chapterId),
        })),

      stats: {},
      recordReadingTime: (mangaId, source, mangaTitle, mangaCover, seconds) =>
        set((state) => {
          const key = `${source}:${mangaId}`;
          const current = state.stats[key] || {
            mangaId,
            source,
            mangaTitle,
            mangaCover,
            totalSeconds: 0,
            sessionsCount: 0,
            lastReadTimestamp: Date.now(),
          };

          return {
            stats: {
              ...state.stats,
              [key]: {
                ...current,
                mangaTitle: mangaTitle || current.mangaTitle,
                mangaCover: mangaCover || current.mangaCover,
                totalSeconds: current.totalSeconds + seconds,
                sessionsCount: current.sessionsCount + 1,
                lastReadTimestamp: Date.now(),
              },
            },
          };
        }),
      clearStats: () => set({ stats: {} }),

      importMihonBackup: (mangas, mode = "merge") =>
        set((state) => {
          const nextLibrary = mode === "replace" ? {} : { ...state.library };
          const nextStats = mode === "replace" ? {} : { ...state.stats };

          for (const m of mangas) {
            // Determine source & id (taking into account auto-matcher resolution)
            let mappedSource: SourceId = m.matchedSource || "olympus";
            let cleanId = m.matchedId || "";
            const finalTitle = m.matchedTitle || m.title;
            const isKnownSource =
              Boolean(m.matchedSource) ||
              m.sourceName?.toLowerCase().includes("olympus") ||
              m.sourceName?.toLowerCase().includes("dragon") ||
              m.sourceName?.toLowerCase().includes("mangadex");

            if (!m.matchedSource) {
              const sName = (m.sourceName || "").toLowerCase();
              const sUrl = (m.url || "").toLowerCase();

              if (sName.includes("dragon") || sUrl.includes("dragontranslation")) {
                mappedSource = "dragon";
              } else if (sName.includes("dex") || sUrl.includes("mangadex")) {
                mappedSource = "mangadex";
              } else if (sName.includes("olympus") || sUrl.includes("olympus")) {
                mappedSource = "olympus";
              } else {
                mappedSource = "olympus";
              }

              cleanId =
                m.url
                  .replace(/^https?:\/\/[^/]+/, "")
                  .replace(/^\/+|\/+$/g, "")
                  .split("/")
                  .pop() || m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            }

            const key = `${mappedSource}:${cleanId}`;
            const isCompleted = m.totalChapters > 0 && m.readChapters >= m.totalChapters;

            nextLibrary[key] = {
              manga: {
                id: cleanId,
                source: mappedSource,
                title: finalTitle,
                slug: cleanId,
                coverUrl: m.thumbnailUrl || "",
                synopsis: m.description,
                originalSource: m.sourceName || undefined,
                isExternal: !isKnownSource,
              },
              addedAt: Date.now(),
              status: isCompleted ? "completed" : "reading",
              totalChaptersRead: m.readChapters,
              lastReadChapterNumber:
                m.lastReadChapterName || (m.readChapters > 0 ? String(m.readChapters) : undefined),
              lastReadAt: m.lastReadTimestamp || Date.now(),
            };

            // Register in reading stats if readChapters > 0 or has realReadingSeconds
            if (m.readChapters > 0 || (m.realReadingSeconds && m.realReadingSeconds > 0)) {
              const currentStat = nextStats[key];
              const secondsToApply =
                m.realReadingSeconds && m.realReadingSeconds > 0
                  ? m.realReadingSeconds
                  : m.readChapters * 180;
              nextStats[key] = {
                mangaId: cleanId,
                source: mappedSource,
                mangaTitle: m.title,
                mangaCover: m.thumbnailUrl || "",
                totalSeconds: currentStat
                  ? Math.max(currentStat.totalSeconds, secondsToApply)
                  : secondsToApply,
                sessionsCount: currentStat
                  ? currentStat.sessionsCount + (m.readChapters || 1)
                  : (m.readChapters || 1),
                lastReadTimestamp: m.lastReadTimestamp || Date.now(),
              };
            }
          }

          return {
            library: nextLibrary,
            stats: nextStats,
          };
        }),

      exportBackup: () => {
        const state = get();
        const exportData = {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          library: state.library,
          stats: state.stats,
          history: state.history,
        };
        return JSON.stringify(exportData, null, 2);
      },

      readerSettings: DEFAULT_SETTINGS,
      updateReaderSettings: (partial) =>
        set((state) => ({
          readerSettings: { ...state.readerSettings, ...partial },
        })),
    }),
    {
      name: "lector-manga-storage",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage;
        }
        const memory = new Map<string, string>();
        return {
          getItem: (key: string) => memory.get(key) ?? null,
          setItem: (key: string, value: string) => {
            memory.set(key, value);
          },
          removeItem: (key: string) => {
            memory.delete(key);
          },
        };
      }),
    }
  )
);
