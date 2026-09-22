import { SourceId, SourceProvider } from "@/types";
import { olympusSource } from "./olympus";
import { mangaDexSource } from "./mangadex";

export const sources: Record<Exclude<SourceId, "local">, SourceProvider> = {
  olympus: olympusSource,
  mangadex: mangaDexSource,
};

export function getSource(id: SourceId): SourceProvider {
  if (id === "olympus") return olympusSource;
  if (id === "mangadex") return mangaDexSource;
  // default to olympus
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
    id: "mangadex",
    name: "MangaDex",
    description: "Plataforma comunitaria global sin anuncios y con API abierta para múltiples idiomas.",
    lang: "Español / Inglés",
  },
];
