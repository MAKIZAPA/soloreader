import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Sesión cerrada correctamente." });
  response.cookies.set({
    name: "manga_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
