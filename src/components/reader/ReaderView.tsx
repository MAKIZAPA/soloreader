"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings2,
  Layers,
  FileText,
  Columns,
  ArrowLeft,
} from "lucide-react";
import { ChapterPages, ReaderMode, FitMode } from "@/types";
import { useAppStore } from "@/lib/store";
import { formatProxyUrl, cn } from "@/lib/utils";

interface ReaderViewProps {
  data: ChapterPages;
  mangaTitle?: string;
  prevChapterId?: string;
  nextChapterId?: string;
}

export function ReaderView({
  data,
  mangaTitle = "Manga",
  prevChapterId,
  nextChapterId,
}: ReaderViewProps) {
  const router = useRouter();
  const { readerSettings, updateReaderSettings, recordHistory, updateLibraryProgress } = useAppStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [showHUD, setShowHUD] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalPages = data.pages.length;

  // Record history on mount or chapter change
  useEffect(() => {
    if (totalPages > 0) {
      recordHistory({
        mangaId: data.mangaId,
        source: data.source,
        mangaTitle: mangaTitle,
        mangaCover: data.pages[0] || "",
        chapterId: data.chapterId,
        chapterNumber: data.chapterNumber,
        chapterTitle: data.title,
        page: currentPage,
        totalPages: totalPages,
      });

      updateLibraryProgress(data.mangaId, data.chapterId, data.chapterNumber, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.chapterId, data.mangaId, data.chapterNumber, data.source, mangaTitle, totalPages]);

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const cycleMode = useCallback(() => {
    const modes: ReaderMode[] = ["webtoon", "single", "double"];
    const next = modes[(modes.indexOf(readerSettings.mode) + 1) % modes.length];
    updateReaderSettings({ mode: next });
  }, [readerSettings.mode, updateReaderSettings]);

  const goToNextPage = useCallback(() => {
    if (readerSettings.mode === "webtoon") {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
    } else if (readerSettings.mode === "double") {
      if (currentPage + 2 <= totalPages) {
        setCurrentPage((p) => p + 2);
      } else if (nextChapterId) {
        router.push(`/read/${data.source}/${data.mangaId}/${nextChapterId}`);
      }
    } else {
      if (currentPage < totalPages) {
        setCurrentPage((p) => p + 1);
      } else if (nextChapterId) {
        router.push(`/read/${data.source}/${data.mangaId}/${nextChapterId}`);
      }
    }
  }, [currentPage, totalPages, readerSettings.mode, nextChapterId, router, data.source, data.mangaId]);

  const goToPrevPage = useCallback(() => {
    if (readerSettings.mode === "webtoon") {
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
    } else if (readerSettings.mode === "double") {
      if (currentPage > 2) {
        setCurrentPage((p) => p - 2);
      } else {
        setCurrentPage(1);
      }
    } else {
      if (currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else if (prevChapterId) {
        router.push(`/read/${data.source}/${data.mangaId}/${prevChapterId}`);
      }
    }
  }, [currentPage, readerSettings.mode, prevChapterId, router, data.source, data.mangaId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "k" || e.key === "K" || e.key === "PageDown") {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J" || e.key === "PageUp") {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        cycleMode();
      } else if (e.key === "Escape") {
        setShowHUD(true);
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage, cycleMode]);

  // Track active page in webtoon mode via IntersectionObserver
  useEffect(() => {
    if (readerSettings.mode !== "webtoon") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageIndex = Number(entry.target.getAttribute("data-page-index"));
            if (pageIndex) setCurrentPage(pageIndex);
          }
        }
      },
      { threshold: 0.3 }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [readerSettings.mode, totalPages]);

  const getPageUrl = (raw: string) => {
    if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;
    return formatProxyUrl(raw);
  };

  const bgClass =
    readerSettings.background === "black"
      ? "bg-black"
      : readerSettings.background === "dark"
      ? "bg-neutral-950"
      : "bg-zinc-900";

  return (
    <div
      ref={containerRef}
      className={cn("min-h-screen text-white select-none relative", bgClass)}
      onClick={() => setShowHUD((prev) => !prev)}
    >
      {/* Top Floating HUD */}
      <header
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-neutral-800/80 bg-black/90 px-4 py-2.5 backdrop-blur-md transition-all duration-200",
          showHUD ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/manga/${data.source}/${data.mangaId}`}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white border border-neutral-800 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Volver</span>
          </Link>

          <div className="flex flex-col">
            <h1 className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-md">
              {mangaTitle}
            </h1>
            <span className="text-[11px] text-neutral-400">
              {data.title || `Capítulo ${data.chapterNumber}`} • {currentPage} / {totalPages}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reader Mode Selector */}
          <div className="flex items-center rounded-lg bg-neutral-900 p-0.5 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => updateReaderSettings({ mode: "webtoon" })}
              className={cn(
                "p-1.5 rounded-md transition",
                readerSettings.mode === "webtoon"
                  ? "bg-neutral-800 text-emerald-400"
                  : "text-neutral-400 hover:text-white"
              )}
              title="Modo Cascada (Webtoon)"
            >
              <Layers className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateReaderSettings({ mode: "single" })}
              className={cn(
                "p-1.5 rounded-md transition",
                readerSettings.mode === "single"
                  ? "bg-neutral-800 text-emerald-400"
                  : "text-neutral-400 hover:text-white"
              )}
              title="Modo Página Simple"
            >
              <FileText className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateReaderSettings({ mode: "double" })}
              className={cn(
                "p-1.5 rounded-md transition",
                readerSettings.mode === "double"
                  ? "bg-neutral-800 text-emerald-400"
                  : "text-neutral-400 hover:text-white"
              )}
              title="Modo Doble Página"
            >
              <Columns className="size-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center size-8 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:text-white transition"
            title="Pantalla completa (F)"
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="flex items-center justify-center size-8 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:text-white transition"
            title="Ajustes de lectura"
          >
            <Settings2 className="size-3.5" />
          </button>
        </div>
      </header>

      {/* Settings Popup */}
      {showSettings && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-14 right-4 z-50 w-72 rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl text-xs text-neutral-300 space-y-3"
        >
          <div className="font-semibold text-white border-b border-neutral-800 pb-2">
            Ajustes del Lector
          </div>

          <div>
            <label className="text-[11px] text-neutral-400 block mb-1.5">Ajuste de Imagen</label>
            <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-center">
              {(["width", "height", "original"] as FitMode[]).map((fit) => (
                <button
                  key={fit}
                  type="button"
                  onClick={() => updateReaderSettings({ fit })}
                  className={cn(
                    "py-1 rounded font-medium capitalize transition",
                    readerSettings.fit === fit
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  {fit === "width" ? "Ancho" : fit === "height" ? "Alto" : "Original"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-neutral-400 block mb-1.5">Dirección de Lectura</label>
            <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-center">
              <button
                type="button"
                onClick={() => updateReaderSettings({ direction: "ltr" })}
                className={cn(
                  "py-1 rounded font-medium transition",
                  readerSettings.direction === "ltr"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Occidental (LTR)
              </button>
              <button
                type="button"
                onClick={() => updateReaderSettings({ direction: "rtl" })}
                className={cn(
                  "py-1 rounded font-medium transition",
                  readerSettings.direction === "rtl"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Manga (RTL)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-neutral-400 block mb-1.5">Fondo de Visualización</label>
            <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-center">
              {(["black", "dark", "zinc"] as const).map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => updateReaderSettings({ background: bg })}
                  className={cn(
                    "py-1 rounded font-medium capitalize transition",
                    readerSettings.background === bg
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  {bg === "black" ? "Negro Puro" : bg === "dark" ? "Obsidiana" : "Gris Zinc"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex justify-center w-full min-h-screen">
        {/* Mode: Webtoon (Continuous vertical strip) */}
        {readerSettings.mode === "webtoon" && (
          <div
            className={cn(
              "flex flex-col items-center w-full",
              readerSettings.fit === "width" ? "max-w-3xl" : "max-w-5xl"
            )}
            style={{ gap: `${readerSettings.gap}px` }}
          >
            {data.pages.map((pageUrl, idx) => {
              const pageNum = idx + 1;
              return (
                <div
                  key={idx}
                  ref={(el) => {
                    pageRefs.current[idx] = el;
                  }}
                  data-page-index={pageNum}
                  className="w-full relative flex justify-center bg-black min-h-[400px]"
                >
                  <img
                    src={getPageUrl(pageUrl)}
                    alt={`Página ${pageNum}`}
                    loading={idx < 3 ? "eager" : "lazy"}
                    onLoad={() => setLoadedPages((p) => ({ ...p, [pageNum]: true }))}
                    className={cn(
                      "w-full h-auto object-contain block transition-opacity duration-300",
                      loadedPages[pageNum] ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {!loadedPages[pageNum] && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-600 animate-pulse">
                      Página {pageNum}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mode: Single Page */}
        {readerSettings.mode === "single" && (
          <div className="flex h-screen w-full items-center justify-center p-4">
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img
                src={getPageUrl(data.pages[currentPage - 1] || "")}
                alt={`Página ${currentPage}`}
                className={cn(
                  "object-contain max-h-[94vh] max-w-full shadow-2xl",
                  readerSettings.fit === "height" ? "h-[94vh] w-auto" : "w-auto h-auto"
                )}
              />
            </div>
          </div>
        )}

        {/* Mode: Double Page Spread */}
        {readerSettings.mode === "double" && (
          <div className="flex h-screen w-full items-center justify-center p-4 gap-2">
            {readerSettings.direction === "rtl" ? (
              <>
                {currentPage + 1 <= totalPages && (
                  <img
                    src={getPageUrl(data.pages[currentPage] || "")}
                    alt={`Página ${currentPage + 1}`}
                    className="max-h-[94vh] max-w-[48%] object-contain"
                  />
                )}
                <img
                  src={getPageUrl(data.pages[currentPage - 1] || "")}
                  alt={`Página ${currentPage}`}
                  className="max-h-[94vh] max-w-[48%] object-contain"
                />
              </>
            ) : (
              <>
                <img
                  src={getPageUrl(data.pages[currentPage - 1] || "")}
                  alt={`Página ${currentPage}`}
                  className="max-h-[94vh] max-w-[48%] object-contain"
                />
                {currentPage + 1 <= totalPages && (
                  <img
                    src={getPageUrl(data.pages[currentPage] || "")}
                    alt={`Página ${currentPage + 1}`}
                    className="max-h-[94vh] max-w-[48%] object-contain"
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Navigation HUD */}
      <footer
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center border-t border-neutral-800/80 bg-black/90 px-4 py-2.5 backdrop-blur-md transition-all duration-200 gap-2",
          showHUD ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="flex w-full max-w-2xl items-center justify-between gap-4">
          {/* Prev Chapter */}
          {prevChapterId ? (
            <Link
              href={`/read/${data.source}/${data.mangaId}/${prevChapterId}`}
              className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white border border-neutral-800 transition"
              title="Capítulo anterior"
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Link>
          ) : (
            <div className="w-16" />
          )}

          {/* Slider and Page Counter */}
          <div className="flex flex-1 items-center gap-3">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const targetPage = Number(e.target.value);
                setCurrentPage(targetPage);
                if (readerSettings.mode === "webtoon") {
                  pageRefs.current[targetPage - 1]?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="text-xs font-mono font-medium text-neutral-300 min-w-[50px] text-right">
              {currentPage} / {totalPages}
            </span>
          </div>

          {/* Next Chapter */}
          {nextChapterId ? (
            <Link
              href={`/read/${data.source}/${data.mangaId}/${nextChapterId}`}
              className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 transition"
              title="Siguiente capítulo"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </footer>
    </div>
  );
}
