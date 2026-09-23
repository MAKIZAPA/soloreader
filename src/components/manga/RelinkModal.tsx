"use client";

import { useState, useEffect } from "react";
import { Link2, X, Search, BookOpen, Loader2 } from "lucide-react";
import { MangaItem, SourceId } from "@/types";
import { formatProxyUrl } from "@/lib/utils";

interface RelinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  manga: MangaItem | null;
  onRelink: (target: MangaItem) => void;
}

export function RelinkModal({ isOpen, onClose, manga, onRelink }: RelinkModalProps) {
  if (!isOpen || !manga) return null;

  return (
    <RelinkDialog
      key={`${manga.source}:${manga.id}`}
      manga={manga}
      onClose={onClose}
      onRelink={onRelink}
    />
  );
}

function RelinkDialog({
  manga,
  onClose,
  onRelink,
}: {
  manga: MangaItem;
  onClose: () => void;
  onRelink: (target: MangaItem) => void;
}) {
  const [searchQuery, setSearchQuery] = useState(manga.title);
  const [searching, setSearching] = useState(true);
  const [results, setResults] = useState<MangaItem[]>([]);
  const [hasSearched, setHasSearched] = useState(true);

  const searchSources = async (queryText: string) => {
    const query = queryText.trim();
    if (!query) return;

    setSearching(true);
    setHasSearched(true);

    const sources: SourceId[] = ["olympus", "mangadex", "dragon"];
    const found: MangaItem[] = [];

    await Promise.all(
      sources.map(async (src) => {
        try {
          const res = await fetch(
            `/api/sources/${src}?action=search&q=${encodeURIComponent(query)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.items)) {
              found.push(...data.items.slice(0, 5));
            }
          }
        } catch (err) {
          console.warn(`Search error on ${src}:`, err);
        }
      })
    );

    setResults(found);
    setSearching(false);
  };

  useEffect(() => {
    let ignore = false;

    const initialFetch = async () => {
      const sources: SourceId[] = ["olympus", "mangadex", "dragon"];
      const found: MangaItem[] = [];

      await Promise.all(
        sources.map(async (src) => {
          try {
            const res = await fetch(
              `/api/sources/${src}?action=search&q=${encodeURIComponent(manga.title)}`
            );
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.items)) {
                found.push(...data.items.slice(0, 5));
              }
            }
          } catch (err) {
            console.warn(`Initial search error on ${src}:`, err);
          }
        })
      );

      if (!ignore) {
        setResults(found);
        setSearching(false);
      }
    };

    initialFetch();

    return () => {
      ignore = true;
    };
  }, [manga.title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchSources(searchQuery);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-lg max-h-[85vh] rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden text-neutral-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Vincular con Fuente Activa</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Current Manga Context */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3 flex items-center gap-3">
            <div className="size-11 rounded-lg bg-neutral-950 overflow-hidden shrink-0 border border-neutral-800">
              {manga.coverUrl ? (
                <img
                  src={formatProxyUrl(manga.coverUrl)}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-neutral-600">
                  <BookOpen className="size-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                {manga.originalSource ? `Externa: ${manga.originalSource}` : "Por Vincular"}
              </span>
              <p className="text-xs font-bold text-white truncate mt-1">{manga.title}</p>
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Busca y vincula esta serie con <b>Olympus</b>, <b>MangaDex</b> o <b>Dragon</b> para leer online conservando tu progreso y capítulos leídos.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="size-3.5 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre del manga..."
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition shrink-0"
            >
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {/* Results List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pt-1">
            {searching && (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-400 gap-2">
                <Loader2 className="size-5 animate-spin text-emerald-400" />
                <span className="text-xs">Buscando en fuentes activas...</span>
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-neutral-400 px-1">
                  :: Coincidencias encontradas ({results.length})
                </div>
                {results.map((target) => (
                  <div
                    key={`${target.source}:${target.id}`}
                    onClick={() => {
                      onRelink(target);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="size-10 rounded-lg bg-neutral-950 overflow-hidden shrink-0 border border-neutral-800">
                        {target.coverUrl ? (
                          <img
                            src={formatProxyUrl(target.coverUrl)}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-neutral-600">
                            <BookOpen className="size-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">
                          {target.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                            Fuente: {target.source}
                          </span>
                          {target.totalChapters && (
                            <span className="text-[10px] text-neutral-500 font-mono">
                              • {target.totalChapters} caps
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRelink(target);
                        onClose();
                      }}
                      className="shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                    >
                      Vincular
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!searching && hasSearched && results.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-500 space-y-1">
                <p>No se encontraron resultados en las fuentes disponibles.</p>
                <p className="text-[11px] text-neutral-600">
                  Prueba simplificando el título o quitando subtítulos especiales.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
