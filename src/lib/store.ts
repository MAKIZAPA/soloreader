import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ChapterItem,
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
  removeFromLibraryByKey: (key: string) => void;
  clearLibrary: () => void;
  removeExternalMangas: () => void;
  updateLibraryStatus: (mangaId: string, status: LibraryEntry["status"]) => void;
  updateLibraryProgress: (
    mangaId: string,
    chapterId: string,
    chapterNumber: string,
    page?: number
  ) => void;
  toggleChapterRead: (
    mangaId: string,
    chapterId: string,
    chapterNumber?: string
  ) => void;
  markChaptersUpTo: (
    mangaId: string,
    chapterNumber: string,
    allChapters?: ChapterItem[]
  ) => void;
  relinkManga: (
    oldKey: string,
    newSource: SourceId,
    newId: string,
    newTitle?: string,
    newCover?: string
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
      removeFromLibraryByKey: (key) =>
        set((state) => {
          const next = { ...state.library };
          delete next[key];
          return { library: next };
        }),
      clearLibrary: () => set({ library: {} }),
      removeExternalMangas: () =>
        set((state) => {
          const next = { ...state.library };
          for (const key of Object.keys(next)) {
            if (next[key].manga.isExternal || next[key].manga.source === "external") {
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
              const readIds = new Set(next[key].readChapterIds || []);
              const readNums = new Set(next[key].readChapterNumbers || []);
              if (chapterId) readIds.add(chapterId);
              const cleanNum = chapterNumber ? String(chapterNumber).replace(/[^0-9.]/g, "") : "";
              if (cleanNum) readNums.add(cleanNum);

              next[key] = {
                ...next[key],
                lastReadChapterId: chapterId,
                lastReadChapterNumber: chapterNumber,
                lastReadAt: Date.now(),
                lastReadPage: page,
                readChapterIds: Array.from(readIds),
                readChapterNumbers: Array.from(readNums),
                totalChaptersRead: Math.max(next[key].totalChaptersRead || 0, readNums.size || readIds.size),
              };
            }
          }
          return { library: next };
        }),

      toggleChapterRead: (mangaId, chapterId, chapterNumber) =>
        set((state) => {
          const next = { ...state.library };
          for (const key of Object.keys(next)) {
            if (next[key].manga.id === mangaId || key.endsWith(`:${mangaId}`)) {
              const readIds = new Set(next[key].readChapterIds || []);
              const readNums = new Set(next[key].readChapterNumbers || []);
              const cleanNum = chapterNumber ? String(chapterNumber).replace(/[^0-9.]/g, "") : "";

              const isCurrentlyRead =
                readIds.has(chapterId) ||
                (cleanNum && readNums.has(cleanNum)) ||
                next[key].lastReadChapterId === chapterId;

              if (isCurrentlyRead) {
                readIds.delete(chapterId);
                if (cleanNum) readNums.delete(cleanNum);
              } else {
                readIds.add(chapterId);
                if (cleanNum) readNums.add(cleanNum);
              }

              next[key] = {
                ...next[key],
                readChapterIds: Array.from(readIds),
                readChapterNumbers: Array.from(readNums),
                totalChaptersRead: Math.max(0, readNums.size || readIds.size),
              };
            }
          }
          return { library: next };
        }),

      markChaptersUpTo: (mangaId, targetChapterNumber, allChapters = []) =>
        set((state) => {
          const next = { ...state.library };
          const targetNum = parseFloat(targetChapterNumber.replace(/[^0-9.]/g, ""));
          if (isNaN(targetNum)) return state;

          for (const key of Object.keys(next)) {
            if (next[key].manga.id === mangaId || key.endsWith(`:${mangaId}`)) {
              const readIds = new Set(next[key].readChapterIds || []);
              const readNums = new Set(next[key].readChapterNumbers || []);

              for (const ch of allChapters) {
                const chNum = parseFloat(String(ch.number).replace(/[^0-9.]/g, ""));
                if (!isNaN(chNum) && chNum <= targetNum) {
                  readIds.add(ch.id);
                  const cleanNum = String(ch.number).replace(/[^0-9.]/g, "");
                  if (cleanNum) readNums.add(cleanNum);
                }
              }

              next[key] = {
                ...next[key],
                lastReadChapterNumber: targetChapterNumber,
                readChapterIds: Array.from(readIds),
                readChapterNumbers: Array.from(readNums),
                totalChaptersRead: Math.max(next[key].totalChaptersRead || 0, readNums.size),
              };
            }
          }
          return { library: next };
        }),

      relinkManga: (oldKey, newSource, newId, newTitle, newCover) =>
        set((state) => {
          const oldEntry = state.library[oldKey];
          if (!oldEntry) return state;

          const nextLibrary = { ...state.library };
          delete nextLibrary[oldKey];

          const newKey = `${newSource}:${newId}`;
          nextLibrary[newKey] = {
            ...oldEntry,
            manga: {
              ...oldEntry.manga,
              id: newId,
              source: newSource,
              slug: newId,
              title: newTitle || oldEntry.manga.title,
              coverUrl: newCover || oldEntry.manga.coverUrl,
              isExternal: false,
            },
          };

          const nextStats = { ...state.stats };
          if (nextStats[oldKey]) {
            const oldStat = nextStats[oldKey];
            delete nextStats[oldKey];
            nextStats[newKey] = {
              ...oldStat,
              mangaId: newId,
              source: newSource,
              mangaTitle: newTitle || oldStat.mangaTitle,
              mangaCover: newCover || oldStat.mangaCover,
            };
          }

          return { library: nextLibrary, stats: nextStats };
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
          if (seconds <= 0) return state;
          const key = `${source}:${mangaId}`;
          const current = state.stats[key];

          return {
            stats: {
              ...state.stats,
              [key]: {
                mangaId,
                source,
                mangaTitle,
                mangaCover,
                totalSeconds: (current?.totalSeconds || 0) + seconds,
                sessionsCount: (current?.sessionsCount || 0) + 1,
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
            let mappedSource: SourceId = m.matchedSource || "external";
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
                cleanId = m.url
                  .replace(/^https?:\/\/[^/]+/, "")
                  .replace(/^\/+|\/+$/g, "")
                  .replace(/^manga\//, "")
                  .replace(/^series\//, "")
                  .split("/")
                  .pop() || m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              } else if (sName.includes("dex") || sUrl.includes("mangadex")) {
                mappedSource = "mangadex";
                const uuidMatch = m.url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
                cleanId = uuidMatch
                  ? uuidMatch[0]
                  : m.url
                      .replace(/^https?:\/\/[^/]+/, "")
                      .replace(/^\/+|\/+$/g, "")
                      .split("/")
                      .pop() || m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              } else if (sName.includes("olympus") || sUrl.includes("olympus")) {
                mappedSource = "olympus";
                cleanId = m.url
                  .replace(/^https?:\/\/[^/]+/, "")
                  .replace(/^\/+|\/+$/g, "")
                  .replace(/^series\//, "")
                  .replace(/^comic\//, "")
                  .split("/")
                  .pop() || m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                cleanId = cleanId.replace(/^comic-/, "");
              } else {
                // External source (e.g. ZonaTMO) - keep as external!
                mappedSource = "external";
                cleanId =
                  m.url
                    .replace(/^https?:\/\/[^/]+/, "")
                    .replace(/^\/+|\/+$/g, "")
                    .split("/")
                    .pop() || m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              }
            }

            const key = `${mappedSource}:${cleanId}`;
            const isCompleted = m.totalChapters > 0 && m.readChapters >= m.totalChapters;

            // Extract read chapter numbers and URLs from Mihon history
            const readChapterNumbers = (m.chapters || [])
              .filter((c) => c.read)
              .map((c) => {
                if (c.chapterNumber && c.chapterNumber > 0) return String(c.chapterNumber);
                const match = c.name?.match(/(\d+(\.\d+)?)/);
                return match ? match[1] : c.name || "";
              })
              .filter(Boolean);

            const readChapterIds = (m.chapters || [])
              .filter((c) => c.read)
              .map((c) => c.url)
              .filter(Boolean);

            const savedChapters: ChapterItem[] = (m.chapters || []).map((c) => ({
              id: c.url || c.name,
              mangaId: cleanId,
              source: mappedSource,
              number: String(c.chapterNumber || c.name.replace(/[^0-9.]/g, "") || "0"),
              title: c.name || `Capítulo ${c.chapterNumber}`,
              read: c.read,
            }));

            nextLibrary[key] = {
              manga: {
                id: cleanId,
                source: mappedSource,
                title: finalTitle,
                slug: cleanId,
                coverUrl: m.thumbnailUrl || "",
                synopsis: m.description,
                originalSource: m.sourceName || undefined,
                isExternal: mappedSource === "external" || !isKnownSource,
              },
              addedAt: Date.now(),
              status: isCompleted ? "completed" : "reading",
              totalChaptersRead: Math.max(m.readChapters, readChapterNumbers.length),
              lastReadChapterNumber:
                m.lastReadChapterName || (m.readChapters > 0 ? String(m.readChapters) : undefined),
              lastReadAt: m.lastReadTimestamp || Date.now(),
              readChapterNumbers,
              readChapterIds,
              savedChapters: savedChapters.length > 0 ? savedChapters : undefined,
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
