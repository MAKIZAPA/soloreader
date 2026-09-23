import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

const SAVE_ENTRY_MUTATION = `
mutation ($mediaId: Int!, $status: MediaListStatus, $progress: Int) {
  SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress) {
    id
    mediaId
    status
    progress
  }
}
`;

interface SyncEntry {
  mediaId: number;
  progress: number;
  status?: "CURRENT" | "COMPLETED" | "PLANNING" | "DROPPED" | "PAUSED";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const entries: SyncEntry[] = Array.isArray(body?.entries) ? body.entries : [];

    if (!token) {
      return NextResponse.json(
        { error: "Se requiere un token de acceso de AniList." },
        { status: 400 }
      );
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron mangas para sincronizar." },
        { status: 400 }
      );
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      if (!entry.mediaId) continue;

      try {
        const res = await fetch(ANILIST_GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: SAVE_ENTRY_MUTATION,
            variables: {
              mediaId: entry.mediaId,
              status: entry.status || "CURRENT",
              progress: entry.progress || 0,
            },
          }),
          signal: AbortSignal.timeout(8000),
        });

        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
          const msg = data.errors[0]?.message || "Error al actualizar serie";
          errors.push(`ID ${entry.mediaId}: ${msg}`);
          if (msg.toLowerCase().includes("invalid token")) {
            return NextResponse.json(
              { error: "Token de AniList inválido o expirado. Por favor genera uno nuevo." },
              { status: 401 }
            );
          }
        } else {
          successCount++;
        }
      } catch (err: unknown) {
        errors.push(`ID ${entry.mediaId}: ${err instanceof Error ? err.message : "Fallo de conexión"}`);
      }

      // Small delay between requests to stay safe within AniList's 90 req/min limit
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      total: entries.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Bulk Sync API] Error:", error);
    return NextResponse.json(
      { error: "Error inesperado al sincronizar con AniList." },
      { status: 500 }
    );
  }
}
