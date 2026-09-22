"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, BookOpen } from "lucide-react";
import { MangaItem } from "@/types";
import { useAppStore } from "@/lib/store";
import { formatProxyUrl } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const { activeSource } = useAppStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery("");
    setResults([]);
    onClose();
  }, [onClose]);

  const handleClearQuery = () => {
    setQuery("");
    setResults([]);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/sources/${activeSource}?action=search&query=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.items || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, activeSource]);

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
          <Search className="size-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setResults([]);
            }}
            placeholder={`Buscar en ${activeSource.toUpperCase()}... (ej. Sabueso, Solo Leveling)`}
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

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-neutral-900">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center p-8 text-neutral-400 text-xs">
              Buscando series en el catálogo...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 text-xs">
              <p>No se encontraron resultados para &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Verifica el nombre o prueba alternando entre Olympus y MangaDex.
              </p>
            </div>
          )}

          {results.map((manga) => (
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
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-600">
                    <BookOpen className="size-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[9px] font-semibold text-neutral-300 uppercase">
                    {manga.source}
                  </span>
                  <h4 className="text-xs font-semibold text-neutral-200 group-hover:text-emerald-400 truncate">
                    {manga.title}
                  </h4>
                </div>
                {manga.totalChapters && (
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    {manga.totalChapters} capítulos disponibles
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
