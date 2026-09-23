import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

// Dictionary of known Spanish scanlation titles to their official AniList search queries
const SPANISH_TO_ANILIST_MAP: Record<string, string> = {
  // Top Popular Manhwas & Scan Translations
  "lider kim": "Manager Kim",
  "el lider kim": "Manager Kim",
  "el hijo menor del maestro de la espada": "The Swordmaster's Son",
  "hijo menor del maestro de la espada": "The Swordmaster's Son",
  "el regreso del sabueso con el collar de hierro": "Revenge of the Baskerville Bloodhound",
  "sabueso de los baskerville": "Revenge of the Baskerville Bloodhound",
  "el sabueso con el collar de hierro": "Revenge of the Baskerville Bloodhound",
  "el regreso del perro de presa de los baskerville": "Revenge of the Baskerville Bloodhound",
  "el mejor disenador de fincas": "The Greatest Estate Developer",
  "el mejor desarrollador de bienes raices": "The Greatest Estate Developer",
  "el mayor desarrollador inmobiliario": "The Greatest Estate Developer",
  "disenador de fincas": "The Greatest Estate Developer",
  "principiante que lo devora todo": "Boundless Ascension",
  "novato que lo devora todo": "Boundless Ascension",
  "el novato invencible": "Boundless Ascension",
  "como vivir como un villano": "How to Live as a Villain",
  "el principio despues del fin": "The Beginning After the End",
  "el comienzo despues del final": "The Beginning After the End",
  "solo leveling": "Solo Leveling",
  "yo subo de nivel solo": "Solo Leveling",
  "solo leveling ragnarok": "Solo Leveling: Ragnarok",
  "lector omnisciente": "Omniscient Reader",
  "punto de vista del lector omnisciente": "Omniscient Reader",
  "mirada omnisciente del lector": "Omniscient Reader",
  "el mercenario adolescente": "Teenage Mercenary",
  "mercenario adolescente": "Teenage Mercenary",
  "nano maquina": "Nano Machine",
  "nanomaquinas": "Nano Machine",
  "jugador que regreso despues de 10000 anos": "Player Who Returned 10,000 Years Later",
  "el jugador que regreso despues de 10000 anos": "Player Who Returned 10,000 Years Later",
  "el renacimiento del clan huashan": "Return of the Mount Hua Sect",
  "el renacer de la secta huashan": "Return of the Mount Hua Sect",
  "monte hua": "Return of the Mount Hua Sect",
  "la secta del monte hua": "Return of the Mount Hua Sect",
  "retorno de la secta floreciente": "Return of the Mount Hua Sect",
  "la magia de un retornado": "A Returner's Magic Should Be Special",
  "un retorno magico debe ser especial": "A Returner's Magic Should Be Special",
  "cazador suicida de rango sss": "SSS-Class Revival Hunter",
  "cazador suicida de clase sss": "SSS-Class Revival Hunter",
  "el juego del demonio celestial": "Chronicles of Heavenly Demon",
  "maldito renacimiento": "Damn Reincarnation",
  "el nigromante del clan de la catastrofe": "Catastrophic Necromancer",
  "el nigromante de la catastrofe": "Catastrophic Necromancer",
  "nivelacion con los dioses": "Leveling With the Gods",
  "subiendo de nivel con los dioses": "Leveling With the Gods",
  "el herrero celestial": "Overgeared",
  "la reencarnacion del dios marcial": "Martial God Regressed to Level 2",
  "espadachin magico que volvio en el tiempo": "The Reincarnated Assassin is a Genius Swordsman",
  "segunda vida de ranker": "Second Life Ranker",
  "el regreso del heroe de rango sss": "The Max Level Hero has Returned!",
  "el heroe de nivel maximo ha regresado": "The Max Level Hero has Returned!",
  "el regreso del heroe de clase desastre": "Return of the Disaster-Class Hero",
  "heroe de clase desastre": "Return of the Disaster-Class Hero",
  "villano sin igual": "I Am the Fated Villain",
  "el arquero de acero": "Steel-Eating Player",
  "el jugador devorador de acero": "Steel-Eating Player",
  "el tirador con armas de fuego del mundo magico": "I Became the Tyrant of a Defense Game",
  "el tirano de un juego de defensa": "I Became the Tyrant of a Defense Game",
  "me volvi el tirano de un juego de defensa": "I Became the Tyrant of a Defense Game",
  "las flipantes aventuras del rey de la espada": "Survival Story of a Sword King in a Fantasy World",
  "el rey de la espada": "Survival Story of a Sword King in a Fantasy World",
  "espada del viento": "Wind Sword",
  "el jugador que no puede subir de nivel": "The Player Who Can't Level Up",
  "jugador que no puede subir de nivel": "The Player Who Can't Level Up",
  "el regreso del jugador congelado": "The Return of the Frozen Player",
  "el cazador congelado": "The Return of the Frozen Player",
  "el emperador magico": "Magic Emperor",
  "emperador magico": "Magic Emperor",
  "el rey de los ladrones de tumbas": "Tomb Raider King",
  "ladron de tumbas": "Tomb Raider King",
  "el demonio loco": "The Return of the Mad Demon",
  "el retorno del demonio loco": "The Return of the Mad Demon",
  "el archimago que regreso despues de 4000 anos": "The Great Mage Returns After 4000 Years",
  "el gran mago regresa despues de 4000 anos": "The Great Mage Returns After 4000 Years",
  "el mago infinito": "Infinite Mage",
  "mago infinito": "Infinite Mage",
  "murim login": "Murim Login",
  "pick me up": "Pick Me Up, Infinite Gacha",
  "pick me up infinito gacha": "Pick Me Up, Infinite Gacha",
  "gacha infinito": "Pick Me Up, Infinite Gacha",
  "noble perezoso": "Reformation of the Deadbeat Noble",
  "la reforma del noble perezoso": "Reformation of the Deadbeat Noble",
  "noble perezoso se convierte en un maestro de la espada": "Reformation of the Deadbeat Noble",
  "el hijo prodigo de la espada": "Reformation of the Deadbeat Noble",
  "estandar de reencarnacion": "Standard of Reincarnation",
  "el estandar de la reencarnacion": "Standard of Reincarnation",
  "dios de la batalla suicida": "Doom Breaker",
  "reencarnacion del dios de la batalla": "Doom Breaker",
  "la leyenda de la espada del norte": "Legend of the Northern Blade",
  "espada del norte": "Legend of the Northern Blade",
  "el medico de murim": "Doctor's Rebirth",
  "el renacimiento del doctor": "Doctor's Rebirth",
  "medico supremo": "Doctor's Rebirth",
  "el villano quiere vivir": "The Villain Wants to Live",
  "basura de la familia del conde": "Trash of the Count's Family",
  "el conde de la basura": "Trash of the Count's Family",
  "reencarne como la basura de la familia del conde": "Trash of the Count's Family",
  "demonio celestial no puede llevar una vida normal": "The Heavenly Demon Can't Live a Normal Life",
  "el demonio celestial no puede vivir una vida normal": "The Heavenly Demon Can't Live a Normal Life",
  "el cazador definitivo": "I Am The Sorcerer King",
  "el rey brujo": "I Am The Sorcerer King",
  "era sobrehumana": "Superhuman Era",
  "superhumano de la era moderna": "Superhuman Era",
  "el regreso de la lanza legendaria": "Return of the Unrivaled Spear Knight",
  "lanza legendaria": "Return of the Unrivaled Spear Knight",
  "la villana es una marioneta": "The Villainess is a Marionette",
  "la muerte es el unico final para la villana": "Villains Are Destined to Die",
  "quien me hizo una princesa": "Who Made Me a Princess",
  "princesa encantadora": "Who Made Me a Princess",
  "hija del emperador": "Daughter of the Emperor",
  "secret class": "Secret Class",
  "boarding diary": "Boarding Diary",
  "apice marcial": "Martial Peak",
  "pico marcial": "Martial Peak",
  "apoteosis": "Apotheosis",
  "cuentos de demonios y dioses": "Tales of Demons and Gods",
  "cuento de demonios y dioses": "Tales of Demons and Gods",
  "la espada celestial": "Heavenly Sword",
  "el asesino de la familia del conde": "The Reincarnated Assassin is a Genius Swordsman",
  "asesino reencarnado es un genio espadachin": "The Reincarnated Assassin is a Genius Swordsman",
  "el guerrero derrotado regresa": "Warrior High School - Dungeon Raid Department",
  "el nigromante solitario": "The Lone Necromancer",
  "nigromante solitario": "The Lone Necromancer",
  "jugador de la torre": "Tower of God",
  "torre de dios": "Tower of God",
  "wind breaker": "Wind Breaker",
  "lookism": "Lookism",
  "apariencias": "Lookism",
  "manual del regresor": "Regressor Instruction Manual",
  "manual de instrucciones del regresor": "Regressor Instruction Manual",
  "re monster": "Re:Monster",
  "el jugador que no puede morir": "The Player That Can't Die",
  "el rey demonio no puede morir": "Chronicles of Heavenly Demon",
  "la chica de abajo": "Doona!",
  "el despertar": "Eleceed",
  "eleceed": "Eleceed",
  "los diez mil anos en el infierno": "Player Who Returned 10,000 Years Later",
  "jugador que regreso del infierno": "Player Who Returned 10,000 Years Later",
  "el descendiente de la espada de la sombra": "Shadowless Sword",
  "el cazador de rango f se vuelve sss": "My S-Class Hunters",
  "mis cazadores clase s": "My S-Class Hunters",
  "cazadores clase s": "My S-Class Hunters",
  "el chico de la espada": "Sword Sheath's Child",
  "hijo de la vaina de la espada": "Sword Sheath's Child",
  "los cuatro grandes reyes celestiales": "Chronicles of the Martial God's Return",
  "retorno del dios marcial": "Chronicles of the Martial God's Return",
  "regresion de la luna oscura": "Dark Moon: The Blood Altar",
  "memorias del rey demonio": "Memoir of the King of War",
  "el rey de la guerra": "Memoir of the King of War",
  "el herrero magico": "Overgeared",
  "el maestro del veneno": "Poison Dragon: Legend of an Asura",
  "dragon de veneno": "Poison Dragon: Legend of an Asura",
  "el retorno del clan asura": "Legend of Asura - The Venom Dragon",
  "shangri la frontier": "Shangri-La Frontier",
  "mashle": "Mashle",
  "dandadan": "Dandadan",
  "jujutsu kaisen": "Jujutsu Kaisen",
  "chainsaw man": "Chainsaw Man",
  "hombre motosierra": "Chainsaw Man",
  "tokyo revengers": "Tokyo Revengers",
  "blue lock": "Blue Lock",
  "one piece": "One Piece",
  "black clover": "Black Clover",
  "my hero academia": "My Hero Academia",
  "spy x family": "Spy x Family",
  "berserk": "Berserk",
  "vinland saga": "Vinland Saga",
  "kingdom": "Kingdom",
  "vagabond": "Vagabond",
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

function cleanTitleForSearch(raw: string): string {
  return raw
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/-(?:\s*(?:manhwa|webtoon|manga|color|novela|espanol|scan|oficial|raw))\b/gi, " ")
    .replace(/\b(?:manhwa|webtoon|manga|color|novela|espanol|scan|oficial|raw)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface MangaMatchRequest {
  libraryId: string;
  title: string;
  currentChapter?: string;
  status?: string;
}

interface AniListMediaItem {
  id: number;
  title?: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  coverImage?: {
    medium?: string;
    large?: string;
  };
  chapters?: number | null;
  status?: string;
  siteUrl?: string;
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

async function searchAniList(searchQuery: string, attempt = 1): Promise<AniListMediaItem[]> {
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

    if (res.status === 429 && attempt <= 3) {
      const waitMs = 2500 * attempt;
      console.warn(`[AniList Match] Rate limited (429). Waiting ${waitMs}ms before retry ${attempt}...`);
      await new Promise((r) => setTimeout(r, waitMs));
      return searchAniList(searchQuery, attempt + 1);
    }

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

    // Match each item sequentially with rate-limit spacing
    for (const item of items) {
      const originalTitle = (item.title || "").trim();
      const cleaned = cleanTitleForSearch(originalTitle);
      const norm = normalizeString(cleaned);

      // 1. Check dictionary first
      const mappedQuery = SPANISH_TO_ANILIST_MAP[norm] || SPANISH_TO_ANILIST_MAP[normalizeString(originalTitle)];

      let results: AniListMediaItem[] = [];

      if (mappedQuery) {
        results = await searchAniList(mappedQuery);
      }

      // 2. If dictionary didn't yield results, search cleaned title
      if (results.length === 0 && cleaned.length >= 3) {
        results = await searchAniList(cleaned);
      }

      // 3. If cleaned failed, try original title
      if (results.length === 0 && originalTitle !== cleaned && originalTitle.length >= 3) {
        results = await searchAniList(originalTitle);
      }

      // 4. If still empty, clean Spanish stop words
      if (results.length === 0) {
        const wordsStripped = norm
          .replace(/\b(el|la|los|las|un|una|de|del|en|regreso|retorno|reencarnacion)\b/g, "")
          .trim();
        if (wordsStripped.length >= 3) {
          results = await searchAniList(wordsStripped);
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
          progress: Math.floor(parseFloat(item.currentChapter || "0") || 0),
        });
      }

      // Gentle pause to stay well within AniList 90 req/min limits
      await new Promise((r) => setTimeout(r, 120));
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
