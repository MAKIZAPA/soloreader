"use client";

import { useState } from "react";
import {
  X,
  Share2,
  ExternalLink,
  Search,
  BookOpen,
  CheckCircle2,
  Loader2,
  Info,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { useAppStore } from "@/lib/store";

interface AniListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AniListEntry {
  id: number;
  status: string;
  progress: number;
  score: number;
  media: {
    id: number;
    title: {
      romaji?: string;
      english?: string;
      native?: string;
    };
    coverImage?: {
      large?: string;
      medium?: string;
    };
    chapters?: number;
    status?: string;
    siteUrl?: string;
  };
}

interface AniListList {
  name: string;
  status: string;
  entries: AniListEntry[];
}

export function AniListModal({ isOpen, onClose }: AniListModalProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<AniListList[]>([]);
  const [selectedList, setSelectedList] = useState<string>("CURRENT");
  const [importedStatus, setImportedStatus] = useState<string | null>(null);

  const { library, updateLibraryProgress } = useAppStore();

  if (!isOpen) return null;

  const handleFetchAniList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) {
      setError("Ingresa un nombre de usuario de AniList.");
      return;
    }

    setLoading(true);
    setError(null);
    setLists([]);

    try {
      const res = await fetch(`/api/tracker/anilist?username=${encodeURIComponent(cleanUser)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo recuperar la lista de AniList.");
      }

      setLists(data.lists || []);
      const readingList = (data.lists || []).find((l: AniListList) => l.status === "CURRENT");
      if (readingList) {
        setSelectedList("CURRENT");
      } else if (data.lists?.length > 0) {
        setSelectedList(data.lists[0].status || data.lists[0].name);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al conectar con AniList.");
    } finally {
      setLoading(false);
    }
  };

  const currentEntries = lists.find((l) => (l.status || l.name) === selectedList)?.entries || [];

  const handleSyncToLibrary = () => {
    let syncedCount = 0;
    const libraryKeys = Object.keys(library);

    currentEntries.forEach((entry) => {
      const mediaTitle = (entry.media.title.romaji || entry.media.title.english || "").toLowerCase();
      if (!mediaTitle || !entry.progress) return;

      const matchedKey = libraryKeys.find((k) => {
        const item = library[k];
        const itemTitle = (item.manga.title || "").toLowerCase();
        return (
          itemTitle.includes(mediaTitle) ||
          mediaTitle.includes(itemTitle) ||
          k.toLowerCase().includes(mediaTitle.replace(/[^a-z0-9]/g, "-"))
        );
      });

      if (matchedKey) {
        const item = library[matchedKey];
        updateLibraryProgress(item.manga.id, `ch-${entry.progress}`, String(entry.progress));
        syncedCount++;
      }
    });

    setImportedStatus(
      syncedCount > 0
        ? `Se sincronizó el progreso de ${syncedCount} series con tu biblioteca local.`
        : "No se encontraron coincidencias exactas con mangas de tu biblioteca actual."
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/80 bg-neutral-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-sky-400">
              <Share2 className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Sincronización con AniList</h2>
              <p className="text-xs text-neutral-400">
                Plataforma de seguimiento compatible con Mihon y Lector Manga
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Guide banner */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-sky-400 font-medium">
              <Info className="size-4 shrink-0" />
              <span>¿Cómo funciona el seguimiento seguro con Google?</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              <b>AniList</b> es una plataforma oficial, gratuita y 100% segura que permite registrarse e iniciar sesión directamente con <b>Google</b>. En Mihon, puedes ir a <i>Ajustes &gt; Seguimiento &gt; AniList</i> para registrar tus capítulos en la nube.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://anilist.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-sky-400 hover:underline"
              >
                <span>Abrir AniList.co</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          {/* Search username */}
          <form onSubmit={handleFetchAniList} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario en AniList (ej. Makizapa)"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-black hover:bg-sky-400 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : (
                <span>Consultar</span>
              )}
            </button>
          </form>

          {error && (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          {importedStatus && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{importedStatus}</span>
            </div>
          )}

          {/* Lists tab */}
          {lists.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {lists.map((l) => {
                    const key = l.status || l.name;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedList(key)}
                        className={`px-3 py-1 rounded-lg border font-medium transition shrink-0 ${
                          selectedList === key
                            ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                            : "border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {l.name} ({l.entries.length})
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSyncToLibrary}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1 text-xs font-medium text-white hover:border-emerald-500 hover:text-emerald-400 transition shrink-0 ml-2"
                >
                  <Layers className="size-3.5" />
                  <span>Sincronizar a Biblioteca</span>
                </button>
              </div>

              {/* Entries list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentEntries.map((entry) => {
                  const title =
                    entry.media.title.romaji ||
                    entry.media.title.english ||
                    entry.media.title.native ||
                    "Manga";
                  const cover = entry.media.coverImage?.medium || entry.media.coverImage?.large;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-2.5 hover:border-neutral-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {cover ? (
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                            <Image
                              src={cover}
                              alt={title}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500">
                            <BookOpen className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">{title}</p>
                          <p className="text-[11px] text-neutral-400">
                            Progreso:{" "}
                            <span className="text-emerald-400 font-semibold">
                              Cap. {entry.progress}
                            </span>
                            {entry.media.chapters ? ` / ${entry.media.chapters}` : ""}
                          </p>
                        </div>
                      </div>

                      {entry.media.siteUrl && (
                        <a
                          href={entry.media.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1.5 text-neutral-500 hover:text-white transition"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
