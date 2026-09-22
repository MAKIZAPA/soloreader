import { NextRequest, NextResponse } from "next/server";
import { parseMihonBackupBuffer } from "@/lib/backup/mihon";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de backup." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = parseMihonBackupBuffer(buffer, file.name);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      result,
    });
  } catch (error: unknown) {
    console.error("Error parsing Mihon backup:", error);
    const details = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error:
          "Error al procesar el archivo de backup. Asegúrate de subir un archivo .tachibk, .proto.gz o .json válido.",
        details,
      },
      { status: 500 }
    );
  }
}
