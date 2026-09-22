"use client";

import { useState } from "react";
import { ChapterPages } from "@/types";
import { ReaderView } from "@/components/reader/ReaderView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LocalReaderClientProps {
  sessionKey: string;
}

export function LocalReaderClient({ sessionKey }: LocalReaderClientProps) {
  const [data] = useState<ChapterPages | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          chapterId: sessionKey,
          mangaId: "local-manga",
          source: "local",
          chapterNumber: "1",
          title: parsed.title || "Lectura Local",
          pages: parsed.pages || [],
        };
      }
    } catch (e) {
      console.error("Failed to load local session:", e);
    }
    return null;
  });

  if (!data || data.pages.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-neutral-300">
        <h2 className="text-base font-bold text-white mb-2">Sesión local no encontrada</h2>
        <p className="text-xs text-neutral-400 max-w-sm mb-4">
          La sesión de imágenes en memoria ha expirado o fue cerrada.
        </p>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    );
  }

  return <ReaderView data={data} mangaTitle={data.title} />;
}
