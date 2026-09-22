import { notFound } from "next/navigation";
import Link from "next/link";
import { getSource } from "@/lib/sources";
import { ChapterPages, MangaDetails, SourceId } from "@/types";
import { ReaderView } from "@/components/reader/ReaderView";
import { LocalReaderClient } from "./LocalReaderClient";

export const dynamic = "force-dynamic";

interface ReadPageProps {
  params: Promise<{
    source: string;
    id: string;
    chapterId: string;
  }>;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { source: rawSource, id: rawId, chapterId: rawChapterId } = await params;
  const sourceId = rawSource as SourceId;
  const mangaId = decodeURIComponent(rawId);
  const chapterId = decodeURIComponent(rawChapterId);

  // If local offline session
  if (sourceId === "local") {
    return <LocalReaderClient sessionKey={chapterId} />;
  }

  if (sourceId !== "olympus" && sourceId !== "dragon" && sourceId !== "mangadex") {
    notFound();
  }

  const provider = getSource(sourceId);
  let pagesData: ChapterPages | null = null;
  let mangaDetails: MangaDetails | null = null;
  let hasError = false;

  try {
    const [pages, details] = await Promise.all([
      provider.getPages(mangaId, chapterId),
      provider.getDetails(mangaId).catch(() => null),
    ]);
    pagesData = pages;
    mangaDetails = details;
  } catch (error) {
    console.error("Error loading chapter pages:", error);
    hasError = true;
  }

  if (hasError || !pagesData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center text-neutral-300 bg-black">
        <h2 className="text-lg font-bold text-white mb-2">Error al cargar las páginas del capítulo</h2>
        <p className="text-xs text-neutral-400 max-w-md mb-4">
          La fuente remota no respondió o las imágenes del capítulo han expirado temporalmente.
        </p>
        <Link
          href={`/manga/${sourceId}/${mangaId}`}
          className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
        >
          Volver a la Serie
        </Link>
      </div>
    );
  }

  // Calculate prev and next chapter IDs
  let prevChapterId: string | undefined;
  let nextChapterId: string | undefined;

  if (mangaDetails && mangaDetails.chapters) {
    const currentIndex = mangaDetails.chapters.findIndex((c) => c.id === chapterId);
    if (currentIndex !== -1) {
      nextChapterId = mangaDetails.chapters[currentIndex - 1]?.id;
      prevChapterId = mangaDetails.chapters[currentIndex + 1]?.id;
    }
  }

  return (
    <ReaderView
      data={pagesData}
      mangaTitle={mangaDetails?.title || mangaId}
      prevChapterId={prevChapterId}
      nextChapterId={nextChapterId}
    />
  );
}
