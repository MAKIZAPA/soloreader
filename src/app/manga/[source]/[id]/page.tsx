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

  let details: MangaDetails | null = null;

  // Only try to fetch from remote providers if it's an integrated online source
  if (sourceId === "olympus" || sourceId === "dragon" || sourceId === "mangadex") {
    try {
      const provider = getSource(sourceId);
      details = await provider.getDetails(decodedId);
    } catch (error) {
      console.warn(`[MangaDetailPage] Remote fetch failed for ${sourceId}:${decodedId}:`, error);
    }
  }

  // Pass details if found, or provide fallbackSource and fallbackId for client library retrieval
  return (
    <MangaDetailClient
      details={details}
      fallbackSource={sourceId}
      fallbackId={decodedId}
    />
  );
}
