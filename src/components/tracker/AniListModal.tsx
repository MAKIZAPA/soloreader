"use client";

import { useState } from "react";
import {
  X,
  Share2,
  ExternalLink,
  Search,
  BookOpen,
  CheckCircle2,
  Loader2,
  Info,
  Layers,
  Sparkles,
  Key,
  Check,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";
import Image from "next/image";
import { useAppStore } from "@/lib/store";

interface AniListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AniListEntry {
  id: number;
  status: string;
  progress: number;
  score: number;
  media: {
    id: number;
    title: {
      romaji?: string;
      english?: string;
      native?: string;
    };
    coverImage?: {
      large?: string;
      medium?: string;
    };
    chapters?: number;
    status?: string;
    siteUrl?: string;
  };
}

interface AniListList {
  name: string;
  status: string;
  entries: AniListEntry[];
}

interface MatchedItem {
  libraryId: string;
  originalTitle: string;
  matched: boolean;
  mediaId?: number;
  romajiTitle?: string;
  englishTitle?: string;
  nativeTitle?: string;
  coverUrl?: string;
  totalChapters?: number | null;
  progress?: number;
  status?: string;
  siteUrl?: string;
  selected?: boolean;
}

interface ManualSearchResult {
  id: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  coverImage?: {
    medium?: string;
    large?: string;
  };
  chapters?: number | null;
  status?: string;
  siteUrl?: string;
  countryOfOrigin?: string;
}

export function AniListModal({ isOpen, onClose }: AniListModalProps) {
  const [activeTab, setActiveTab] = useState<"auto-sync" | "view-lists">("auto-sync");

  // View Lists State
  const [username, setUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("anilist_username") || "";
    }
    return "";
  });
  const [loadingLists, setLoadingLists] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);
  const [lists, setLists] = useState<AniListList[]>([]);
  const [selectedList, setSelectedList] = useState<string>("CURRENT");
  const [importedStatus, setImportedStatus] = useState<string | null>(null);

  // Auto-Sync State (Opción 1: Bulk push to AniList)
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("anilist_access_token") || "";
    }
    return "";
  });
  const [clientId, setClientId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("anilist_client_id") || "";
    }
    return "";
  });
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number } | null>(null);
  const [pushing, setPushing] = useState(false);
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "matched" | "unmatched">("all");
  const [filterText, setFilterText] = useState("");

  // Manual search modal state
  const [manualTarget, setManualTarget] = useState<{ libraryId: string; title: string } | null>(null);
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<ManualSearchResult[]>([]);
  const [manualSearching, setManualSearching] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const { library, updateLibraryProgress } = useAppStore();
  const libraryEntries = Object.values(library);

  if (!isOpen) return null;

  const handleSaveToken = (val: string) => {
    setToken(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("anilist_access_token", val.trim());
    }
  };

  const handleSaveClientId = (val: string) => {
    setClientId(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("anilist_client_id", val.trim());
    }
  };

  // Step 1: Progressive Chunked Scan of User's Library
  const handleScanLibrary = async () => {
    if (libraryEntries.length === 0) {
      setSyncStatus({
        success: false,
        message: "Tu biblioteca está vacía. Agrega mangas o importa tu backup primero.",
      });
      return;
    }

    setScanning(true);
    setSyncStatus(null);
    setMatchedItems([]);
    setScanProgress({ current: 0, total: libraryEntries.length });

    try {
      const itemsToMatch = libraryEntries.map((entry) => {
        // Robust calculation of read chapter progress across all sources
        let readNum = 0;

        // 1. Saved chapters read status
        if (entry.savedChapters && entry.savedChapters.length > 0) {
          const readNums = entry.savedChapters
            .filter((c) => c.read)
            .map((c) => parseFloat(c.number) || 0)
            .filter((n) => n > 0);
          if (readNums.length > 0) {
            readNum = Math.max(...readNums);
          }
        }

        // 2. Read chapter numbers list
        if (readNum === 0 && entry.readChapterNumbers && entry.readChapterNumbers.length > 0) {
          const nums = entry.readChapterNumbers
            .map((n) => parseFloat(n) || 0)
            .filter((n) => n > 0);
          if (nums.length > 0) {
            readNum = Math.max(...nums);
          }
        }

        // 3. Last read chapter number (positive number check)
        if (readNum === 0 && entry.lastReadChapterNumber) {
          const parsed = parseFloat(entry.lastReadChapterNumber) || 0;
          if (parsed > 0) {
            readNum = parsed;
          }
        }

        // 4. Total chapters read fallback
        if (readNum === 0 && entry.totalChaptersRead && entry.totalChaptersRead > 0) {
          readNum = entry.totalChaptersRead;
        }

        return {
          libraryId: `${entry.manga.source}:${entry.manga.id}`,
          title: entry.manga.title,
          currentChapter: String(readNum),
          status: entry.status,
        };
      });

      const CHUNK_SIZE = 10;
      const totalChunks = Math.ceil(itemsToMatch.length / CHUNK_SIZE);
      let aggregatedMatches: MatchedItem[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunk = itemsToMatch.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

        const res = await fetch("/api/tracker/anilist/match-library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: chunk }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fallo al emparejar con AniList.");

        const chunkMatches = (data.matches || []).map((m: MatchedItem) => ({
          ...m,
          selected: m.matched,
        }));

        aggregatedMatches = [...aggregatedMatches, ...chunkMatches];
        setMatchedItems([...aggregatedMatches]);

        const processedCount = Math.min((i + 1) * CHUNK_SIZE, itemsToMatch.length);
        setScanProgress({
          current: processedCount,
          total: itemsToMatch.length,
        });

        // Delay between chunks to prevent AniList rate limits
        if (i < totalChunks - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }

      setSyncStatus({
        success: true,
        message: `Escaneo completado. Se procesaron ${aggregatedMatches.length} obras.`,
      });
    } catch (err: unknown) {
      setSyncStatus({
        success: false,
        message: err instanceof Error ? err.message : "Error al escanear la biblioteca.",
      });
    } finally {
      setScanning(false);
    }
  };

  // Step 2: Push selected matched mangas to AniList
  const handleBulkPushToAniList = async () => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setSyncStatus({
        success: false,
        message: "Por favor introduce tu token de acceso de AniList para sincronizar.",
      });
      return;
    }

    const selectedEntries = matchedItems
      .filter((m) => m.selected && m.matched && m.mediaId)
      .map((m) => ({
        mediaId: m.mediaId as number,
        progress: m.progress || 0,
        status: m.status === "COMPLETED" ? "COMPLETED" : "CURRENT",
      }));

    if (selectedEntries.length === 0) {
      setSyncStatus({
        success: false,
        message: "No hay mangas seleccionados con coincidencia en AniList.",
      });
      return;
    }

    setPushing(true);
    setSyncStatus(null);

    try {
      const res = await fetch("/api/tracker/anilist/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: cleanToken,
          entries: selectedEntries,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar datos a AniList.");
      }

      setSyncStatus({
        success: true,
        message: `Listo. Se sincronizaron exitosamente ${data.count} de ${selectedEntries.length} mangas en tu perfil de AniList.`,
      });
    } catch (err: unknown) {
      setSyncStatus({
        success: false,
        message: err instanceof Error ? err.message : "Fallo durante la sincronización.",
      });
    } finally {
      setPushing(false);
    }
  };

  const handleToggleItem = (libraryId: string) => {
    setMatchedItems((prev) =>
      prev.map((item) =>
        item.libraryId === libraryId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleUpdateProgress = (libraryId: string, newProgress: number) => {
    setMatchedItems((prev) =>
      prev.map((item) =>
        item.libraryId === libraryId ? { ...item, progress: Math.max(0, newProgress) } : item
      )
    );
  };

  const handleToggleAll = (select: boolean) => {
    setMatchedItems((prev) =>
      prev.map((item) => (item.matched ? { ...item, selected: select } : item))
    );
  };

  // Manual Search & Link Dialog
  const handleOpenManualSearch = (libraryId: string, originalTitle: string) => {
    const clean = originalTitle
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\([^)]*\)/g, "")
      .replace(/-(?:\s*(?:manhwa|webtoon|manga|color|novela|espanol|scan|oficial|raw))\b/gi, "")
      .trim();

    setManualTarget({ libraryId, title: originalTitle });
    setManualQuery(clean);
    setManualResults([]);
    setManualError(null);
    executeManualSearch(clean);
  };

  const executeManualSearch = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    setManualSearching(true);
    setManualError(null);

    try {
      const res = await fetch(`/api/tracker/anilist?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al buscar en AniList.");

      setManualResults(data.results || []);
      if ((data.results || []).length === 0) {
        setManualError("No se encontraron resultados en AniList. Intenta con palabras clave en inglés.");
      }
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : "Error al conectar con AniList.");
    } finally {
      setManualSearching(false);
    }
  };

  const handleLinkManualResult = (result: ManualSearchResult) => {
    if (!manualTarget) return;

    setMatchedItems((prev) =>
      prev.map((item) => {
        if (item.libraryId === manualTarget.libraryId) {
          return {
            ...item,
            matched: true,
            selected: true,
            mediaId: result.id,
            englishTitle: result.title.english || result.title.romaji || "",
            romajiTitle: result.title.romaji || "",
            coverUrl: result.coverImage?.medium || result.coverImage?.large || "",
            totalChapters: result.chapters,
            siteUrl: result.siteUrl,
          };
        }
        return item;
      })
    );

    setManualTarget(null);
  };

  // Fetch Public Lists
  const handleFetchAniList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) {
      setListsError("Ingresa un nombre de usuario de AniList.");
      return;
    }

    setLoadingLists(true);
    setListsError(null);
    setLists([]);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("anilist_username", cleanUser);
      }
      const res = await fetch(`/api/tracker/anilist?username=${encodeURIComponent(cleanUser)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo recuperar la lista de AniList.");

      setLists(data.lists || []);
      const readingList = (data.lists || []).find((l: AniListList) => l.status === "CURRENT");
      if (readingList) {
        setSelectedList("CURRENT");
      } else if (data.lists && data.lists.length > 0) {
        setSelectedList(data.lists[0].status || data.lists[0].name);
      }
    } catch (err: unknown) {
      setListsError(err instanceof Error ? err.message : "Error desconocido al consultar AniList.");
    } finally {
      setLoadingLists(false);
    }
  };

  const handleSyncToLibrary = () => {
    let syncedCount = 0;
    const allEntries = lists.flatMap((l) => l.entries);

    allEntries.forEach((entry) => {
      const aniTitle = (
        entry.media.title.romaji ||
        entry.media.title.english ||
        entry.media.title.native ||
        ""
      ).toLowerCase();

      const matchedLibKey = Object.keys(library).find((key) => {
        const libTitle = library[key].manga.title.toLowerCase();
        return (
          libTitle.includes(aniTitle) ||
          aniTitle.includes(libTitle) ||
          (entry.media.title.english &&
            libTitle.includes(entry.media.title.english.toLowerCase()))
        );
      });

      if (matchedLibKey && entry.progress > 0) {
        updateLibraryProgress(
          library[matchedLibKey].manga.source,
          library[matchedLibKey].manga.id,
          String(entry.progress)
        );
        syncedCount++;
      }
    });

    setImportedStatus(
      `Se actualizaron ${syncedCount} obras en tu biblioteca local a partir de tu progreso en AniList.`
    );
  };

  const currentListObj = lists.find((l) => (l.status || l.name) === selectedList);
  const currentEntries = currentListObj ? currentListObj.entries : [];

  const matchedCount = matchedItems.filter((m) => m.matched).length;
  const selectedCount = matchedItems.filter((m) => m.selected && m.matched).length;

  const filteredItems = matchedItems.filter((item) => {
    if (filterMode === "matched" && !item.matched) return false;
    if (filterMode === "unmatched" && item.matched) return false;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      const orig = item.originalTitle.toLowerCase();
      const eng = (item.englishTitle || "").toLowerCase();
      const rom = (item.romajiTitle || "").toLowerCase();
      return orig.includes(q) || eng.includes(q) || rom.includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Share2 className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Sincronización AniList
              </h2>
              <p className="text-[11px] text-neutral-400">
                Vincula tu progreso de lectura con tu perfil de AniList.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center border-b border-neutral-800 bg-neutral-900/50 px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("auto-sync")}
            className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition ${
              activeTab === "auto-sync"
                ? "border-sky-400 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Sparkles className="size-3.5 text-sky-400" />
            <span>Auto-Vincular Biblioteca</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("view-lists")}
            className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition ${
              activeTab === "view-lists"
                ? "border-sky-400 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <BookOpen className="size-3.5" />
            <span>Ver Listas Públicas</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "auto-sync" ? (
            /* Tab 1: Auto-Sync & Bulk Push */
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold">
                    <Sparkles className="size-4 shrink-0" />
                    <span>Auto-Vincular Biblioteca con AniList</span>
                  </div>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono">
                    {libraryEntries.length} obras en tu biblioteca
                  </span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  Analiza tus mangas y capítulos leídos (de Mihon o locales) y súbelos en masa a tu cuenta de AniList en 1 clic.
                </p>
              </div>

              {/* AniList Token Input Section */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Key className="size-3.5 text-sky-400" />
                    <span>Token de Acceso de AniList (OAuth):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>{showGuide ? "Ocultar guía" : "¿Cómo obtener tu token en 10 segundos?"}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => handleSaveToken(e.target.value)}
                    placeholder="Pega aquí tu access_token de AniList..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 py-2 px-3 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Collapsible Guide */}
                {showGuide && (
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 space-y-2 text-[11px] text-neutral-300">
                    <p className="font-semibold text-white">Pasos para autorizar:</p>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                      <li>
                        Abre la configuración de AniList en{" "}
                        <a
                          href="https://anilist.co/settings/developer"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 underline inline-flex items-center gap-0.5"
                        >
                          AniList Developer Settings <ExternalLink className="size-2.5" />
                        </a>.
                      </li>
                      <li>
                        Si ya tienes un <b>Client ID</b>, ingrésalo aquí:
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={clientId}
                            onChange={(e) => handleSaveClientId(e.target.value)}
                            placeholder="Client ID (ej. 23412)"
                            className="w-36 rounded bg-neutral-900 border border-neutral-700 px-2 py-0.5 text-xs text-white font-mono"
                          />
                          {clientId && (
                            <a
                              href={`https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=token`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded bg-sky-500 px-2.5 py-0.5 text-xs font-semibold text-black hover:bg-sky-400 transition"
                            >
                              Autorizar en AniList
                            </a>
                          )}
                        </div>
                      </li>
                      <li>
                        Al hacer clic en <b>Autorizar</b>, serás redirigido a una URL con{" "}
                        <code className="text-sky-300">#access_token=...</code>. Copia ese código y pégalo en el recuadro superior.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Action Buttons & Scan Progress */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={scanning || pushing}
                    onClick={handleScanLibrary}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 py-2.5 text-xs font-bold text-black transition disabled:opacity-50"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Escaneando biblioteca ({scanProgress?.current || 0} / {scanProgress?.total || libraryEntries.length})...</span>
                      </>
                    ) : (
                      <>
                        <Search className="size-4" />
                        <span>Escanear mi Biblioteca ({libraryEntries.length} obras)</span>
                      </>
                    )}
                  </button>

                  {matchedItems.length > 0 && (
                    <button
                      type="button"
                      disabled={pushing || selectedCount === 0 || !token.trim()}
                      onClick={handleBulkPushToAniList}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-black transition disabled:opacity-40"
                    >
                      {pushing ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Sincronizando {selectedCount} obras...</span>
                        </>
                      ) : (
                        <>
                          <Check className="size-4" />
                          <span>Sincronizar a AniList ({selectedCount} obras)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Progressive Scan Bar */}
                {scanning && scanProgress && (
                  <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-2.5 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-neutral-300 font-mono">
                      <span>Analizando obras con AniList...</span>
                      <span className="text-sky-400 font-bold">
                        {scanProgress.current} / {scanProgress.total} ({matchedCount} vinculadas)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div
                        className="h-full bg-sky-400 transition-all duration-300"
                        style={{
                          width: `${(scanProgress.current / scanProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {syncStatus && (
                <div
                  className={`flex items-start gap-2 rounded-xl p-3 text-xs border ${
                    syncStatus.success
                      ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-300"
                      : "border-rose-900/50 bg-rose-950/30 text-rose-300"
                  }`}
                >
                  {syncStatus.success ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
              )}

              {/* Matched Items Preview Section */}
              {matchedItems.length > 0 && (
                <div className="space-y-2 border border-neutral-800/80 rounded-xl p-3 bg-neutral-950">
                  {/* Filter & Selection Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setFilterMode("all")}
                        className={`px-2 py-0.5 rounded font-medium transition ${
                          filterMode === "all"
                            ? "bg-neutral-800 text-white"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Todas ({matchedItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode("matched")}
                        className={`px-2 py-0.5 rounded font-medium transition ${
                          filterMode === "matched"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Vinculadas ({matchedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode("unmatched")}
                        className={`px-2 py-0.5 rounded font-medium transition ${
                          filterMode === "unmatched"
                            ? "bg-rose-950 text-rose-300 border border-rose-800/50"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Sin vincular ({matchedItems.length - matchedCount})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          placeholder="Filtrar..."
                          className="w-28 rounded-lg bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAll(true)}
                        className="text-[10px] text-sky-400 hover:underline"
                      >
                        Marcar todas
                      </button>
                      <span className="text-neutral-600">|</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAll(false)}
                        className="text-[10px] text-neutral-400 hover:underline"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {filteredItems.map((item) => (
                      <div
                        key={item.libraryId}
                        onClick={() => item.matched && handleToggleItem(item.libraryId)}
                        className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs transition ${
                          item.matched
                            ? item.selected
                              ? "bg-neutral-900/80 border-emerald-500/40 text-white cursor-pointer"
                              : "bg-neutral-900/40 border-neutral-800 text-neutral-400 opacity-60 cursor-pointer"
                            : "bg-neutral-900/20 border-neutral-900 text-neutral-500"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={Boolean(item.selected)}
                            disabled={!item.matched}
                            onChange={() => {}}
                            className="size-3.5 rounded border-neutral-700 bg-neutral-800 text-emerald-500 shrink-0"
                          />
                          {item.coverUrl && (
                            <div className="relative size-8 shrink-0 rounded overflow-hidden bg-neutral-800">
                              <Image
                                src={item.coverUrl}
                                alt={item.originalTitle}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate text-xs">
                              {item.originalTitle}
                            </p>
                            {item.matched ? (
                              <p className="text-[10px] text-emerald-400 truncate flex items-center gap-1">
                                <span>➔ {item.englishTitle || item.romajiTitle}</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-neutral-500">
                                Sin coincidencia automática
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Manual Search Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenManualSearch(item.libraryId, item.originalTitle);
                            }}
                            title="Buscar manualmente en AniList"
                            className="rounded bg-neutral-800 hover:bg-neutral-700 p-1 text-neutral-300 hover:text-white transition"
                          >
                            <Search className="size-3" />
                          </button>

                          {/* Editable Chapter Input */}
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-neutral-400">Cap:</span>
                            <input
                              type="number"
                              min="0"
                              value={item.progress ?? 0}
                              onChange={(e) =>
                                handleUpdateProgress(
                                  item.libraryId,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-14 rounded bg-neutral-900 border border-neutral-700 px-1 py-0.5 text-center text-xs font-mono font-semibold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Search Overlay / Dialog */}
              {manualTarget && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
                  <div className="flex flex-col w-full max-w-lg rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Vincular Obra en AniList
                        </h3>
                        <p className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                          {manualTarget.title}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setManualTarget(null)}
                        className="rounded-lg p-1 text-neutral-400 hover:text-white"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        executeManualSearch(manualQuery);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={manualQuery}
                        onChange={(e) => setManualQuery(e.target.value)}
                        placeholder="Título en inglés o romaji (ej. Manager Kim, Swordmaster)..."
                        className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={manualSearching}
                        className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 px-3 py-1.5 text-xs font-semibold text-black transition disabled:opacity-50"
                      >
                        {manualSearching ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Search className="size-3.5" />
                        )}
                        <span>Buscar</span>
                      </button>
                    </form>

                    {manualError && (
                      <p className="text-rose-400 text-[11px] bg-rose-950/30 p-2 rounded-lg border border-rose-900/50">
                        {manualError}
                      </p>
                    )}

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {manualResults.map((res) => {
                        const title = res.title.english || res.title.romaji || "Sin título";
                        const cover = res.coverImage?.medium || res.coverImage?.large;

                        return (
                          <div
                            key={res.id}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {cover && (
                                <div className="relative size-10 shrink-0 rounded overflow-hidden bg-neutral-800">
                                  <Image
                                    src={cover}
                                    alt={title}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-xs truncate">{title}</p>
                                <p className="text-[10px] text-neutral-400 truncate">
                                  {res.title.romaji} {res.countryOfOrigin ? `• [${res.countryOfOrigin}]` : ""}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleLinkManualResult(res)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1 text-xs font-bold text-black transition shrink-0"
                            >
                              <LinkIcon className="size-3" />
                              <span>Vincular</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: View Lists */
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-medium">
                  <Info className="size-4 shrink-0" />
                  <span>Visualizar Listas de AniList</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Introduce tu usuario público de AniList para ver tus mangas en curso y traer los progresos de lectura a esta web.
                </p>
              </div>

              {/* Search username */}
              <form onSubmit={handleFetchAniList} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Usuario en AniList (ej. Makizapa)"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingLists}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-black hover:bg-sky-400 transition disabled:opacity-50"
                >
                  {loadingLists ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Cargando...</span>
                    </>
                  ) : (
                    <span>Consultar</span>
                  )}
                </button>
              </form>

              {listsError && (
                <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
                  {listsError}
                </div>
              )}

              {importedStatus && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  <span>{importedStatus}</span>
                </div>
              )}

              {/* Lists tab */}
              {lists.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      {lists.map((l) => {
                        const key = l.status || l.name;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedList(key)}
                            className={`px-3 py-1 rounded-lg border font-medium transition shrink-0 ${
                              selectedList === key
                                ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                                : "border-neutral-800 text-neutral-400 hover:text-white"
                            }`}
                          >
                            {l.name} ({l.entries.length})
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncToLibrary}
                      className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1 text-xs font-medium text-white hover:border-emerald-500 hover:text-emerald-400 transition shrink-0 ml-2"
                    >
                      <Layers className="size-3.5" />
                      <span>Sincronizar a Biblioteca</span>
                    </button>
                  </div>

                  {/* Entries list */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {currentEntries.map((entry) => {
                      const title =
                        entry.media.title.romaji ||
                        entry.media.title.english ||
                        entry.media.title.native ||
                        "Manga";
                      const cover = entry.media.coverImage?.medium || entry.media.coverImage?.large;

                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-2.5 hover:border-neutral-700 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {cover ? (
                              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                                <Image
                                  src={cover}
                                  alt={title}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
                                <BookOpen className="size-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-white">{title}</p>
                              <p className="text-[11px] text-neutral-400">
                                Progreso:{" "}
                                <span className="text-emerald-400 font-semibold">
                                  Cap. {entry.progress}
                                </span>
                                {entry.media.chapters ? ` / ${entry.media.chapters}` : ""}
                              </p>
                            </div>
                          </div>

                          {entry.media.siteUrl && (
                            <a
                              href={entry.media.siteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 p-1.5 text-neutral-500 hover:text-white transition"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
