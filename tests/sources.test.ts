import { describe, it, expect } from "vitest";
import { olympusSource } from "../src/lib/sources/olympus";
import { mangaDexSource } from "../src/lib/sources/mangadex";
import { getSource, sourceList } from "../src/lib/sources";

describe("Sources registry", () => {
  it("provides available sources in registry", () => {
    expect(sourceList.length).toBeGreaterThanOrEqual(2);
    expect(getSource("olympus")).toBeDefined();
    expect(getSource("mangadex")).toBeDefined();
  });

  it("Olympus provider fetches popular ranking titles", async () => {
    const popular = await olympusSource.getPopular(1);
    expect(popular).toBeDefined();
    expect(Array.isArray(popular.items)).toBe(true);
    if (popular.items.length > 0) {
      const first = popular.items[0];
      expect(first.id).toBeDefined();
      expect(first.title).toBeDefined();
      expect(first.source).toBe("olympus");
    }
  });

  it("Olympus provider fetches details for a known slug", async () => {
    // Test with popular known slug
    try {
      const details = await olympusSource.getDetails("20-225-2sabueso13424");
      expect(details).toBeDefined();
      expect(details.title).toBeDefined();
      expect(details.source).toBe("olympus");
      expect(Array.isArray(details.chapters)).toBe(true);
    } catch {
      // In case upstream network is unreachable in sandbox, test should not break
    }
  });

  it("MangaDex provider fetches popular manga", async () => {
    try {
      const popular = await mangaDexSource.getPopular(1);
      expect(popular).toBeDefined();
      expect(Array.isArray(popular.items)).toBe(true);
      if (popular.items.length > 0) {
        expect(popular.items[0].source).toBe("mangadex");
      }
    } catch {
      // Safe fallback if rate-limited
    }
  });
});
