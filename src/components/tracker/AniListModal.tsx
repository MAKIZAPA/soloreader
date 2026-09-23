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
  const [pushing, setPushing] = useState(false);
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

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

  // Step 1: Scan user's library and match with AniList
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

    try {
      const itemsToMatch = libraryEntries.map((entry) => {
        // Calculate read chapter progress
        let readNum = 0;
        if (entry.lastReadChapterNumber) {
          readNum = parseFloat(entry.lastReadChapterNumber) || 0;
        } else if (entry.readChapterNumbers && entry.readChapterNumbers.length > 0) {
          const maxNum = Math.max(
            ...entry.readChapterNumbers.map((n) => parseFloat(n) || 0)
          );
          readNum = maxNum;
        } else if (entry.totalChaptersRead) {
          readNum = entry.totalChaptersRead;
        }

        return {
          libraryId: `${entry.manga.source}:${entry.manga.id}`,
          title: entry.manga.title,
          currentChapter: String(readNum),
          status: entry.status,
        };
      });

      const res = await fetch("/api/tracker/anilist/match-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToMatch }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fallo al emparejar con AniList.");

      const withSelection = (data.matches || []).map((m: MatchedItem) => ({
        ...m,
        selected: m.matched,
      }));

      setMatchedItems(withSelection);
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
        message: `¡Listo! Se sincronizaron exitosamente ${data.count} de ${selectedEntries.length} mangas en tu perfil de AniList.`,
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
      } else if (data.lists?.length > 0) {
        setSelectedList(data.lists[0].status || data.lists[0].name);
      }
    } catch (err: unknown) {
      setListsError(err instanceof Error ? err.message : "Error al conectar con AniList.");
    } finally {
      setLoadingLists(false);
    }
  };

  const currentEntries = lists.find((l) => (l.status || l.name) === selectedList)?.entries || [];

  const handleSyncToLibrary = () => {
    let syncedCount = 0;
    const libraryKeys = Object.keys(library);

    currentEntries.forEach((entry) => {
      const mediaTitle = (entry.media.title.romaji || entry.media.title.english || "").toLowerCase();
      if (!mediaTitle || !entry.progress) return;

      const matchedKey = libraryKeys.find((k) => {
        const item = library[k];
        const itemTitle = (item.manga.title || "").toLowerCase();
        return (
          itemTitle.includes(mediaTitle) ||
          mediaTitle.includes(itemTitle) ||
          k.toLowerCase().includes(mediaTitle.replace(/[^a-z0-9]/g, "-"))
        );
      });

      if (matchedKey) {
        const item = library[matchedKey];
        updateLibraryProgress(item.manga.id, `ch-${entry.progress}`, String(entry.progress));
        syncedCount++;
      }
    });

    setImportedStatus(
      syncedCount > 0
        ? `Se sincronizó el progreso de ${syncedCount} series con tu biblioteca local.`
        : "No se encontraron coincidencias directas con tu biblioteca actual."
    );
  };

  const matchedCount = matchedItems.filter((m) => m.matched).length;
  const selectedCount = matchedItems.filter((m) => m.selected && m.matched).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800/80 bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Share2 className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Sincronización con AniList</h2>
              <p className="text-xs text-neutral-400">
                Vincula tu biblioteca de Mihon y web automáticamente
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 mx-4 mt-3 rounded-xl bg-neutral-900/70 border border-neutral-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("auto-sync")}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "auto-sync"
                ? "bg-neutral-800 text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>Auto-Vincular Biblioteca</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("view-lists")}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "view-lists"
                ? "bg-neutral-800 text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen className="size-3.5 text-sky-400" />
            <span>Consultar Listas</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === "auto-sync" ? (
            <div className="space-y-4 text-xs">
              {/* Info banner */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Sparkles className="size-4 shrink-0" />
                  <span>Sincronización Automática Masiva</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Esta herramienta toma los mangas de tu biblioteca (importados de tu backup de Mihon o leídos aquí), detecta automáticamente su nombre oficial en AniList (ej. <i>Líder Kim ➔ Manager Kim</i>, <i>El hijo menor... ➔ The Swordmaster&apos;s Son</i>) y actualiza tus capítulos leídos en tu perfil de AniList en un solo clic.
                </p>
              </div>

              {/* Step 1: Token configuration */}
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-white">
                    <Key className="size-3.5 text-sky-400" />
                    <span>Token de Acceso de AniList</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide((v) => !v)}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    {showGuide ? "Ocultar guía" : "¿Cómo obtenerlo en 10 seg?"}
                  </button>
                </div>

                {showGuide && (
                  <div className="rounded-lg bg-neutral-950 p-3 border border-neutral-800 text-[11px] text-neutral-300 space-y-2">
                    <p className="font-semibold text-white">Pasos sencillos:</p>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                      <li>
                        Abre{" "}
                        <a
                          href="https://anilist.co/settings/developer"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 underline"
                        >
                          anilist.co/settings/developer
                        </a>
                      </li>
                      <li>Haz clic en <b>Create New Client</b>.</li>
                      <li>
                        Pon de nombre <code>Lector Manga</code> y en Redirect URL escribe:{" "}
                        <code className="bg-neutral-900 px-1 py-0.5 rounded text-white select-all">
                          https://anilist.co/api/v2/oauth/pin
                        </code>
                      </li>
                      <li>
                        Guarda y copia tu <b>Client ID</b> numérico.
                      </li>
                    </ol>

                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => handleSaveClientId(e.target.value)}
                        placeholder="Pega tu Client ID aquí (ej. 12345)"
                        className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-white"
                      />
                      {clientId && (
                        <a
                          href={`https://anilist.co/api/v2/oauth/authorize?client_id=${clientId.trim()}&response_type=token`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-black hover:bg-sky-400 shrink-0 inline-flex items-center gap-1"
                        >
                          <span>Autorizar</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <input
                  type="password"
                  value={token}
                  onChange={(e) => handleSaveToken(e.target.value)}
                  placeholder="Pega tu Access Token de AniList aquí..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Step 2: Scan button & Action */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleScanLibrary}
                  disabled={scanning || pushing}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-900 border border-neutral-700 px-3.5 py-2 text-xs font-medium text-white hover:border-emerald-500 hover:text-emerald-400 transition disabled:opacity-50"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Emparejando biblioteca...</span>
                    </>
                  ) : (
                    <>
                      <Search className="size-3.5" />
                      <span>Escanear mi Biblioteca ({libraryEntries.length} series)</span>
                    </>
                  )}
                </button>

                {matchedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkPushToAniList}
                    disabled={pushing || selectedCount === 0}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition disabled:opacity-50 ml-auto"
                  >
                    {pushing ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Sincronizando {selectedCount} series...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" />
                        <span>Sincronizar a AniList ({selectedCount} series)</span>
                      </>
                    )}
                  </button>
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

              {/* Matched Items Preview List */}
              {matchedItems.length > 0 && (
                <div className="space-y-2 border border-neutral-800/80 rounded-xl p-3 bg-neutral-950">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800 text-[11px] text-neutral-400">
                    <span>
                      Coincidencias encontradas:{" "}
                      <b className="text-emerald-400">{matchedCount}</b> de {matchedItems.length}
                    </span>
                    <span>Progreso a enviar</span>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {matchedItems.map((item) => (
                      <div
                        key={item.libraryId}
                        onClick={() => item.matched && handleToggleItem(item.libraryId)}
                        className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          item.matched
                            ? item.selected
                              ? "bg-neutral-900/80 border-emerald-500/40 text-white"
                              : "bg-neutral-900/40 border-neutral-800 text-neutral-400 opacity-60"
                            : "bg-neutral-900/20 border-neutral-900 text-neutral-500 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={Boolean(item.selected)}
                            disabled={!item.matched}
                            onChange={() => {}}
                            className="size-3.5 rounded border-neutral-700 bg-neutral-800 text-emerald-500 shrink-0"
                          />
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

                        {item.matched && (
                          <div className="text-right shrink-0">
                            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 font-semibold">
                              Cap. {item.progress || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
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
