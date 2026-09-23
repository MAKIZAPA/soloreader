import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { findUserById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("manga_session")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[Auth /me] Error:", error);
    return NextResponse.json({ authenticated: false });
  }
}
