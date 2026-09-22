"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen } from "lucide-react";
import { MangaItem } from "@/types";
import { formatProxyUrl, optimizeCoverUrl, cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface MangaCardProps {
  manga: MangaItem;
}

export function MangaCard({ manga }: MangaCardProps) {
  const [imgError, setImgError] = useState(false);
  const { isInLibrary, addToLibrary, removeFromLibrary } = useAppStore();

  const inLibrary = isInLibrary(manga.id);
  const optimizedCover = manga.coverUrl ? optimizeCoverUrl(manga.coverUrl) : "";
  const proxyCover = optimizedCover ? formatProxyUrl(optimizedCover) : "";

  const toggleLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inLibrary) {
      removeFromLibrary(manga.id);
    } else {
      addToLibrary(manga, "reading");
    }
  };

  return (
    <Link
      href={`/manga/${manga.source}/${encodeURIComponent(manga.id)}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-neutral-900/60 border border-neutral-800/80 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-900 hover:shadow-lg hover:shadow-black/50"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
        {!imgError && proxyCover ? (
          // Standard img tag to allow dynamic proxy streaming without Next.js Image domain restrictions
          <img
            src={proxyCover}
            alt={manga.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-neutral-600">
            <BookOpen className="size-8 stroke-[1.2] text-neutral-700" />
            <span className="mt-2 text-[11px] font-medium leading-tight line-clamp-2">
              {manga.title}
            </span>
          </div>
        )}

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Source Badge */}
        <div className="absolute top-2 left-2">
          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-neutral-300 border border-white/10 backdrop-blur-xs uppercase tracking-wider">
            {manga.source}
          </span>
        </div>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={toggleLibrary}
          className={cn(
            "absolute top-2 right-2 flex size-7 items-center justify-center rounded-lg border backdrop-blur-xs transition",
            inLibrary
              ? "bg-emerald-500/90 text-black border-emerald-400"
              : "bg-black/60 text-white/80 border-white/10 hover:bg-black/90 hover:text-white"
          )}
          title={inLibrary ? "En biblioteca (Clic para quitar)" : "Guardar en biblioteca"}
        >
          <Bookmark className="size-3.5 fill-current" />
        </button>

        {/* Bottom Metadata in Image */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-neutral-300 font-medium">
          {manga.totalChapters ? (
            <span className="rounded bg-black/60 px-1.5 py-0.5 border border-white/5">
              {manga.totalChapters} caps
            </span>
          ) : manga.lastChapter ? (
            <span className="rounded bg-black/60 px-1.5 py-0.5 border border-white/5 truncate max-w-[120px]">
              {manga.lastChapter}
            </span>
          ) : (
            <span />
          )}

          {manga.status && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                manga.status === "completed"
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                  : "bg-cyan-950/80 text-cyan-400 border border-cyan-800/40"
              )}
            >
              {manga.status === "completed" ? "Fin" : "Activo"}
            </span>
          )}
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="flex flex-1 flex-col p-2.5">
        <h3
          className="text-xs font-semibold text-neutral-200 line-clamp-2 leading-snug group-hover:text-white transition"
          title={manga.title}
        >
          {manga.title}
        </h3>
      </div>
    </Link>
  );
}
