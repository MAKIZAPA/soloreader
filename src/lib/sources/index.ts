import { SourceId, SourceProvider } from "@/types";
import { olympusSource } from "./olympus";
import { dragonSource } from "./dragon";
import { mangaDexSource } from "./mangadex";

export const sources: Record<Exclude<SourceId, "local" | "external">, SourceProvider> = {
  olympus: olympusSource,
  dragon: dragonSource,
  mangadex: mangaDexSource,
};

export function getSource(id: SourceId): SourceProvider {
  if (id === "olympus") return olympusSource;
  if (id === "dragon") return dragonSource;
  if (id === "mangadex") return mangaDexSource;
  return olympusSource;
}

export const sourceList: { id: SourceId; name: string; description: string; lang: string }[] = [
  {
    id: "olympus",
    name: "Olympus Scan",
    description: "Scanlation en español especializado en Manhwa, Manhua y Manga con alta resolución.",
    lang: "Español",
  },
  {
    id: "dragon",
    name: "Dragon Translation",
    description: "Scanlation en español especializado en Manhwa, Webtoon y series de acción/romance.",
    lang: "Español",
  },
  {
    id: "mangadex",
    name: "MangaDex",
    description: "Plataforma comunitaria global sin anuncios y con API abierta para múltiples idiomas.",
    lang: "Español / Inglés",
  },
];
