"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Bookmark, Clock, FolderUp, ShieldCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface NavbarProps {
  onOpenSearch?: () => void;
  onOpenLegal?: () => void;
  onOpenLocal?: () => void;
}

export function Navbar({ onOpenSearch, onOpenLegal, onOpenLocal }: NavbarProps) {
  const pathname = usePathname();
  const { activeSource, setActiveSource, library } = useAppStore();
  const libraryCount = Object.keys(library).length;

  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 text-white transition hover:opacity-80">
            <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400">
              <BookOpen className="size-4" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">LECTOR MANGA</span>
              <span className="text-[10px] text-neutral-400 tracking-wider">OMARCHY SUITE</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition",
                isHome
                  ? "bg-neutral-900 text-white border border-neutral-800"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
              )}
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
              {libraryCount > 0 && (
                <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  {libraryCount}
                </span>
              )}
            </Link>

            <Link
              href="/#historial"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-md transition"
            >
              <Clock className="size-3.5" />
              Historial
            </Link>

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

        {/* Source Selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Source Switcher */}
          <div className="flex items-center rounded-lg bg-neutral-950 p-0.5 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveSource("olympus")}
              className={cn(
                "px-2.5 py-1 font-medium rounded-md transition",
                activeSource === "olympus"
                  ? "bg-neutral-800 text-white shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              Olympus
            </button>
            <button
              type="button"
              onClick={() => setActiveSource("dragon")}
              className={cn(
                "px-2.5 py-1 font-medium rounded-md transition",
                activeSource === "dragon"
                  ? "bg-neutral-800 text-white shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              Dragon
            </button>
            <button
              type="button"
              onClick={() => setActiveSource("mangadex")}
              className={cn(
                "px-2.5 py-1 font-medium rounded-md transition",
                activeSource === "mangadex"
                  ? "bg-neutral-800 text-white shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              MangaDex
            </button>
          </div>

          {/* Search Trigger */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white transition"
              title="Buscar mangas (Ctrl+K)"
            >
              <Search className="size-3.5" />
              <span className="hidden sm:inline">Buscar...</span>
              <kbd className="hidden sm:inline rounded bg-neutral-950 px-1.5 py-0.5 text-[10px] text-neutral-400 border border-neutral-800">
                /
              </kbd>
            </button>
          )}

          {/* Legal / DMCA trigger */}
          {onOpenLegal && (
            <button
              type="button"
              onClick={onOpenLegal}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition"
              title="Aviso Legal y DMCA"
            >
              <ShieldCheck className="size-4 text-emerald-400" />
              <span className="hidden md:inline">Legal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
