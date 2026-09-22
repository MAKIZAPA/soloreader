import { describe, it, expect } from "vitest";
import { formatProxyUrl, truncateText, formatDate, cn } from "../src/lib/utils";

describe("Utility functions", () => {
  it("cn correctly merges classnames", () => {
    expect(cn("px-2", "py-1", "bg-black")).toBe("px-2 py-1 bg-black");
    expect(cn("px-2", false && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("formatProxyUrl generates valid proxy urls", () => {
    const raw = "https://media.imagesolymp.xyz/comics/test.webp";
    const res = formatProxyUrl(raw);
    expect(res).toContain("/api/proxy?url=");
    expect(res).toContain(encodeURIComponent(raw));

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
});
