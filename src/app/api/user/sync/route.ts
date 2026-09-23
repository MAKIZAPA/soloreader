import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getUserSyncData, saveUserSyncData } from "@/lib/db";

export const dynamic = "force-dynamic";

function getAuthenticatedUserId(req: NextRequest): string | null {
  const token = req.cookies.get("manga_session")?.value;
  if (!token) return null;
  const session = verifySessionToken(token);
  return session?.userId || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await getUserSyncData(userId);
    return NextResponse.json({
      success: true,
      data: data || {
        library: {},
        history: [],
        stats: {},
        updatedAt: null,
      },
    });
  } catch (error) {
    console.error("[Sync GET] Error:", error);
    return NextResponse.json(
      { error: "Error al recuperar los datos de sincronización." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { library, history, stats } = body || {};

    const saved = await saveUserSyncData(userId, {
      library: library && typeof library === "object" ? library : undefined,
      history: Array.isArray(history) ? history : undefined,
      stats: stats && typeof stats === "object" ? stats : undefined,
    });

    return NextResponse.json({
      success: true,
      data: saved,
      message: "Datos sincronizados correctamente en la nube.",
    });
  } catch (error) {
    console.error("[Sync POST] Error:", error);
    return NextResponse.json(
      { error: "Error al guardar la sincronización en la nube." },
      { status: 500 }
    );
  }
}
