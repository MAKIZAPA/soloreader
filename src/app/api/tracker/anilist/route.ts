import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

const USER_MANGA_QUERY = `
query ($username: String) {
  MediaListCollection(userName: $username, type: MANGA) {
    lists {
      name
      status
      entries {
        id
        status
        progress
        score
        updatedAt
        media {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          chapters
          status
          siteUrl
        }
      }
    }
  }
}
`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: "El nombre de usuario de AniList es requerido." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(ANILIST_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        query: USER_MANGA_QUERY,
        variables: { username },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: `Usuario "${username}" no encontrado en AniList.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Error en AniList API (HTTP ${res.status}).` },
        { status: res.status }
      );
    }

    const data = await res.json();
    if (data.errors && data.errors.length > 0) {
      return NextResponse.json(
        { error: data.errors[0]?.message || "Error al consultar AniList." },
        { status: 400 }
      );
    }

    const collection = data?.data?.MediaListCollection?.lists || [];
    return NextResponse.json({
      success: true,
      username,
      lists: collection,
    });
  } catch (error) {
    console.error("[AniList API] Error:", error);
    return NextResponse.json(
      { error: "No se pudo conectar con el servicio de AniList." },
      { status: 500 }
    );
  }
}
