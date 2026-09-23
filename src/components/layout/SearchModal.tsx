"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, BookOpen, Globe2 } from "lucide-react";
import { MangaItem, SourceId } from "@/types";
import { formatProxyUrl } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOURCE_BADGES: Record<SourceId | "local" | "external", { label: string; color: string }> = {
  olympus: {
    label: "Olympus",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  dragon: {
    label: "Dragon",
    color: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  mangadex: {
    label: "MangaDex",
    color: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  rncalation: {
    label: "Rncalation",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  local: {
    label: "Local",
    color: "bg-neutral-800 text-neutral-400 border-neutral-700",
  },
  external: {
    label: "Externo",
    color: "bg-neutral-800 text-neutral-400 border-neutral-700",
  },
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery("");
    setResults([]);
    setCounts({});
    setSelectedSource("all");
    onClose();
  }, [onClose]);

  const handleClearQuery = () => {
    setQuery("");
    setResults([]);
    setCounts({});
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global search across all 4 sources
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.items || []);
          setCounts(data.counts || {});
        }
      } catch (err) {
        console.error("Global search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const filteredResults =
    selectedSource === "all"
      ? results
      : results.filter((m) => m.source === selectedSource);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
          <Globe2 className="size-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) {
                setResults([]);
                setCounts({});
              }
            }}
            placeholder="Búsqueda global (Olympus, Dragon, MangaDex, Rncalation)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          {loading && <Loader2 className="size-4 animate-spin text-emerald-400" />}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="text-neutral-400 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd
            onClick={handleClose}
            className="cursor-pointer rounded bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-neutral-400 border border-neutral-800 hover:text-white"
          >
            ESC
          </kbd>
        </div>

        {/* Source Filter Tabs */}
        {results.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-neutral-800/80 bg-neutral-900/30 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedSource("all")}
              className={`px-2.5 py-1 rounded-lg border font-medium transition shrink-0 ${
                selectedSource === "all"
                  ? "bg-neutral-800 border-neutral-700 text-white"
                  : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              Todas ({counts.all || results.length})
            </button>

            {(counts.olympus || 0) > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSource("olympus")}
                className={`px-2.5 py-1 rounded-lg border font-medium transition shrink-0 ${
                  selectedSource === "olympus"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "border-transparent text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900"
                }`}
              >
                Olympus ({counts.olympus})
              </button>
            )}

            {(counts.dragon || 0) > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSource("dragon")}
                className={`px-2.5 py-1 rounded-lg border font-medium transition shrink-0 ${
                  selectedSource === "dragon"
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                    : "border-transparent text-neutral-400 hover:text-rose-400 hover:bg-neutral-900"
                }`}
              >
                Dragon ({counts.dragon})
              </button>
            )}

            {(counts.mangadex || 0) > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSource("mangadex")}
                className={`px-2.5 py-1 rounded-lg border font-medium transition shrink-0 ${
                  selectedSource === "mangadex"
                    ? "bg-sky-500/20 border-sky-500/40 text-sky-400"
                    : "border-transparent text-neutral-400 hover:text-sky-400 hover:bg-neutral-900"
                }`}
              >
                MangaDex ({counts.mangadex})
              </button>
            )}

            {(counts.rncalation || 0) > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSource("rncalation")}
                className={`px-2.5 py-1 rounded-lg border font-medium transition shrink-0 ${
                  selectedSource === "rncalation"
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                    : "border-transparent text-neutral-400 hover:text-purple-400 hover:bg-neutral-900"
                }`}
              >
                Rncalation ({counts.rncalation})
              </button>
            )}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-neutral-900">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center p-8 text-neutral-400 text-xs">
              <Loader2 className="size-4 animate-spin mr-2 text-emerald-400" />
              Buscando simultáneamente en todas las fuentes...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 text-xs">
              <p>No se encontraron resultados para &ldquo;{query}&rdquo; en ninguna fuente.</p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Prueba con una palabra clave diferente (ej. &ldquo;kim&rdquo;, &ldquo;espada&rdquo;, &ldquo;solo&rdquo;).
              </p>
            </div>
          )}

          {filteredResults.map((manga) => {
            const badge = SOURCE_BADGES[manga.source] || SOURCE_BADGES.external;
            return (
              <div
                key={`${manga.source}:${manga.id}`}
                onClick={() => {
                  handleClose();
                  router.push(`/manga/${manga.source}/${encodeURIComponent(manga.id)}`);
                }}
                className="group flex cursor-pointer items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-900/80 transition"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-neutral-900 border border-neutral-800">
                  {manga.coverUrl ? (
                    <img
                      src={formatProxyUrl(manga.coverUrl)}
                      alt={manga.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-600">
                      <BookOpen className="size-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-semibold border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <h4 className="text-xs font-semibold text-neutral-200 group-hover:text-emerald-400 truncate">
                      {manga.title}
                    </h4>
                  </div>
                  {manga.lastChapter && (
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      Último: {manga.lastChapter}
                    </p>
                  )}
                  {manga.totalChapters && !manga.lastChapter && (
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      {manga.totalChapters} capítulos disponibles
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
