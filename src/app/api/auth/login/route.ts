import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/db";
import { verifyPassword, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Por favor proporciona usuario y contraseña." },
        { status: 400 }
      );
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas. Verifica tu usuario o contraseña." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas. Verifica tu usuario o contraseña." },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });

    response.cookies.set({
      name: "manga_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("[Login] Error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al iniciar sesión." },
      { status: 500 }
    );
  }
}
