import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources";
import { SourceId } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ source: string }> }
) {
  const { source: rawSource } = await context.params;
  const sourceId = rawSource as SourceId;

  if (sourceId !== "olympus" && sourceId !== "dragon" && sourceId !== "mangadex") {
    return NextResponse.json({ error: `Fuente no soportada: ${rawSource}` }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "popular";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const query = searchParams.get("query") || searchParams.get("q") || "";
  const id = searchParams.get("id") || "";
  const chapterId = searchParams.get("chapterId") || "";

  const provider = getSource(sourceId);

  try {
    switch (action) {
      case "popular": {
        const data = await provider.getPopular(page);
        return NextResponse.json(data);
      }
      case "latest": {
        const data = await provider.getLatest(page);
        return NextResponse.json(data);
      }
      case "search": {
        const data = await provider.search(query, page);
        return NextResponse.json(data);
      }
      case "details": {
        if (!id) {
          return NextResponse.json({ error: "Parámetro 'id' requerido" }, { status: 400 });
        }
        const details = await provider.getDetails(id);
        return NextResponse.json(details);
      }
      case "pages": {
        if (!id || !chapterId) {
          return NextResponse.json({ error: "Parámetros 'id' y 'chapterId' requeridos" }, { status: 400 });
        }
        const pages = await provider.getPages(id, chapterId);
        return NextResponse.json(pages);
      }
      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error(`[API Source ${sourceId} / ${action}] Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
