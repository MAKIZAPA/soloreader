"use client";

import { useState, useEffect } from "react";
import {
  Bookmark,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trash2,
  ShieldCheck,
  BarChart3,
  Trophy,
  ArrowUpRight,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { MangaItem } from "@/types";
import { useAppStore } from "@/lib/store";
import { Navbar } from "@/components/layout/Navbar";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { SearchModal } from "@/components/layout/SearchModal";
import { LegalModal } from "@/components/legal/LegalModal";
import { LocalReaderModal } from "@/components/local/LocalReaderModal";
import { BackupModal } from "@/components/backup/BackupModal";
import { RelinkModal } from "@/components/manga/RelinkModal";
import { CleanLibraryModal } from "@/components/manga/CleanLibraryModal";
import { formatProxyUrl, optimizeCoverUrl, formatDuration, formatDate, cn } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const {
    activeSource,
    library,
    history,
    stats,
    clearHistory,
    removeHistoryItem,
    clearStats,
    removeFromLibrary,
    removeFromLibraryByKey,
    clearLibrary,
    removeExternalMangas,
    relinkManga,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"explore" | "library" | "history" | "stats">("explore");
  const [catalogView, setCatalogView] = useState<"popular" | "latest">("popular");
  const [statusFilter, setStatusFilter] = useState<"all" | "ongoing" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "manhwa" | "novel">("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [cleanOpen, setCleanOpen] = useState(false);
  const [relinkOpen, setRelinkOpen] = useState(false);
  const [relinkTarget, setRelinkTarget] = useState<MangaItem | null>(null);

  // Library filter
  const [libraryFilter, setLibraryFilter] = useState<string>("all");

  // Fetch catalog on source, view or page change
  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const action = catalogView === "popular" ? "popular" : "latest";
        const res = await fetch(`/api/sources/${activeSource}?action=${action}&page=${page}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!ignore) {
          setItems(data.items || []);
          setHasNextPage(Boolean(data.hasNextPage));
        }
      } catch (err) {
        console.error("Fetch catalog failed:", err);
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, [activeSource, catalogView, page]);

  // Reset page when source or catalogView changes
  const handleCatalogViewChange = (view: "popular" | "latest") => {
    setCatalogView(view);
    setPage(1);
  };

  // Filtered catalog items (status & format type)
  const displayedItems = items.filter((item) => {
    if (statusFilter !== "all") {
      if (item.status && item.status !== statusFilter) return false;
      if (!item.status && statusFilter === "completed") return false;
    }
    if (typeFilter !== "all") {
      const titleLower = item.title.toLowerCase();
      const isNovel =
        titleLower.includes("novela") ||
        item.source === "rncalation" ||
        item.genres?.some((g) => g.toLowerCase().includes("novel"));

      if (typeFilter === "novel" && !isNovel) return false;
      if (typeFilter === "manhwa" && isNovel) return false;
    }
    return true;
  });

  // Filtered library
  const libraryEntries = Object.values(library);
  const externalCount = libraryEntries.filter(
    (e) => e.manga.isExternal || e.manga.source === "external"
  ).length;

  const filteredLibrary = libraryEntries.filter((entry) => {
    if (libraryFilter === "all") return true;
    if (libraryFilter === "external") {
      return Boolean(entry.manga.isExternal || entry.manga.source === "external");
    }
    return entry.status === libraryFilter;
  });

  const handleRemoveFromLibrary = (manga: MangaItem) => {
    const key = Object.keys(library).find((k) => library[k].manga.id === manga.id);
    if (key) {
      removeFromLibraryByKey(key);
    } else {
      removeFromLibrary(manga.id);
    }
  };

  const handleRelinkTarget = (target: MangaItem) => {
    if (!relinkTarget) return;
    const oldKey =
      Object.keys(library).find((k) => library[k].manga.id === relinkTarget.id) ||
      `${relinkTarget.source}:${relinkTarget.id}`;
    relinkManga(oldKey, target.source, target.id, target.title, target.coverUrl);
    setRelinkOpen(false);
    setRelinkTarget(null);
  };

  // Library statistics (Mihon Style)
  const totalLibraryMangas = libraryEntries.length;
  const totalLibraryChaptersRead = libraryEntries.reduce(
    (acc, curr) => acc + (curr.totalChaptersRead || 0),
    0
  );
  const readingCount = libraryEntries.filter((e) => e.status === "reading").length;
  const completedCount = libraryEntries.filter((e) => e.status === "completed").length;
  const planToReadCount = libraryEntries.filter((e) => e.status === "plan_to_read").length;

  const olympusCount = libraryEntries.filter((e) => e.manga.source === "olympus").length;
  const dragonCount = libraryEntries.filter((e) => e.manga.source === "dragon").length;
  const mangadexCount = libraryEntries.filter((e) => e.manga.source === "mangadex").length;

  // Reading statistics (Tachimanga Style)
  const statsList = Object.values(stats).sort((a, b) => b.totalSeconds - a.totalSeconds);
  const totalReadingSeconds = statsList.reduce((acc, curr) => acc + curr.totalSeconds, 0);
  const totalSessions = statsList.reduce((acc, curr) => acc + curr.sessionsCount, 0);
  const maxReadingSeconds = statsList.length > 0 ? statsList[0].totalSeconds : 1;

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      {/* Navbar */}
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenLegal={() => setLegalOpen(true)}
        onOpenLocal={() => setLocalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* TAB 1: EXPLORE */}
        {activeTab === "explore" && (
          <div className="space-y-6">
            {/* Scanlation Community Disclaimer Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-3.5 text-xs text-neutral-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                <span>
                  <b>Reconocimiento a la Comunidad Scanlation:</b> Este visualizador no aloja contenido. Reconocemos y agradecemos el trabajo de <b>Olympus Scan</b>, <b>Dragon Translation</b>, <b>MangaDex</b> y <b>Nartag/KNS</b>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLegalOpen(true)}
                className="shrink-0 self-start sm:self-auto rounded-lg bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:text-white transition"
              >
                Ver Términos & DMCA
              </button>
            </div>

            {/* View Subtabs, Status Filter & Source Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-950 p-3 rounded-2xl border border-neutral-800/80">
              {/* Left: View selector (Populares / Últimos) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCatalogViewChange("popular")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    catalogView === "popular"
                      ? "bg-neutral-800 text-white shadow-xs font-bold"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  <TrendingUp className="size-3.5 text-emerald-400" />
                  <span>Más Populares</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCatalogViewChange("latest")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    catalogView === "latest"
                      ? "bg-neutral-800 text-white shadow-xs font-bold"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  <Sparkles className="size-3.5 text-cyan-400" />
                  <span>Últimos Capítulos</span>
                </button>
              </div>

              {/* Middle: Status & Type Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter (En emisión / Finalizado) */}
                <div className="flex items-center rounded-xl bg-neutral-900/90 p-1 border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium rounded-lg transition",
                      statusFilter === "all"
                        ? "bg-neutral-800 text-white shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ongoing")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition",
                      statusFilter === "ongoing"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50 shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>En emisión</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("completed")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition",
                      statusFilter === "completed"
                        ? "bg-sky-950 text-sky-300 border border-sky-800/50 shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    <CheckCircle2 className="size-3 text-sky-400" />
                    <span>Finalizados</span>
                  </button>
                </div>

                {/* Type/Format Selector (Manhwa / Novelas) */}
                <div className="flex items-center rounded-xl bg-neutral-900/90 p-1 border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setTypeFilter("all")}
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium rounded-lg transition",
                      typeFilter === "all"
                        ? "bg-neutral-800 text-white shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("manhwa")}
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium rounded-lg transition",
                      typeFilter === "manhwa"
                        ? "bg-purple-950 text-purple-300 border border-purple-800/50 shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Manhwa
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter("novel")}
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium rounded-lg transition",
                      typeFilter === "novel"
                        ? "bg-amber-950 text-amber-300 border border-amber-800/50 shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    Novelas
                  </button>
                </div>
              </div>

              {/* Right: Active Source Info & Counter */}
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <span>
                  {displayedItems.length} {displayedItems.length === 1 ? "obra" : "obras"}
                </span>
                <span className="text-neutral-600">|</span>
                <span className="rounded bg-neutral-900 px-2 py-0.5 text-white font-bold uppercase tracking-wider border border-neutral-800 text-[11px]">
                  {activeSource}
                </span>
              </div>
            </div>

            {/* Manga Grid */}
            <MangaGrid
              items={displayedItems}
              loading={loading}
              emptyTitle="No hay series que coincidan con los filtros"
              emptyDescription="Prueba seleccionando 'Todos los estados' o cambiando de fuente."
            />

            {/* Pagination Controls */}
            {!loading && items.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-neutral-900">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="size-4" />
                  <span>Página anterior</span>
                </button>

                <span className="text-xs font-mono text-neutral-400 px-2">Página {page}</span>

                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={() => {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <span>Página siguiente</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIBRARY */}
        {activeTab === "library" && (
          <div className="space-y-6">
            {/* Filter Pills & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "all", label: "Todos", count: libraryEntries.length },
                  { id: "reading", label: "Leyendo", count: readingCount },
                  { id: "completed", label: "Completados", count: completedCount },
                  { id: "plan_to_read", label: "Por Leer", count: planToReadCount },
                  ...(externalCount > 0
                    ? [
                        {
                          id: "external",
                          label: "Por Vincular",
                          count: externalCount,
                          badgeColor: "amber",
                        },
                      ]
                    : []),
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setLibraryFilter(pill.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition",
                      libraryFilter === pill.id
                        ? "bg-neutral-800 text-white border-neutral-700 shadow-xs"
                        : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900/60"
                    )}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                        pill.badgeColor === "amber"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : libraryFilter === pill.id
                          ? "bg-neutral-700 text-neutral-200"
                          : "bg-neutral-900 text-neutral-500"
                      )}
                    >
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              {libraryEntries.length > 0 && (
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCleanOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 transition"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Limpiar Biblioteca</span>
                  </button>
                </div>
              )}
            </div>

            {/* Library Grid */}
            <MangaGrid
              items={filteredLibrary.map((entry) => entry.manga)}
              libraryMap={library}
              onRelink={(manga) => {
                setRelinkTarget(manga);
                setRelinkOpen(true);
              }}
              onRemove={handleRemoveFromLibrary}
              emptyTitle={
                libraryFilter === "external"
                  ? "No hay títulos externos por vincular"
                  : "Tu biblioteca está vacía"
              }
              emptyDescription={
                libraryFilter === "external"
                  ? "Todas las series de tu biblioteca ya están vinculadas con fuentes activas."
                  : "Explora el catálogo o importa una copia de respaldo para comenzar tu colección."
              }
            />
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Capítulos Recientes ({history.length})
              </h3>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400 transition"
                >
                  <Trash2 className="size-3.5" />
                  <span>Borrar Historial</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 p-8 text-center bg-neutral-950/40">
                <Clock className="size-8 text-neutral-600 mb-2" />
                <h4 className="text-sm font-semibold text-neutral-200">
                  Sin registros de lectura
                </h4>
                <p className="mt-1 text-xs text-neutral-400 max-w-sm">
                  Los capítulos que leas se guardarán automáticamente en tu historial local.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-900 rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden">
                {history.map((item) => (
                  <div
                    key={`${item.source}:${item.chapterId}`}
                    className="group flex items-center justify-between p-3.5 hover:bg-neutral-900/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-12 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                        {item.mangaCover ? (
                          <img
                            src={formatProxyUrl(item.mangaCover)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-600">
                            <BookOpen className="size-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[9px] font-semibold text-neutral-300 uppercase">
                            {item.source}
                          </span>
                          <h4 className="text-xs font-semibold text-white truncate">
                            {item.mangaTitle}
                          </h4>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          Capítulo {item.chapterNumber} • Página {item.page} de {item.totalPages}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/read/${item.source}/${item.mangaId}/${item.chapterId}`}
                        className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
                      >
                        Continuar
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeHistoryItem(item.chapterId)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-300 transition"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STATS (TACHIMANGA READING TIME & RANKING) */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            {/* Header / Summary Cards */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="size-4 text-amber-400" />
                <span>Estadísticas Generales</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBackupOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                >
                  <Layers className="size-3.5" />
                  <span>Copia de Seguridad & Mihon</span>
                </button>

                {statsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("¿Deseas reiniciar todas las estadísticas de lectura acumuladas?")) {
                        clearStats();
                      }
                    }}
                    className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:border-red-900/50 transition"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Reiniciar</span>
                  </button>
                )}
              </div>
            </div>

            {/* SECCIÓN 1: ESTADÍSTICAS DE BIBLIOTECA (ESTILO MIHON) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <Bookmark className="size-3.5 text-cyan-400" />
                  <span>Biblioteca & Capítulos Leídos</span>
                </h4>
                <span className="text-xs font-mono text-neutral-400">
                  {totalLibraryMangas} {totalLibraryMangas === 1 ? "serie" : "series"}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">En Biblioteca</span>
                    <Bookmark className="size-4 text-cyan-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-white">
                    {totalLibraryMangas}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Series guardadas</p>
                </div>

                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">Capítulos Leídos</span>
                    <BookOpen className="size-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-emerald-400">
                    {totalLibraryChaptersRead}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Total completados</p>
                </div>

                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">En Lectura</span>
                    <TrendingUp className="size-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-white">
                    {readingCount}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Obras en curso activo</p>
                </div>

                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">Completados</span>
                    <ShieldCheck className="size-4 text-purple-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-white">
                    {completedCount}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Obras finalizadas</p>
                </div>
              </div>

              {/* Status breakdown bar & source badges if library is populated */}
              {totalLibraryMangas > 0 ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Distribución de Estados</span>
                    <span className="text-neutral-300 font-mono">
                      {Math.round((completedCount / totalLibraryMangas) * 100)}% completado
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="flex h-2 w-full rounded-full overflow-hidden bg-neutral-900 border border-neutral-800">
                    {readingCount > 0 && (
                      <div
                        style={{ width: `${(readingCount / totalLibraryMangas) * 100}%` }}
                        className="bg-amber-400"
                        title={`Leyendo: ${readingCount}`}
                      />
                    )}
                    {completedCount > 0 && (
                      <div
                        style={{ width: `${(completedCount / totalLibraryMangas) * 100}%` }}
                        className="bg-emerald-400"
                        title={`Completados: ${completedCount}`}
                      />
                    )}
                    {planToReadCount > 0 && (
                      <div
                        style={{ width: `${(planToReadCount / totalLibraryMangas) * 100}%` }}
                        className="bg-neutral-600"
                        title={`Por Leer: ${planToReadCount}`}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-4 text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-400" />
                        <span>Leyendo ({readingCount})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        <span>Completados ({completedCount})</span>
                      </span>
                      {planToReadCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-neutral-600" />
                          <span>Por Leer ({planToReadCount})</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-neutral-400 font-mono">
                      <span>Fuentes:</span>
                      {olympusCount > 0 && (
                        <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 text-[10px] text-emerald-400">
                          Olympus ({olympusCount})
                        </span>
                      )}
                      {dragonCount > 0 && (
                        <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 text-[10px] text-rose-400">
                          Dragon ({dragonCount})
                        </span>
                      )}
                      {mangadexCount > 0 && (
                        <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 text-[10px] text-cyan-400">
                          MangaDex ({mangadexCount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-3.5 text-xs text-neutral-400">
                  <span>Tu biblioteca aún no tiene mangas guardados.</span>
                  <button
                    type="button"
                    onClick={() => setBackupOpen(true)}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Importar backup de Mihon (.tachibk)
                  </button>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: TIEMPO ACTIVO & RANKING TOP */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="size-3.5 text-amber-400" />
                  <span>Tiempo Activo de Lectura</span>
                </h4>
              </div>

              {/* Metric KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">Tiempo Total</span>
                    <Clock className="size-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-white">
                    {formatDuration(totalReadingSeconds)}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Tiempo activo en el lector</p>
                </div>

                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">Series Leídas</span>
                    <BookOpen className="size-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-white">
                    {statsList.length}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Obras con tiempo registrado</p>
                </div>

                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">Sesiones</span>
                    <TrendingUp className="size-4 text-cyan-400" />
                  </div>
                  <div className="mt-2 text-xl font-bold font-mono text-white">
                    {totalSessions}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Sesiones de lectura abiertas</p>
                </div>

                <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">Top Manga</span>
                    <Trophy className="size-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-sm font-bold text-white truncate">
                    {statsList[0]?.mangaTitle || "—"}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {statsList[0] ? formatDuration(statsList[0].totalSeconds) : "Sin lecturas aún"}
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking List */}
            {statsList.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 p-8 text-center bg-neutral-950/40">
                <BarChart3 className="size-8 text-neutral-600 mb-2" />
                <h4 className="text-sm font-semibold text-neutral-200">
                  Sin estadísticas de lectura
                </h4>
                <p className="mt-1 text-xs text-neutral-400 max-w-sm">
                  Abre cualquier manga en el lector para comenzar a registrar tus tiempos de lectura y ver tu ranking top.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Top Mangas por Tiempo de Lectura
                  </h4>
                  <span className="text-xs font-mono text-neutral-400">
                    {statsList.length} {statsList.length === 1 ? "manga" : "mangas"}
                  </span>
                </div>

                <div className="divide-y divide-neutral-900 rounded-2xl border border-neutral-800 bg-neutral-950/60 overflow-hidden">
                  {statsList.map((entry, index) => {
                    const rank = index + 1;
                    const percentOfMax = maxReadingSeconds > 0
                      ? Math.round((entry.totalSeconds / maxReadingSeconds) * 100)
                      : 0;
                    const percentOfTotal = totalReadingSeconds > 0
                      ? Math.round((entry.totalSeconds / totalReadingSeconds) * 100)
                      : 0;

                    return (
                      <div
                        key={`${entry.source}:${entry.mangaId}`}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-neutral-900/50 transition"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank badge */}
                          <div
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono border",
                              rank === 1
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : rank === 2
                                ? "bg-neutral-200/10 text-neutral-200 border-neutral-400/30"
                                : rank === 3
                                ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                : "bg-neutral-900 text-neutral-400 border-neutral-800"
                            )}
                          >
                            #{rank}
                          </div>

                          {/* Cover */}
                          <div className="size-14 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                            {entry.mangaCover ? (
                              <img
                                src={formatProxyUrl(optimizeCoverUrl(entry.mangaCover))}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-600">
                                <BookOpen className="size-5" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[9px] font-semibold text-neutral-300 uppercase">
                                {entry.source}
                              </span>
                              <Link
                                href={`/manga/${entry.source}/${entry.mangaId}`}
                                className="text-xs font-bold text-white hover:text-emerald-400 transition truncate"
                              >
                                {entry.mangaTitle}
                              </Link>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                              <span>
                                {entry.sessionsCount} {entry.sessionsCount === 1 ? "sesión" : "sesiones"}
                              </span>
                              {entry.lastReadTimestamp ? (
                                <>
                                  <span>•</span>
                                  <span>Última vez: {formatDate(new Date(entry.lastReadTimestamp).toISOString())}</span>
                                </>
                              ) : null}
                            </div>

                            {/* Relative progress bar */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    rank === 1
                                      ? "bg-amber-400"
                                      : rank === 2
                                      ? "bg-neutral-300"
                                      : rank === 3
                                      ? "bg-orange-400"
                                      : "bg-emerald-500"
                                  )}
                                  style={{ width: `${percentOfMax}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                                {percentOfTotal}% del total
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total time & Action button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 sm:pl-4">
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-mono font-bold text-amber-300">
                              {formatDuration(entry.totalSeconds)}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              tiempo leído
                            </div>
                          </div>

                          <Link
                            href={`/manga/${entry.source}/${entry.mangaId}`}
                            className="flex items-center gap-1 rounded-lg bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:border-neutral-700 transition"
                          >
                            <span>Ver</span>
                            <ArrowUpRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-900 bg-neutral-950/40 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">Lector Manga</span>
            <span>•</span>
            <span>Creado por</span>
            <a
              href="https://github.com/makizapa"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-200 hover:text-emerald-400 transition underline underline-offset-4 decoration-neutral-800 hover:decoration-emerald-400"
            >
              @makizapa
            </a>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <a
              href="https://github.com/makizapa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition"
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </a>
            <span>•</span>
            <button
              type="button"
              onClick={() => setLegalOpen(true)}
              className="hover:text-white transition"
            >
              Aviso Legal & DMCA
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <LegalModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} />
      <LocalReaderModal isOpen={localOpen} onClose={() => setLocalOpen(false)} />
      <BackupModal isOpen={backupOpen} onClose={() => setBackupOpen(false)} />
      <RelinkModal
        isOpen={relinkOpen}
        onClose={() => {
          setRelinkOpen(false);
          setRelinkTarget(null);
        }}
        manga={relinkTarget}
        onRelink={handleRelinkTarget}
      />
      <CleanLibraryModal
        isOpen={cleanOpen}
        onClose={() => setCleanOpen(false)}
        totalCount={libraryEntries.length}
        externalCount={externalCount}
        onClearExternal={removeExternalMangas}
        onClearAll={clearLibrary}
      />
    </div>
  );
}
