"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ArrowUpDown,
  Search,
  ExternalLink,
  Layers,
  Check,
  CheckCheck,
  Link2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { MangaDetails, MangaItem } from "@/types";
import { formatProxyUrl, formatDate, formatDuration, cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { RelinkModal } from "@/components/manga/RelinkModal";

interface MangaDetailClientProps {
  details: MangaDetails | null;
  fallbackSource?: string;
  fallbackId?: string;
}

export function MangaDetailClient({
  details: initialDetails,
  fallbackSource,
  fallbackId,
}: MangaDetailClientProps) {
  const router = useRouter();
  const {
    isInLibrary,
    addToLibrary,
    removeFromLibrary,
    library,
    stats,
    toggleChapterRead,
    markChaptersUpTo,
    relinkManga,
  } = useAppStore();

  const [sortDesc, setSortDesc] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  // Relink modal state
  const [relinkOpen, setRelinkOpen] = useState(false);

  function normalizeSimple(str: string): string {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  // Find corresponding entry in library if exists
  const effectiveSource = initialDetails?.source || fallbackSource || "external";
  const effectiveId = initialDetails?.id || fallbackId || "";
  const libraryKey = `${effectiveSource}:${effectiveId}`;

  const targetTitleNorm = initialDetails?.title ? normalizeSimple(initialDetails.title) : "";
  const targetIdNorm = normalizeSimple(effectiveId);
  const fallbackIdNorm = fallbackId ? normalizeSimple(fallbackId) : "";

  const libEntry =
    library[libraryKey] ||
    Object.values(library).find((e) => {
      if (e.manga.id === effectiveId || e.manga.slug === effectiveId) return true;
      if (fallbackId && (e.manga.id === fallbackId || e.manga.slug === fallbackId)) return true;

      const entryIdNorm = normalizeSimple(e.manga.id);
      const entrySlugNorm = normalizeSimple(e.manga.slug || "");

      // Base slug prefix match (e.g. lider-kim vs lider-kim-20260922-080150808)
      if (
        (targetIdNorm.length >= 5 && (entryIdNorm.startsWith(targetIdNorm) || targetIdNorm.startsWith(entryIdNorm))) ||
        (targetIdNorm.length >= 5 && (entrySlugNorm.startsWith(targetIdNorm) || targetIdNorm.startsWith(entrySlugNorm))) ||
        (fallbackIdNorm.length >= 5 && (entryIdNorm.startsWith(fallbackIdNorm) || fallbackIdNorm.startsWith(entryIdNorm)))
      ) {
        return true;
      }

      // Exact title match check (e.g. "Líder Kim" in library vs "Lider Kim" on Olympus)
      if (targetTitleNorm.length >= 3) {
        const entryTitleNorm = normalizeSimple(e.manga.title);
        if (entryTitleNorm === targetTitleNorm) return true;
      }

      return false;
    });

  const isTitleMismatch = Boolean(
    initialDetails?.title &&
    libEntry?.manga.title &&
    normalizeSimple(initialDetails.title) !== normalizeSimple(libEntry.manga.title) &&
    !normalizeSimple(initialDetails.title).includes(normalizeSimple(libEntry.manga.title)) &&
    !normalizeSimple(libEntry.manga.title).includes(normalizeSimple(initialDetails.title))
  );

  const mangaStats =
    stats[libraryKey] ||
    Object.values(stats).find((s) => s.mangaId === effectiveId);

  // If initialDetails is null, synthesize from library if available
  const details: MangaDetails | null = initialDetails
    ? initialDetails
    : libEntry
    ? {
        id: libEntry.manga.id,
        source: libEntry.manga.source,
        title: libEntry.manga.title,
        slug: libEntry.manga.slug || libEntry.manga.id,
        coverUrl: libEntry.manga.coverUrl,
        status: libEntry.status === "completed" ? "completed" : "ongoing",
        synopsis:
          libEntry.manga.synopsis ||
          "Obra importada desde copia de seguridad de Mihon.",
        originalSource: libEntry.manga.originalSource,
        isExternal: libEntry.manga.isExternal || effectiveSource === "external",
        genres: libEntry.manga.genres || [],
        chapters: libEntry.savedChapters || [],
      }
    : null;

  if (!details) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center text-neutral-300 bg-black">
        <AlertCircle className="size-10 text-neutral-500 mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">No se pudo cargar la serie</h2>
        <p className="text-xs text-neutral-400 max-w-md mb-6 leading-relaxed">
          La fuente remota no respondió o el identificador no se encuentra registrado en tu biblioteca local.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const inLibrary = isInLibrary(details.id);
  const isExternal = Boolean(details.isExternal || details.source === "external");

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
  const resumeChapterId =
    libEntry?.lastReadChapterId ||
    (details.chapters.length > 0 ? sortedChapters[sortedChapters.length - 1]?.id : undefined);

  const handleApplyRelink = (target: MangaItem) => {
    relinkManga(libraryKey, target.source, target.id, target.title, target.coverUrl);
    setRelinkOpen(false);
    router.push(`/manga/${target.source}/${target.id}`);
  };

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
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold border uppercase tracking-wider",
                isExternal
                  ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800"
              )}
            >
              {details.originalSource || details.source}
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
        {/* Banner if title discrepancy detected */}
        {isTitleMismatch && (
          <div className="mb-6 rounded-2xl border border-amber-800/60 bg-amber-950/30 p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="size-4 shrink-0" />
                <span>Discrepancia de fuente detectada</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Esta obra en tu biblioteca corresponde a <b>«{libEntry?.manga.title}»</b>, pero el enlace remoto abrió <b>«{details.title}»</b>. Pulsa a continuación para corregirla y vincularla a la versión correcta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRelinkOpen(true)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
            >
              <Link2 className="size-3.5" />
              <span>Vincular {libEntry?.manga.title}</span>
            </button>
          </div>
        )}

        {/* Banner if external source or unlinked */}
        {isExternal && !isTitleMismatch && (
          <div className="mb-6 rounded-2xl border border-amber-800/40 bg-amber-950/20 p-4 text-xs text-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="size-4" />
                <span>Fuente de origen: {details.originalSource || "Externa"}</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Esta obra proviene de una fuente externa de tu respaldo de Mihon. Tus capítulos leídos y tiempo registrado están guardados de forma segura en tu biblioteca.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRelinkOpen(true)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <Link2 className="size-3.5" />
              <span>Vincular con fuente activa</span>
            </button>
          </div>
        )}

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

                {mangaStats && mangaStats.totalSeconds > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-0.5">
                    <Clock className="size-3" />
                    <span>{formatDuration(mangaStats.totalSeconds)} leídos</span>
                  </span>
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
              {!isExternal && resumeChapterId ? (
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
              ) : isExternal ? (
                <button
                  type="button"
                  onClick={() => setRelinkOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition"
                >
                  <Link2 className="size-4" />
                  <span>Vincular para Leer Online</span>
                </button>
              ) : (
                <button
                  disabled
                  className="rounded-xl bg-neutral-800 px-5 py-2.5 text-xs font-bold text-neutral-500 opacity-60"
                >
                  Capítulos no disponibles
                </button>
              )}

              {/* Relink trigger for online series too */}
              <button
                type="button"
                onClick={() => setRelinkOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 transition"
                title="Cambiar o vincular a otra fuente"
              >
                <Link2 className="size-3.5 text-neutral-400" />
                <span>Cambiar Fuente</span>
              </button>

              {!isExternal && (
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
                  <span>Visitar Scan</span>
                  <ExternalLink className="size-3.5 text-neutral-400" />
                </a>
              )}

              <span className="text-xs text-neutral-400">
                {libEntry?.totalChaptersRead
                  ? `${libEntry.totalChaptersRead} capítulos leídos`
                  : `${details.chapters.length} capítulos registrados`}
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

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick actions for read state */}
              {libEntry?.lastReadChapterNumber && (
                <button
                  type="button"
                  onClick={() =>
                    markChaptersUpTo(
                      details.id,
                      libEntry.lastReadChapterNumber || "",
                      details.chapters
                    )
                  }
                  className="flex items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white border border-neutral-800 transition"
                  title="Marcar como leídos todos los capítulos anteriores al último leído"
                >
                  <CheckCheck className="size-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Marcar hasta el último</span>
                </button>
              )}

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
              const chNumClean = String(ch.number || "").replace(/[^0-9.]/g, "");
              const chNumFloat = parseFloat(chNumClean);

              const readNumsSet = new Set(
                (libEntry?.readChapterNumbers || []).map((n) =>
                  parseFloat(String(n).replace(/[^0-9.]/g, ""))
                )
              );

              const lastReadFloat = libEntry?.lastReadChapterNumber
                ? parseFloat(String(libEntry.lastReadChapterNumber).replace(/[^0-9.]/g, ""))
                : NaN;

              const isLastRead =
                libEntry?.lastReadChapterId === ch.id ||
                (!isNaN(chNumFloat) && !isNaN(lastReadFloat) && chNumFloat === lastReadFloat);

              const isRead =
                isLastRead ||
                Boolean(libEntry?.readChapterIds && libEntry.readChapterIds.includes(ch.id)) ||
                (!isNaN(chNumFloat) && readNumsSet.has(chNumFloat)) ||
                (!isNaN(chNumFloat) && !isNaN(lastReadFloat) && chNumFloat <= lastReadFloat && chNumFloat > 0) ||
                Boolean(
                  libEntry?.savedChapters &&
                  libEntry.savedChapters.some(
                    (sc) =>
                      sc.read &&
                      (sc.id === ch.id ||
                        parseFloat(String(sc.number).replace(/[^0-9.]/g, "")) === chNumFloat)
                  )
                ) ||
                Boolean(ch.read);

              return (
                <div
                  key={ch.id}
                  className={cn(
                    "group flex items-center justify-between rounded-xl p-3 border transition",
                    isLastRead
                      ? "bg-emerald-950/30 border-emerald-800/60"
                      : isRead
                      ? "bg-neutral-900/30 border-neutral-800/50"
                      : "bg-neutral-900/40 border-neutral-800/70 hover:border-neutral-700 hover:bg-neutral-900"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                    {/* Toggle read button */}
                    <button
                      type="button"
                      onClick={() => toggleChapterRead(details.id, ch.id, ch.number)}
                      className={cn(
                        "size-5 rounded-md flex items-center justify-center shrink-0 border transition",
                        isRead
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                          : "bg-neutral-950 text-neutral-600 border-neutral-800 hover:text-neutral-400 hover:border-neutral-700"
                      )}
                      title={isRead ? "Marcar como no leído" : "Marcar como leído"}
                    >
                      <Check className={cn("size-3", !isRead && "opacity-0 hover:opacity-50")} />
                    </button>

                    {/* Chapter Link */}
                    {!isExternal ? (
                      <Link
                        href={`/read/${details.source}/${details.id}/${ch.id}`}
                        className="flex flex-col min-w-0 flex-1 truncate"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs font-bold transition truncate",
                              isLastRead
                                ? "text-emerald-300"
                                : isRead
                                ? "text-neutral-400 group-hover:text-white"
                                : "text-white group-hover:text-emerald-400"
                            )}
                          >
                            Capítulo {ch.number}
                          </span>
                          {isLastRead && (
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                              Último leído
                            </span>
                          )}
                          {isRead && !isLastRead && (
                            <span className="text-[10px] text-neutral-500 font-mono">
                              Leído
                            </span>
                          )}
                        </div>
                        {ch.title && ch.title !== `Capítulo ${ch.number}` && (
                          <span className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {ch.title}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="flex flex-col min-w-0 flex-1 truncate">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs font-bold truncate",
                              isRead ? "text-neutral-400" : "text-neutral-300"
                            )}
                          >
                            Capítulo {ch.number}
                          </span>
                          {isRead && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">
                              Leído
                            </span>
                          )}
                        </div>
                        {ch.title && ch.title !== `Capítulo ${ch.number}` && (
                          <span className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {ch.title}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end shrink-0 text-[10px] text-neutral-500 font-mono">
                    {ch.date && <span>{formatDate(ch.date)}</span>}
                    {ch.scanlator && <span className="text-neutral-400">{ch.scanlator}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredChapters.length === 0 && (
            <div className="p-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
              {details.chapters.length === 0
                ? "Esta obra aún no tiene lista de capítulos descargada."
                : `No hay capítulos coincidentes con "${filterQuery}"`}
            </div>
          )}
        </div>
      </div>

      {/* Relink Modal */}
      <RelinkModal
        isOpen={relinkOpen}
        onClose={() => setRelinkOpen(false)}
        manga={isTitleMismatch && libEntry ? libEntry.manga : details}
        onRelink={handleApplyRelink}
      />
    </div>
  );
}
