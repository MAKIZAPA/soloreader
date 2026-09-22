"use client";

import { ShieldCheck, X, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegalModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-neutral-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-800/60 text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Marco Legal & Cumplimiento DMCA</h3>
              <p className="text-xs text-neutral-400">Arquitectura de lectura abierta tipo Tachiyomi / Mihon</p>
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

        {/* Content Body */}
        <div className="mt-5 space-y-4 text-xs leading-relaxed text-neutral-300">
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>1. Naturaleza del Software (Reader Engine)</span>
            </div>
            <p>
              <b>Lector Manga</b> es un framework de lectura e indexación local y de código abierto.
              Funciona bajo el mismo estándar técnico y legal que proyectos consolidados como <b>Tachiyomi</b>, <b>Mihon</b>, <b>Paperback</b> y <b>Suwayomi</b>.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>2. Ausencia Total de Alojamiento (Zero-Hosting Policy)</span>
            </div>
            <p>
              Este repositorio, sus despliegues en servidores o plataformas en la nube (incluyendo Vercel) y sus bases de datos <b>NO almacenan, distribuyen, copian ni alojan</b> ningún tipo de imagen, archivo multimedia, traducción, capítulo ni obra protegida por derechos de autor.
            </p>
            <p className="text-neutral-400">
              Todo el contenido visualizado es procesado en tiempo real en el navegador del usuario directamente desde fuentes públicas o servidores de terceros mediante llamadas estándar a APIs públicas.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>3. Propiedad Intelectual & Marcas</span>
            </div>
            <p>
              Todos los mangas, manhwas, cómics, personajes y logotipos son propiedad exclusiva de sus respectivos autores, editoriales originales y grupos de traducción (scanlations). Lector Manga no reclama ningún derecho comercial ni de autor sobre dicho material.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <AlertTriangle className="size-4 text-cyan-400" />
              <span>4. Política de Notificaciones DMCA</span>
            </div>
            <p>
              Al tratarse de una herramienta de visualización (similar a un navegador web o lector RSS), Lector Manga no tiene control sobre los servidores de terceros indexados. Cualquier reclamación sobre derechos de autor debe ser dirigida al proveedor original de la fuente o al servicio de alojamiento de imágenes correspondiente.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileText className="size-4 text-emerald-400" />
              <span>5. Uso Personal y Educativo</span>
            </div>
            <p>
              Este software ha sido diseñado con fines estrictamente educativos y de interoperabilidad de formatos. El usuario final es el único responsable del uso que decida darle y de las fuentes externas que configure.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>6. Agradecimiento Especial a los Grupos de Scanlation</span>
            </div>
            <p className="text-neutral-300">
              Expresamos nuestro mayor reconocimiento y gratitud a los equipos de traducción de la comunidad:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1">
              <li><b>Olympus Scan</b>: Por su excelente trabajo de traducción, edición y maquetación en Manhwas y Webtoons.</li>
              <li><b>Dragon Translation</b>: Por su dedicación continua al catálogo en español.</li>
              <li><b>Knight No Scanlation / RN (Nartag)</b>: Por su histórica labor y aporte al cómic digital en español.</li>
              <li><b>MangaDex & Fansubs Comunitarios</b>: Por fomentar un archivo abierto y sin fines de lucro para los lectores globales.</li>
            </ul>
            <p className="text-[11px] text-neutral-400 pt-1">
              Lector Manga preserva los créditos y marcas de agua originales de cada grupo. Si perteneces a un equipo de scanlation y deseas que tu enlace sea modificado o excluido del índice, puedes abrir un Issue en el repositorio oficial.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-neutral-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white border border-neutral-800 hover:bg-neutral-800 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
