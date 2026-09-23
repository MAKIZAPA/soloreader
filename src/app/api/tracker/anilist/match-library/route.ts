import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

// Dictionary of known Spanish scanlation titles to their official AniList search queries
const SPANISH_TO_ANILIST_MAP: Record<string, string> = {
  "lider kim": "Manager Kim",
  "el lider kim": "Manager Kim",
  "el hijo menor del maestro de la espada": "The Swordmaster's Son",
  "hijo menor del maestro de la espada": "The Swordmaster's Son",
  "el regreso del sabueso con el collar de hierro": "Revenge of the Baskerville Bloodhound",
  "sabueso de los baskerville": "Revenge of the Baskerville Bloodhound",
  "el sabueso con el collar de hierro": "Revenge of the Baskerville Bloodhound",
  "principiante que lo devora todo": "The Boundless Necromancer",
  "como vivir como un villano": "How to Live as a Villain",
  "el principio despues del fin": "The Beginning After the End",
  "el comienzo despues del final": "The Beginning After the End",
  "solo leveling": "Solo Leveling",
  "yo subo de nivel solo": "Solo Leveling",
  "lector omnisciente": "Omniscient Reader's Viewpoint",
  "punto de vista del lector omnisciente": "Omniscient Reader's Viewpoint",
  "la vida despues de la muerte": "The Beginning After the End",
  "el mercenario adolescente": "Mercenary Enrollment",
  "mercenario adolescente": "Mercenary Enrollment",
  "nano maquina": "Nano Machine",
  "nanomaquinas": "Nano Machine",
  "jugador que regreso despues de 10000 anos": "Player Who Returned 10,000 Years Later",
  "el renacimiento del clan huashan": "Return of the Mount Hua Sect",
  "monte hua": "Return of the Mount Hua Sect",
  "la magia de un retornado": "A Returner's Magic Should Be Special",
  "cazador suicida de rango sss": "SSS-Class Suicide Hunter",
  "el juego del demonio celestial": "Chronicles of Heavenly Demon",
  "maldito renacimiento": "Damn Reincarnation",
  "el nigromante del clan de la catastrofe": "Catastrophic Necromancer",
  "nivelacion con los dioses": "Leveling With the Gods",
  "el herrero celestial": "Overgeared",
  "la reencarnacion del dios marcial": "Martial God Regressed to Level 2",
  "espadachin magico que volvio en el tiempo": "The Reincarnated Assassin is a Genius Swordsman",
  "segunda vida de ranker": "Second Life Ranker",
  "el regreso del heroe de rango sss": "The Max Level Hero has Returned!",
  "el regreso del heroe de clase desastre": "Return of the Disaster-Class Hero",
  "villano sin igual": "I Am the Fated Villain",
  "el arquero de acero": "Steel-Eating Player",
  "el tirador con armas de fuego del mundo magico": "I Became the Tyrant of a Defense Game",
  "las flipantes aventuras del rey de la espada": "Survival Story of a Sword King in a Fantasy World",
  "el rey de la espada": "Survival Story of a Sword King in a Fantasy World",
  "espada del viento": "Wind Sword",
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface MangaMatchRequest {
  libraryId: string;
  title: string;
  currentChapter?: string;
  status?: string;
}

const SEARCH_QUERY = `
query ($search: String) {
  Page(perPage: 3) {
    media(search: $search, type: MANGA) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        medium
        large
      }
      chapters
      status
      siteUrl
    }
  }
}
`;

async function searchAniList(searchQuery: string) {
  try {
    const res = await fetch(ANILIST_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search: searchQuery },
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.Page?.media || [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: MangaMatchRequest[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const matches = [];

    // Match each item sequentially to avoid blasting AniList rate limits
    for (const item of items) {
      const originalTitle = (item.title || "").trim();
      const norm = normalizeString(originalTitle);

      // Check dictionary first
      const mappedQuery = SPANISH_TO_ANILIST_MAP[norm] || originalTitle;

      let results = await searchAniList(mappedQuery);

      // If mappedQuery didn't return results, try original title
      if (results.length === 0 && mappedQuery !== originalTitle) {
        results = await searchAniList(originalTitle);
      }

      // If still empty, clean Spanish stop words
      if (results.length === 0) {
        const cleaned = norm
          .replace(/\b(el|la|los|las|un|una|de|del|en|regreso|retorno)\b/g, "")
          .trim();
        if (cleaned.length >= 3) {
          results = await searchAniList(cleaned);
        }
      }

      if (results.length > 0) {
        const best = results[0];
        const num = parseFloat(item.currentChapter || "0") || 0;

        matches.push({
          libraryId: item.libraryId,
          originalTitle,
          matched: true,
          mediaId: best.id,
          romajiTitle: best.title?.romaji || "",
          englishTitle: best.title?.english || best.title?.romaji || "",
          nativeTitle: best.title?.native || "",
          coverUrl: best.coverImage?.medium || best.coverImage?.large || "",
          totalChapters: best.chapters,
          progress: Math.floor(num),
          status: item.status === "completed" ? "COMPLETED" : "CURRENT",
          siteUrl: best.siteUrl,
        });
      } else {
        matches.push({
          libraryId: item.libraryId,
          originalTitle,
          matched: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error("[Match Library API] Error:", error);
    return NextResponse.json(
      { error: "Error al emparejar la biblioteca con AniList." },
      { status: 500 }
    );
  }
}
