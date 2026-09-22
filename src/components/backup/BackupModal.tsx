"use client";

import { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Smartphone,
  Layers,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MihonBackupResult } from "@/types";
import { formatProxyUrl, optimizeCoverUrl, cn } from "@/lib/utils";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const { library, stats, importMihonBackup, exportBackup } = useAppStore();

  const [activeTab, setActiveTab] = useState<"import" | "export" | "sync_info">("import");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<MihonBackupResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setParsedResult(null);
    setImportedCount(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/backup/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo interpretar el archivo de backup.");
      }

      setParsedResult(data.result);
    } catch (err: unknown) {
      console.error("Error al procesar backup:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado al leer el archivo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedResult) return;
    importMihonBackup(parsedResult.mangas, importMode);
    setImportedCount(parsedResult.totalMangas);
    setParsedResult(null);
  };

  const handleExportDownload = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `lector-manga-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentLibraryCount = Object.keys(library).length;
  const currentStatsCount = Object.keys(stats).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Copias de Seguridad & Mihon
              </h2>
              <p className="text-[11px] text-neutral-400">
                Importa datos de Mihon / Tachiyomi o exporta tu biblioteca local.
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

        {/* Modal Tabs */}
        <div className="flex items-center border-b border-neutral-800 bg-neutral-900/50 px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition",
              activeTab === "import"
                ? "border-emerald-400 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            )}
          >
            <UploadCloud className="size-3.5" />
            <span>Importar de Mihon</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition",
              activeTab === "export"
                ? "border-emerald-400 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            )}
          >
            <Download className="size-3.5" />
            <span>Exportar Biblioteca</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sync_info")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition",
              activeTab === "sync_info"
                ? "border-emerald-400 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            )}
          >
            <Smartphone className="size-3.5" />
            <span>Cómo Sincronizar</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: IMPORT MIHON BACKUP */}
          {activeTab === "import" && (
            <div className="space-y-4">
              {importedCount !== null && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-300">
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Importación completada con éxito</h4>
                    <p className="mt-0.5 text-neutral-300">
                      Se han incorporado {importedCount} series y sus capítulos leídos a tu
                      biblioteca y estadísticas locales.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
                  <AlertCircle className="size-5 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Error al leer el archivo</h4>
                    <p className="mt-0.5 text-neutral-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              {!parsedResult && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 bg-neutral-900/30 p-8 text-center cursor-pointer transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".tachibk,.proto.gz,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex size-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400">
                    {loading ? (
                      <RefreshCw className="size-6 animate-spin text-emerald-400" />
                    ) : (
                      <UploadCloud className="size-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {loading
                        ? "Descomprimiendo y analizando backup..."
                        : "Selecciona o arrastra tu archivo de backup"}
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400 font-mono">
                      Formatos compatibles: .tachibk (Mihon), .proto.gz (Tachiyomi), .json
                    </p>
                  </div>
                </div>
              )}

              {/* Parsed Result Preview */}
              {parsedResult && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono font-semibold text-white truncate">
                          {fileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setParsedResult(null);
                          setError(null);
                        }}
                        className="text-xs text-neutral-400 hover:text-white transition"
                      >
                        Cambiar archivo
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800">
                        <span className="text-[10px] text-neutral-400">Series detectadas</span>
                        <div className="text-sm font-bold font-mono text-white mt-0.5">
                          {parsedResult.totalMangas}
                        </div>
                      </div>

                      <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800">
                        <span className="text-[10px] text-neutral-400">Capítulos leídos</span>
                        <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                          {parsedResult.totalChaptersRead}
                        </div>
                      </div>

                      <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-neutral-400">Fuentes detectadas</span>
                        <div className="text-xs font-semibold text-neutral-200 mt-0.5 truncate">
                          {Object.keys(parsedResult.sources).length > 0
                            ? Object.values(parsedResult.sources).join(", ")
                            : "Olympus / Multi"}
                        </div>
                      </div>
                    </div>

                    {/* Mode selector */}
                    <div className="pt-2 border-t border-neutral-800">
                      <span className="text-[11px] font-semibold text-neutral-300 block mb-2">
                        Modo de importación:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setImportMode("merge")}
                          className={cn(
                            "rounded-xl border p-2.5 text-left text-xs transition",
                            importMode === "merge"
                              ? "border-emerald-500/40 bg-emerald-950/20 text-white"
                              : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white"
                          )}
                        >
                          <div className="font-semibold text-white">Fusionar</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Conserva tu biblioteca actual y agrega las obras nuevas.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setImportMode("replace")}
                          className={cn(
                            "rounded-xl border p-2.5 text-left text-xs transition",
                            importMode === "replace"
                              ? "border-red-500/40 bg-red-950/20 text-white"
                              : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white"
                          )}
                        >
                          <div className="font-semibold text-white">Reemplazar</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Sobrescribe la biblioteca con el contenido del backup.
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sample mangas */}
                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Vista previa de obras (primeras {Math.min(5, parsedResult.mangas.length)} de {parsedResult.totalMangas})
                    </h4>
                    <div className="divide-y divide-neutral-900 rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                      {parsedResult.mangas.slice(0, 5).map((m, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5">
                          <div className="size-10 rounded-md bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                            {m.thumbnailUrl ? (
                              <img
                                src={formatProxyUrl(optimizeCoverUrl(m.thumbnailUrl))}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-600">
                                <BookOpen className="size-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-semibold text-white truncate">{m.title}</h5>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              {m.readChapters} de {m.totalChapters} caps leídos
                              {m.sourceName ? ` • ${m.sourceName}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-black transition"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Confirmar e Importar {parsedResult.totalMangas} Obras</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT BACKUP */}
          {activeTab === "export" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Resumen de tu Biblioteca Actual
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Todos los datos se descargan en formato JSON estándar legible y portable.
                    </p>
                  </div>
                  <Download className="size-5 text-emerald-400" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-neutral-950 p-3 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400">Total en Biblioteca</span>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      {currentLibraryCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-neutral-950 p-3 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400">Registros de Estadísticas</span>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                      {currentStatsCount}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportDownload}
                  disabled={currentLibraryCount === 0 && currentStatsCount === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-100 hover:bg-white text-black py-2.5 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Download className="size-4" />
                  <span>Descargar Copia de Seguridad (.json)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SYNC INFO & HOW IT WORKS */}
          {activeTab === "sync_info" && (
            <div className="space-y-4 text-xs text-neutral-300">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Smartphone className="size-4 text-emerald-400" />
                  <span>¿Cómo funciona la sincronización con Mihon (Android)?</span>
                </h4>
                <p className="text-neutral-400 leading-relaxed">
                  Mihon es una aplicación nativa de Android que almacena sus datos en una base de datos local SQLite protegida en tu dispositivo. Al ser una app local sin servicio en la nube propio, no cuenta con un servidor público para sincronización automática en tiempo real.
                </p>
                <div className="rounded-xl bg-neutral-950 p-3 border border-neutral-800 space-y-2 text-[11px]">
                  <div className="font-semibold text-white">Pasos para sincronizar tus datos:</div>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                    <li>En tu teléfono, abre <b>Mihon</b>.</li>
                    <li>Ve a <b>Más &gt; Ajustes &gt; Copias de seguridad &gt; Crear copia de seguridad</b>.</li>
                    <li>Guarda el archivo generado (ej. <code className="text-neutral-200">mihon_2026-09-22.tachibk</code>).</li>
                    <li>Envíalo a tu PC o compártelo (por Telegram, Google Drive, WhatsApp o cable).</li>
                    <li>En esta aplicación, entra a <b>Estadísticas &gt; Importar Backup</b> y sube el archivo.</li>
                  </ol>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Este visualizador descomprime y analiza directamente la estructura binaria Protocol Buffers de Mihon, importando todas tus obras, capítulos leídos y portadas sin necesidad de reconfigurar nada.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
