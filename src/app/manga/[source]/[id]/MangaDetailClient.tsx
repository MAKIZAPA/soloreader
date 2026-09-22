"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ArrowUpDown,
  Search,
  ExternalLink,
  Layers,
} from "lucide-react";
import { MangaDetails } from "@/types";
import { formatProxyUrl, formatDate, cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface MangaDetailClientProps {
  details: MangaDetails;
}

export function MangaDetailClient({ details }: MangaDetailClientProps) {
  const { isInLibrary, addToLibrary, removeFromLibrary, library } = useAppStore();
  const [sortDesc, setSortDesc] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  const inLibrary = isInLibrary(details.id);
  const libraryKey = `${details.source}:${details.id}`;
  const libEntry = library[libraryKey];

  const sortedChapters = [...details.chapters].sort((a, b) => {
    const numA = parseFloat(a.number) || 0;
    const numB = parseFloat(b.number) || 0;
    return sortDesc ? numB - numA : numA - numB;
  });

  const filteredChapters = sortedChapters.filter(
    (ch) =>
      ch.number.includes(filterQuery) ||
      (ch.title && ch.title.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const toggleLibrary = () => {
    if (inLibrary) {
      removeFromLibrary(details.id);
    } else {
      addToLibrary(details, "reading");
    }
  };

  // Find first chapter or resume chapter
  const resumeChapterId = libEntry?.lastReadChapterId || (details.chapters.length > 0 ? sortedChapters[sortedChapters.length - 1]?.id : undefined);

  return (
    <div className="min-h-screen bg-black text-neutral-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b border-neutral-800/80 bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white border border-neutral-800 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-neutral-400 border border-neutral-800 uppercase tracking-wider">
              {details.source}
            </span>
            <button
              type="button"
              onClick={toggleLibrary}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition",
                inLibrary
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white"
              )}
            >
              <Bookmark className={cn("size-3.5", inLibrary && "fill-current")} />
              <span>{inLibrary ? "En Biblioteca" : "Añadir a Biblioteca"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Manga Hero Header */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Cover Art */}
          <div className="w-48 sm:w-56 shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl">
              {details.coverUrl ? (
                <img
                  src={formatProxyUrl(details.coverUrl)}
                  alt={details.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-600">
                  <BookOpen className="size-12" />
                </div>
              )}
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 space-y-4 text-left">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold border",
                    details.status === "completed"
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/40"
                      : "bg-cyan-950/80 text-cyan-400 border-cyan-800/40"
                  )}
                >
                  {details.status === "completed" ? "Completado" : "En emisión"}
                </span>

                {details.author && (
                  <span className="text-xs text-neutral-400">Por {details.author}</span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {details.title}
              </h1>

              {details.alternativeTitles && details.alternativeTitles.length > 0 && (
                <p className="mt-1 text-xs text-neutral-400 line-clamp-1">
                  {details.alternativeTitles.join(" • ")}
                </p>
              )}
            </div>

            {/* Genres */}
            {details.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {details.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-medium text-neutral-300 border border-neutral-800"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4">
              <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                Sinopsis
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                {details.synopsis}
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {resumeChapterId ? (
                <Link
                  href={`/read/${details.source}/${details.id}/${resumeChapterId}`}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/10 transition"
                >
                  <BookOpen className="size-4" />
                  <span>
                    {libEntry?.lastReadChapterNumber
                      ? `Continuar: Cap ${libEntry.lastReadChapterNumber}`
                      : "Empezar a Leer"}
                  </span>
                </Link>
              ) : (
                <button
                  disabled
                  className="rounded-xl bg-neutral-800 px-5 py-2.5 text-xs font-bold text-neutral-500 opacity-60"
                >
                  Capítulos no disponibles
                </button>
              )}

              {/* External source support button */}
              <a
                href={
                  details.source === "olympus"
                    ? `https://olympusbiblioteca.com/series/comic-${details.slug}`
                    : details.source === "dragon"
                    ? `https://dragontranslation.org/manga/${details.slug}/`
                    : `https://mangadex.org/title/${details.slug}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 transition"
                title="Visitar la página oficial del Scanlation"
              >
                <span>Visitar Scan Oficial</span>
                <ExternalLink className="size-3.5 text-neutral-400" />
              </a>

              <span className="text-xs text-neutral-400">
                {details.chapters.length} capítulos registrados
              </span>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Lista de Capítulos ({details.chapters.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Search in chapters */}
              <div className="relative">
                <Search className="size-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filtrar capítulo..."
                  className="rounded-lg bg-neutral-900 border border-neutral-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 w-36 sm:w-48"
                />
              </div>

              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() => setSortDesc((v) => !v)}
                className="flex items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white border border-neutral-800 transition"
                title="Cambiar orden de capítulos"
              >
                <ArrowUpDown className="size-3.5" />
                <span className="hidden sm:inline">{sortDesc ? "Más recientes" : "Primeros"}</span>
              </button>
            </div>
          </div>

          {/* Chapters Grid / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredChapters.map((ch) => {
              const isCurrent = libEntry?.lastReadChapterId === ch.id;

              return (
                <Link
                  key={ch.id}
                  href={`/read/${details.source}/${details.id}/${ch.id}`}
                  className={cn(
                    "group flex items-center justify-between rounded-xl p-3 border transition",
                    isCurrent
                      ? "bg-emerald-950/30 border-emerald-800/60 text-white"
                      : "bg-neutral-900/40 border-neutral-800/70 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-300"
                  )}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                        Capítulo {ch.number}
                      </span>
                      {isCurrent && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                          Leído
                        </span>
                      )}
                    </div>
                    {ch.title && ch.title !== `Capítulo ${ch.number}` && (
                      <span className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {ch.title}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end shrink-0 text-[10px] text-neutral-500 font-mono">
                    {ch.date && <span>{formatDate(ch.date)}</span>}
                    {ch.scanlator && <span className="text-neutral-400">{ch.scanlator}</span>}
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredChapters.length === 0 && (
            <div className="p-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
              No hay capítulos coincidentes con &ldquo;{filterQuery}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
