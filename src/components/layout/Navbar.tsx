"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  Bookmark,
  Clock,
  BarChart3,
  FolderUp,
  ShieldCheck,
  Search,
  User as UserIcon,
  Cloud,
  LogOut,
  RefreshCw,
  Share2,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { AuthModal } from "@/components/auth/AuthModal";
import { AniListModal } from "@/components/tracker/AniListModal";
import { SourceId } from "@/types";

const SOURCE_INFO: Record<string, { name: string; tag: string; dotColor: string }> = {
  olympus: { name: "Olympus", tag: "Manhwa HD", dotColor: "bg-emerald-400" },
  dragon: { name: "Dragon", tag: "Webtoons", dotColor: "bg-rose-400" },
  mangadex: { name: "MangaDex", tag: "Global", dotColor: "bg-sky-400" },
  rncalation: { name: "Rncalation", tag: "Novelas & Manhwa", dotColor: "bg-purple-400" },
};

interface NavbarProps {
  onOpenSearch?: () => void;
  onOpenLegal?: () => void;
  onOpenLocal?: () => void;
  activeTab?: "explore" | "library" | "history" | "stats";
  onSelectTab?: (tab: "explore" | "library" | "history" | "stats") => void;
}

export function Navbar({
  onOpenSearch,
  onOpenLegal,
  onOpenLocal,
  activeTab = "explore",
  onSelectTab,
}: NavbarProps) {
  const pathname = usePathname();
  const {
    activeSource,
    setActiveSource,
    library,
    history,
    stats,
    mergeCloudData,
  } = useAppStore();
  const libraryCount = Object.keys(library).length;

  const isHome = pathname === "/";

  // Auth & Sync State
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [aniListModalOpen, setAniListModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dynamic Source Selector State
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const sourceMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterSource = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setSourceMenuOpen(true);
  };

  const handleMouseLeaveSource = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setSourceMenuOpen(false);
    }, 160);
  };

  // Check session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (sourceMenuRef.current && !sourceMenuRef.current.contains(event.target as Node)) {
        setSourceMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSyncPush = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ library, history, stats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al sincronizar");
      setSyncMsg("Sincronizado");
      setTimeout(() => setSyncMsg(null), 3000);
    } catch (err: unknown) {
      setSyncMsg(err instanceof Error ? err.message : "Error");
      setTimeout(() => setSyncMsg(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncPull = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/user/sync");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al recuperar");
      if (data.data) {
        mergeCloudData(data.data);
      }
      setSyncMsg("Restaurado");
      setTimeout(() => setSyncMsg(null), 3000);
    } catch (err: unknown) {
      setSyncMsg(err instanceof Error ? err.message : "Error");
      setTimeout(() => setSyncMsg(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserMenuOpen(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleTabClick = (tab: "explore" | "library" | "history" | "stats") => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5 text-white transition hover:opacity-80">
              <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400">
                <BookOpen className="size-4" strokeWidth={2} />
              </div>
              <span className="text-sm font-bold tracking-tight text-white hidden xs:inline">Lector Manga</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {isHome && onSelectTab ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleTabClick("explore")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition",
                      activeTab === "explore"
                        ? "bg-neutral-900 text-white border border-neutral-800"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                    )}
                  >
                    <Compass className="size-3.5" />
                    Explorar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabClick("library")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition",
                      activeTab === "library"
                        ? "bg-neutral-900 text-white border border-neutral-800"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                    )}
                  >
                    <Bookmark className="size-3.5" />
                    Biblioteca
                    {libraryCount > 0 && (
                      <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                        {libraryCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabClick("history")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition",
                      activeTab === "history"
                        ? "bg-neutral-900 text-white border border-neutral-800"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                    )}
                  >
                    <Clock className="size-3.5" />
                    Historial
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabClick("stats")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition",
                      activeTab === "stats"
                        ? "bg-neutral-900 text-white border border-neutral-800"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                    )}
                  >
                    <BarChart3 className="size-3.5 text-amber-400" />
                    Estadísticas
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-md transition"
                  >
                    <Compass className="size-3.5" />
                    Explorar
                  </Link>
                  <Link
                    href="/#biblioteca"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-md transition"
                  >
                    <Bookmark className="size-3.5" />
                    Biblioteca
                  </Link>
                </>
              )}

              {onOpenLocal && (
                <button
                  type="button"
                  onClick={onOpenLocal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-md transition"
                >
                  <FolderUp className="size-3.5" />
                  Lector Local
                </button>
              )}
            </nav>
          </div>

          {/* Actions: Source switcher, Search, AniList, Account */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Dynamic Hover/Click Source Selector */}
            <div
              className="relative"
              ref={sourceMenuRef}
              onMouseEnter={handleMouseEnterSource}
              onMouseLeave={handleMouseLeaveSource}
            >
              <button
                type="button"
                onClick={() => setSourceMenuOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-lg bg-neutral-950 px-2.5 py-1.5 border border-neutral-800 text-[11px] sm:text-xs font-medium text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900 transition",
                  sourceMenuOpen && "border-neutral-700 bg-neutral-900"
                )}
                title="Cambiar fuente de lectura (pasa el cursor o haz clic para ver todas)"
              >
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    SOURCE_INFO[activeSource]?.dotColor || "bg-emerald-400"
                  )}
                />
                <span className="font-semibold text-white">
                  {SOURCE_INFO[activeSource]?.name || "Fuente"}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3 text-neutral-400 transition-transform duration-200",
                    sourceMenuOpen && "rotate-180 text-white"
                  )}
                />
              </button>

              {/* Floating Dropdown displaying all 4 sources */}
              {sourceMenuOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-52 rounded-xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-md p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-800/80 mb-1">
                    Fuentes de Lectura (4)
                  </div>

                  {(["olympus", "dragon", "mangadex", "rncalation"] as SourceId[]).map((srcId) => {
                    const info = SOURCE_INFO[srcId];
                    const isActive = activeSource === srcId;

                    return (
                      <button
                        key={srcId}
                        type="button"
                        onClick={() => {
                          setActiveSource(srcId);
                          setSourceMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition text-left",
                          isActive
                            ? "bg-neutral-900 text-white font-semibold border border-neutral-800"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("size-2 rounded-full shrink-0", info.dotColor)} />
                          <div>
                            <p
                              className={cn(
                                "text-xs leading-none",
                                isActive ? "text-white" : "text-neutral-300"
                              )}
                            >
                              {info.name}
                            </p>
                            <p className="text-[10px] text-neutral-500 mt-0.5">{info.tag}</p>
                          </div>
                        </div>

                        {isActive && <Check className="size-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Trigger */}
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-neutral-900 px-2 sm:px-3 py-1.5 text-xs text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white transition"
                title="Buscar mangas (Ctrl+K)"
              >
                <Search className="size-3.5" />
                <span className="hidden md:inline">Buscar...</span>
                <kbd className="hidden lg:inline rounded bg-neutral-950 px-1 py-0.5 text-[9px] text-neutral-400 border border-neutral-800">
                  /
                </kbd>
              </button>
            )}

            {/* AniList Tracker trigger */}
            <button
              type="button"
              onClick={() => setAniListModalOpen(true)}
              className="flex items-center gap-1 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs text-sky-400 hover:text-sky-300 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition"
              title="Seguimiento AniList / Mihon"
            >
              <Share2 className="size-3.5" />
              <span className="hidden lg:inline font-medium">AniList</span>
            </button>

            {/* User Account / Cloud Sync */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-white hover:border-neutral-700 transition"
                >
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="max-w-[70px] sm:max-w-[100px] truncate">@{user.username}</span>
                  <ChevronDown className="size-3 text-neutral-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-xl z-50 text-xs space-y-1">
                    <div className="px-2.5 py-2 border-b border-neutral-800/80">
                      <p className="font-semibold text-white truncate">@{user.username}</p>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Cloud className="size-3 text-emerald-400" />
                        <span>Sincronizado en la nube</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncPush}
                      disabled={syncing}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-neutral-300 hover:text-white hover:bg-neutral-900 transition disabled:opacity-50 text-left"
                    >
                      <RefreshCw className={cn("size-3.5 text-emerald-400", syncing && "animate-spin")} />
                      <span>Sincronizar a la nube</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncPull}
                      disabled={syncing}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-neutral-300 hover:text-white hover:bg-neutral-900 transition disabled:opacity-50 text-left"
                    >
                      <Cloud className="size-3.5 text-sky-400" />
                      <span>Restaurar de la nube</span>
                    </button>

                    {syncMsg && (
                      <div className="px-2.5 py-1 text-[11px] text-emerald-400 font-medium">
                        • {syncMsg}
                      </div>
                    )}

                    <div className="border-t border-neutral-800/80 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-rose-400 hover:bg-rose-950/30 transition text-left"
                      >
                        <LogOut className="size-3.5" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
                title="Iniciar Sesión / Sincronización en la nube"
              >
                <UserIcon className="size-3.5" />
                <span className="hidden sm:inline">Cuenta</span>
              </button>
            )}

            {/* Legal / DMCA trigger */}
            {onOpenLegal && (
              <button
                type="button"
                onClick={onOpenLegal}
                className="hidden md:flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition"
                title="Aviso Legal y DMCA"
              >
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>Legal</span>
              </button>
            )}

            {/* GitHub author link */}
            <a
              href="https://github.com/makizapa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition"
              title="GitHub @makizapa"
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span className="hidden lg:inline">makizapa</span>
            </a>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        {isHome && onSelectTab && (
          <div className="flex md:hidden items-center justify-around border-t border-neutral-800/80 bg-neutral-950/95 px-2 py-1.5 overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => handleTabClick("explore")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0",
                activeTab === "explore"
                  ? "bg-neutral-800 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Compass className="size-3.5 text-emerald-400" />
              <span>Explorar</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("library")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0",
                activeTab === "library"
                  ? "bg-neutral-800 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Bookmark className="size-3.5 text-cyan-400" />
              <span>Biblioteca</span>
              {libraryCount > 0 && (
                <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] text-cyan-300 font-mono border border-cyan-500/30">
                  {libraryCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("history")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0",
                activeTab === "history"
                  ? "bg-neutral-800 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Clock className="size-3.5 text-neutral-300" />
              <span>Historial</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("stats")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0",
                activeTab === "stats"
                  ? "bg-neutral-800 text-white shadow-xs"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <BarChart3 className="size-3.5 text-amber-400" />
              <span>Estadísticas</span>
            </button>
          </div>
        )}
      </header>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(userData) => {
          setUser(userData);
          handleSyncPush();
        }}
      />

      <AniListModal
        isOpen={aniListModalOpen}
        onClose={() => setAniListModalOpen(false)}
      />
    </>
  );
}
