import { describe, it, expect } from "vitest";
import { formatProxyUrl, optimizeCoverUrl, truncateText, formatDate, formatDuration, cn } from "../src/lib/utils";

describe("Utility functions", () => {
  it("cn correctly merges classnames", () => {
    expect(cn("px-2", "py-1", "bg-black")).toBe("px-2 py-1 bg-black");
    expect(cn("px-2", false && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("optimizeCoverUrl replaces large dimensions with lightweight versions", () => {
    const raw = "https://media.imagesolymp.xyz/comics/covers/743/sabueso-venganza-xl.webp";
    expect(optimizeCoverUrl(raw)).toBe(
      "https://media.imagesolymp.xyz/comics/covers/743/sabueso-venganza-lg.webp"
    );
  });

  it("formatProxyUrl routes external images through proxy and preserves data/blob URLs", () => {
    // External images route through proxy to bypass CORS, hotlinking, and ISP blocks
    const cdnUrl = "https://media.imagesolymp.xyz/comics/test.webp";
    expect(formatProxyUrl(cdnUrl)).toContain("/api/proxy?url=");

    const protectedUrl = "https://dragontranslation.org/wp-content/uploads/test.jpg";
    const res = formatProxyUrl(protectedUrl);
    expect(res).toContain("/api/proxy?url=");
    expect(res).toContain(encodeURIComponent(protectedUrl));

    // Data and blob urls should pass through untouched
    expect(formatProxyUrl("blob:http://localhost/123")).toBe("blob:http://localhost/123");
    expect(formatProxyUrl("data:image/png;base64,...")).toBe("data:image/png;base64,...");
  });

  it("truncateText truncates text over maximum length", () => {
    expect(truncateText("Hello world", 5)).toBe("Hello...");
    expect(truncateText("Short", 10)).toBe("Short");
  });

  it("formatDate parses dates safely", () => {
    const formatted = formatDate("2026-09-20T14:05:10.000000Z");
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe("string");
  });

  it("formatDuration formats seconds into human-readable strings", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(150)).toBe("2m 30s");
    expect(formatDuration(3665)).toBe("1h 1m");
  });
});
