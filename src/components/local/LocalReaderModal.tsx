"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FolderUp, X, UploadCloud, ArrowRight } from "lucide-react";

interface LocalReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocalReaderModal({ isOpen, onClose }: LocalReaderModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/")
      );
      // Sort naturally by filename
      filesArray.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      );
      setSelectedFiles(filesArray);
      if (!title && filesArray[0]) {
        setTitle(filesArray[0].name.split(".")[0] || "Manga Local");
      }
    }
  };

  const startReading = () => {
    if (selectedFiles.length === 0) return;

    // Store blob URLs temporarily in session or memory
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    const localSessionKey = `local_session_${Date.now()}`;
    sessionStorage.setItem(
      localSessionKey,
      JSON.stringify({
        title: title || "Capítulo Local",
        pages: urls,
      })
    );

    onClose();
    router.push(`/read/local/local-manga/${localSessionKey}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-neutral-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-white">
              <FolderUp className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lector de Archivos Locales</h3>
              <p className="text-xs text-neutral-400">Lectura offline sin conexión ni consumo de datos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Nombre de la serie o capítulo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Mi Manga Favorito - Cap 01"
              className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            />
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8 text-center cursor-pointer hover:border-neutral-700 hover:bg-neutral-900/50 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFiles}
            />
            <UploadCloud className="size-8 text-neutral-500 mb-2" />
            <span className="text-xs font-semibold text-white">
              Seleccionar imágenes del capítulo
            </span>
            <span className="mt-1 text-[11px] text-neutral-500">
              Soporta WebP, PNG, JPG, JPEG (Múltiples archivos)
            </span>
          </div>

          {selectedFiles.length > 0 && (
            <div className="rounded-lg bg-neutral-900/80 border border-neutral-800 p-3 flex items-center justify-between text-xs">
              <span className="text-neutral-300">
                {selectedFiles.length} páginas detectadas y ordenadas
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-neutral-500 hover:text-red-400 text-[11px]"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-900 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={selectedFiles.length === 0}
            onClick={startReading}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            <span>Abrir en el Lector</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
