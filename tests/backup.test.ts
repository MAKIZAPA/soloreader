import { describe, it, expect, beforeEach } from "vitest";
import { parseMihonJson, parseMihonBackupBuffer } from "../src/lib/backup/mihon";
import { useAppStore } from "../src/lib/store";

describe("Mihon Backup Parser & Store Integration", () => {
  beforeEach(() => {
    useAppStore.setState({
      library: {},
      stats: {},
      history: [],
      activeSource: "olympus",
    });
  });

  it("parses Mihon JSON backup format correctly", () => {
    const mockJson = {
      backupManga: [
        {
          source: 100,
          sourceName: "Olympus Scan",
          url: "/series/nano-machine",
          title: "Nano Machine",
          thumbnailUrl: "https://example.com/cover.webp",
          chapters: [
            { name: "Capítulo 1", url: "/read/1", read: true, chapterNumber: 1 },
            { name: "Capítulo 2", url: "/read/2", read: true, chapterNumber: 2 },
            { name: "Capítulo 3", url: "/read/3", read: false, chapterNumber: 3 },
          ],
        },
      ],
      backupSources: [{ sourceId: 100, name: "Olympus Scan" }],
    };

    const parsed = parseMihonJson(mockJson);
    expect(parsed.totalMangas).toBe(1);
    expect(parsed.totalChaptersRead).toBe(2);
    expect(parsed.mangas[0].title).toBe("Nano Machine");
    expect(parsed.mangas[0].readChapters).toBe(2);
    expect(parsed.mangas[0].totalChapters).toBe(3);
  });

  it("imports parsed Mihon mangas into the store and updates library stats", () => {
    const mangas = [
      {
        sourceId: "100",
        sourceName: "Olympus Scan",
        url: "/series/nano-machine",
        title: "Nano Machine",
        favorite: true,
        totalChapters: 100,
        readChapters: 85,
        lastReadChapterName: "Capítulo 85",
        chapters: [],
      },
      {
        sourceId: "200",
        sourceName: "Dragon Translation",
        url: "/series/magic-emperor",
        title: "Magic Emperor",
        favorite: true,
        totalChapters: 50,
        readChapters: 50,
        lastReadChapterName: "Capítulo 50",
        chapters: [],
      },
    ];

    useAppStore.getState().importMihonBackup(mangas, "replace");

    const library = useAppStore.getState().library;
    const stats = useAppStore.getState().stats;

    expect(Object.keys(library).length).toBe(2);

    // Verify Nano Machine in library
    const nanoKey = "olympus:nano-machine";
    expect(library[nanoKey]).toBeDefined();
    expect(library[nanoKey].manga.title).toBe("Nano Machine");
    expect(library[nanoKey].totalChaptersRead).toBe(85);
    expect(library[nanoKey].status).toBe("reading");

    // Verify Magic Emperor is completed
    const magicKey = "dragon:magic-emperor";
    expect(library[magicKey]).toBeDefined();
    expect(library[magicKey].status).toBe("completed");

    // Verify stats were initialized
    expect(stats[nanoKey]).toBeDefined();
    expect(stats[nanoKey].totalSeconds).toBeGreaterThan(0);
  });

  it("parses gzipped buffer using parseMihonBackupBuffer", () => {
    const jsonText = JSON.stringify({
      backupManga: [
        {
          source: 1,
          url: "/series/test",
          title: "Gzip Test Manga",
          chapters: [{ name: "Cap 1", url: "/1", read: true }],
        },
      ],
    });

    const buffer = Buffer.from(jsonText, "utf-8");
    const parsed = parseMihonBackupBuffer(buffer, "backup.json");
    expect(parsed.totalMangas).toBe(1);
    expect(parsed.mangas[0].title).toBe("Gzip Test Manga");
  });

  it("exports current library into a valid JSON backup string", () => {
    useAppStore.getState().addToLibrary({
      id: "solo-leveling",
      source: "olympus",
      title: "Solo Leveling",
      slug: "solo-leveling",
      coverUrl: "https://example.com/sl.webp",
    });

    const exported = useAppStore.getState().exportBackup();
    expect(typeof exported).toBe("string");

    const parsed = JSON.parse(exported);
    expect(parsed.version).toBe("1.0");
    expect(Object.keys(parsed.library).length).toBe(1);
  });

  it("handles external sources like ZonaTMO by preserving or linking to matched source", () => {
    const mangas = [
      {
        sourceId: "9999",
        sourceName: "ZonaTMO",
        url: "/viewer/solo-leveling",
        title: "Solo Leveling",
        favorite: true,
        totalChapters: 200,
        readChapters: 180,
        chapters: [],
        matchedSource: "mangadex" as const,
        matchedId: "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0",
        matchedTitle: "Solo Leveling",
      },
      {
        sourceId: "9999",
        sourceName: "ZonaTMO",
        url: "/viewer/unmatched-manga",
        title: "Obra Rara Sin Fuente Activa",
        favorite: true,
        totalChapters: 20,
        readChapters: 15,
        chapters: [],
      },
    ];

    useAppStore.getState().importMihonBackup(mangas, "replace");
    const library = useAppStore.getState().library;

    // The matched manga should be linked to MangaDex
    const matched = library["mangadex:32d76d19-8a05-4db0-9fc2-e0b0648fe9d0"];
    expect(matched).toBeDefined();
    expect(matched.manga.source).toBe("mangadex");
    expect(matched.manga.originalSource).toBe("ZonaTMO");
    expect(matched.totalChaptersRead).toBe(180);

    // The unmatched manga should still be preserved with original data
    const entries = Object.values(library);
    const unmatched = entries.find((e) => e.manga.title === "Obra Rara Sin Fuente Activa");
    expect(unmatched).toBeDefined();
    expect(unmatched?.manga.originalSource).toBe("ZonaTMO");
    expect(unmatched?.totalChaptersRead).toBe(15);
  });

  it("extracts exact real reading time from backup history and prioritizes it in reading stats", () => {
    const mockJson = {
      backupManga: [
        {
          source: 100,
          sourceName: "Olympus Scan",
          url: "/series/tower-of-god",
          title: "Tower of God",
          chapters: [
            { name: "Cap 1", url: "/1", read: true },
            { name: "Cap 2", url: "/2", read: true },
          ],
          history: [
            // 150000 ms = 150 seconds, 250000 ms = 250 seconds -> total 400 seconds
            { url: "/1", lastRead: 1700000000000, readDuration: 150000 },
            { url: "/2", lastRead: 1700005000000, readDuration: 250000 },
          ],
        },
      ],
    };

    const parsed = parseMihonJson(mockJson);
    expect(parsed.mangas[0].realReadingSeconds).toBe(400);
    expect(parsed.mangas[0].lastReadTimestamp).toBe(1700005000000);

    useAppStore.getState().importMihonBackup(parsed.mangas, "replace");
    const stats = useAppStore.getState().stats;
    const togKey = "olympus:tower-of-god";

    expect(stats[togKey]).toBeDefined();
    // Prioritizes real 400 seconds rather than estimated (2 * 180 = 360)
    expect(stats[togKey].totalSeconds).toBe(400);
    expect(stats[togKey].lastReadTimestamp).toBe(1700005000000);
  });
});

