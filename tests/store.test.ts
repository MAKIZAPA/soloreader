import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../src/lib/store";

describe("App Store (Zustand)", () => {
  beforeEach(() => {
    useAppStore.setState({
      library: {},
      history: [],
      activeSource: "olympus",
    });
  });

  it("adds and removes items from library", () => {
    const mockManga = {
      id: "solo-leveling",
      source: "olympus" as const,
      title: "Solo Leveling",
      slug: "solo-leveling",
      coverUrl: "https://example.com/cover.webp",
    };

    useAppStore.getState().addToLibrary(mockManga, "reading");
    expect(useAppStore.getState().isInLibrary("solo-leveling")).toBe(true);

    useAppStore.getState().removeFromLibrary("solo-leveling");
    expect(useAppStore.getState().isInLibrary("solo-leveling")).toBe(false);
  });

  it("records history entries and prevents duplicate chapters", () => {
    useAppStore.getState().recordHistory({
      mangaId: "manga-1",
      source: "olympus",
      mangaTitle: "Test Manga",
      mangaCover: "https://example.com/c.webp",
      chapterId: "ch-10",
      chapterNumber: "10",
      page: 5,
      totalPages: 20,
    });

    let history = useAppStore.getState().history;
    expect(history.length).toBe(1);
    expect(history[0].chapterNumber).toBe("10");

    // Add again with updated page
    useAppStore.getState().recordHistory({
      mangaId: "manga-1",
      source: "olympus",
      mangaTitle: "Test Manga",
      mangaCover: "https://example.com/c.webp",
      chapterId: "ch-10",
      chapterNumber: "10",
      page: 12,
      totalPages: 20,
    });

    history = useAppStore.getState().history;
    expect(history.length).toBe(1);
    expect(history[0].page).toBe(12);
  });

  it("updates reader settings correctly", () => {
    useAppStore.getState().updateReaderSettings({ mode: "single", zoom: 120 });
    const settings = useAppStore.getState().readerSettings;
    expect(settings.mode).toBe("single");
    expect(settings.zoom).toBe(120);
  });

  it("records reading time and accumulates statistics per manga", () => {
    const store = useAppStore.getState();
    store.clearStats();

    // First session: 120 seconds
    store.recordReadingTime("solo-leveling", "olympus", "Solo Leveling", "https://example.com/cover.webp", 120);
    let stats = useAppStore.getState().stats;
    const entry = stats["olympus:solo-leveling"];
    expect(entry).toBeDefined();
    expect(entry.totalSeconds).toBe(120);
    expect(entry.sessionsCount).toBe(1);

    // Second session: 300 seconds
    useAppStore.getState().recordReadingTime("solo-leveling", "olympus", "Solo Leveling", "https://example.com/cover.webp", 300);
    stats = useAppStore.getState().stats;
    expect(stats["olympus:solo-leveling"].totalSeconds).toBe(420);
    expect(stats["olympus:solo-leveling"].sessionsCount).toBe(2);

    // Different manga
    useAppStore.getState().recordReadingTime("magic-emperor", "dragon", "Magic Emperor", "https://example.com/cover2.webp", 60);
    stats = useAppStore.getState().stats;
    expect(Object.keys(stats).length).toBe(2);
    expect(stats["dragon:magic-emperor"].totalSeconds).toBe(60);

    // Clear stats
    useAppStore.getState().clearStats();
    expect(Object.keys(useAppStore.getState().stats).length).toBe(0);
  });
});
