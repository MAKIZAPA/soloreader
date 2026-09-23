import { LibraryEntry, MangaItem } from "@/types";
import { MangaCard } from "./MangaCard";
import { SearchX } from "lucide-react";

interface MangaGridProps {
  items: MangaItem[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRelink?: (manga: MangaItem) => void;
  onRemove?: (manga: MangaItem) => void;
  libraryMap?: Record<string, LibraryEntry>;
}

export function MangaGrid({
  items,
  loading = false,
  emptyTitle = "No se encontraron títulos",
  emptyDescription = "Intenta buscar con otros términos o cambiar de fuente.",
  onRelink,
  onRemove,
  libraryMap,
}: MangaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl bg-neutral-900/40 border border-neutral-800/50"
          >
            <div className="aspect-[2/3] w-full animate-pulse bg-neutral-800/60" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-800/80" />
              <div className="h-2 w-1/2 animate-pulse rounded bg-neutral-800/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 p-8 text-center bg-neutral-950/40">
        <div className="flex size-12 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 mb-3">
          <SearchX className="size-6 stroke-[1.5]" />
        </div>
        <h4 className="text-sm font-semibold text-neutral-200">{emptyTitle}</h4>
        <p className="mt-1 text-xs text-neutral-400 max-w-sm">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
      {items.map((manga) => {
        const libEntry = libraryMap ? libraryMap[`${manga.source}:${manga.id}`] : undefined;
        return (
          <MangaCard
            key={`${manga.source}:${manga.id}`}
            manga={manga}
            onRelink={onRelink}
            onRemove={onRemove}
            chaptersRead={libEntry?.totalChaptersRead}
          />
        );
      })}
    </div>
  );
}
