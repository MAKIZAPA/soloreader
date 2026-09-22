import { notFound } from "next/navigation";
import Link from "next/link";
import { getSource } from "@/lib/sources";
import { MangaDetails, SourceId } from "@/types";
import { MangaDetailClient } from "./MangaDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    source: string;
    id: string;
  }>;
}

export default async function MangaDetailPage({ params }: PageProps) {
  const { source: rawSource, id: rawId } = await params;
  const sourceId = rawSource as SourceId;
  const decodedId = decodeURIComponent(rawId);

  if (sourceId !== "olympus" && sourceId !== "dragon" && sourceId !== "mangadex") {
    notFound();
  }

  const provider = getSource(sourceId);
  let details: MangaDetails | null = null;
  let fetchError = false;

  try {
    details = await provider.getDetails(decodedId);
  } catch (error) {
    console.error("Error loading manga details:", error);
    fetchError = true;
  }

  if (fetchError || !details) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center text-neutral-300">
        <h2 className="text-lg font-bold text-white mb-2">No se pudo cargar la serie</h2>
        <p className="text-xs text-neutral-400 max-w-md mb-4">
          La fuente remota tardó en responder o el identificador no existe en este momento.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return <MangaDetailClient details={details} />;
}
