"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X, Layers } from "lucide-react";

interface CleanLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
  externalCount: number;
  onClearExternal: () => void;
  onClearAll: () => void;
}

export function CleanLibraryModal({
  isOpen,
  onClose,
  totalCount,
  externalCount,
  onClearExternal,
  onClearAll,
}: CleanLibraryModalProps) {
  const [confirmAll, setConfirmAll] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-md rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden text-neutral-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 text-red-400" />
            <h3 className="text-sm font-bold text-white">Limpiar Biblioteca</h3>
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
        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-400 leading-relaxed">
            Selecciona la opción de limpieza que deseas aplicar a tu biblioteca local:
          </p>

          <div className="space-y-3">
            {/* Option 1: Clean only unlinked external mangas */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Mangas Externos No Vinculados
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {externalCount} títulos
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Elimina únicamente las series importadas de fuentes externas (como ZonaTMO) que aún no han sido vinculadas a fuentes activas.
              </p>
              <button
                type="button"
                disabled={externalCount === 0}
                onClick={() => {
                  onClearExternal();
                  onClose();
                }}
                className="w-full mt-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Limpiar {externalCount} externas
              </button>
            </div>

            {/* Option 2: Empty entire library */}
            <div className="rounded-xl border border-red-950/60 bg-red-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="size-4 text-red-400" />
                  <span className="text-xs font-bold text-white">
                    Vaciar Biblioteca Completa
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-red-300 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">
                  {totalCount} títulos
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Elimina todos los mangas guardados en tu biblioteca local. Tu historial de lectura y estadísticas se conservarán.
              </p>

              {!confirmAll ? (
                <button
                  type="button"
                  disabled={totalCount === 0}
                  onClick={() => setConfirmAll(true)}
                  className="w-full mt-1 rounded-lg bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Vaciar biblioteca completa
                </button>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-red-400">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>¿Confirmas que deseas borrar todos los mangas?</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        onClose();
                      }}
                      className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition"
                    >
                      Sí, vaciar todo
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAll(false)}
                      className="rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800/80 bg-neutral-950/60 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
