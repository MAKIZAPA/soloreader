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
});
