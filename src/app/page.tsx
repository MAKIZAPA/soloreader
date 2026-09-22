"use client";

import { useState, useEffect } from "react";
import {
  Compass,
  Bookmark,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trash2,
  FolderUp,
  ShieldCheck,
} from "lucide-react";
import { MangaItem } from "@/types";
import { useAppStore } from "@/lib/store";
import { Navbar } from "@/components/layout/Navbar";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { SearchModal } from "@/components/layout/SearchModal";
import { LegalModal } from "@/components/legal/LegalModal";
import { LocalReaderModal } from "@/components/local/LocalReaderModal";
import { formatProxyUrl, cn } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const { activeSource, library, history, clearHistory, removeHistoryItem } = useAppStore();

  const [activeTab, setActiveTab] = useState<"explore" | "library" | "history">("explore");
  const [catalogView, setCatalogView] = useState<"popular" | "latest">("popular");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [localOpen, setLocalOpen] = useState(false);

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

  // Filtered library
  const libraryEntries = Object.values(library);
  const filteredLibrary = libraryEntries.filter((entry) => {
    if (libraryFilter === "all") return true;
    return entry.status === libraryFilter;
  });

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      {/* Navbar */}
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenLegal={() => setLegalOpen(true)}
        onOpenLocal={() => setLocalOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("explore")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition border",
                activeTab === "explore"
                  ? "bg-neutral-900 text-white border-neutral-700 shadow-xs"
                  : "bg-transparent text-neutral-400 border-transparent hover:text-white hover:bg-neutral-900/50"
              )}
            >
              <Compass className="size-4 text-emerald-400" />
              <span>Explorar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition border",
                activeTab === "library"
                  ? "bg-neutral-900 text-white border-neutral-700 shadow-xs"
                  : "bg-transparent text-neutral-400 border-transparent hover:text-white hover:bg-neutral-900/50"
              )}
            >
              <Bookmark className="size-4 text-cyan-400" />
              <span>Biblioteca</span>
              {libraryEntries.length > 0 && (
                <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] text-cyan-300 font-mono border border-cyan-500/30">
                  {libraryEntries.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition border",
                activeTab === "history"
                  ? "bg-neutral-900 text-white border-neutral-700 shadow-xs"
                  : "bg-transparent text-neutral-400 border-transparent hover:text-white hover:bg-neutral-900/50"
              )}
            >
              <Clock className="size-4 text-neutral-300" />
              <span>Historial</span>
            </button>
          </div>

          {/* Quick Local & Legal Buttons for desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900/80 px-2.5 py-1.5 text-xs text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white transition"
            >
              <FolderUp className="size-3.5 text-neutral-400" />
              <span>Lector Offline</span>
            </button>

            <button
              type="button"
              onClick={() => setLegalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900/80 px-2.5 py-1.5 text-xs text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white transition"
            >
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>DMCA</span>
            </button>
          </div>
        </div>

        {/* TAB 1: EXPLORE */}
        {activeTab === "explore" && (
          <div className="space-y-6">
            {/* View Subtabs & Source Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-3 rounded-2xl border border-neutral-800/80">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCatalogViewChange("popular")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    catalogView === "popular"
                      ? "bg-neutral-800 text-white shadow-xs"
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
                      ? "bg-neutral-800 text-white shadow-xs"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  <Sparkles className="size-3.5 text-cyan-400" />
                  <span>Últimos Capítulos</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <span>Fuente activa:</span>
                <span className="rounded bg-neutral-900 px-2 py-0.5 text-white font-bold uppercase tracking-wider border border-neutral-800">
                  {activeSource}
                </span>
              </div>
            </div>

            {/* Manga Grid */}
            <MangaGrid
              items={items}
              loading={loading}
              emptyTitle="No hay series disponibles en esta sección"
              emptyDescription="Prueba refrescando o cambiando entre Olympus y MangaDex."
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
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "Todos" },
                { id: "reading", label: "Leyendo" },
                { id: "completed", label: "Completados" },
                { id: "plan_to_read", label: "Por Leer" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setLibraryFilter(pill.id)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold border transition",
                    libraryFilter === pill.id
                      ? "bg-neutral-800 text-white border-neutral-700"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white"
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Library Grid */}
            <MangaGrid
              items={filteredLibrary.map((entry) => entry.manga)}
              emptyTitle="Tu biblioteca está vacía"
              emptyDescription="Explora el catálogo y pulsa el icono de marcador para guardar tus series favoritas aquí."
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
      </main>

      {/* Modals */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <LegalModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} />
      <LocalReaderModal isOpen={localOpen} onClose={() => setLocalOpen(false)} />
    </div>
  );
}
