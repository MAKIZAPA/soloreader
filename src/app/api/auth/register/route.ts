import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername, createUser } from "@/lib/db";
import { hashPassword, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: "El nombre de usuario debe tener entre 3 y 30 caracteres." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return NextResponse.json(
        { error: "El nombre de usuario solo puede contener letras, números, guiones y puntos." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: "Este nombre de usuario ya está registrado." },
        { status: 409 }
      );
    }

    const { hash, salt } = hashPassword(password);
    const user = await createUser(username, hash, salt);

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
    console.error("[Register] Error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al registrar la cuenta." },
      { status: 500 }
    );
  }
}
