import { describe, it, expect } from "vitest";
import { formatProxyUrl, optimizeCoverUrl, truncateText, formatDate, cn } from "../src/lib/utils";

describe("Utility functions", () => {
  it("cn correctly merges classnames", () => {
    expect(cn("px-2", "py-1", "bg-black")).toBe("px-2 py-1 bg-black");
    expect(cn("px-2", false && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("optimizeCoverUrl replaces large dimensions with lightweight versions", () => {
    const raw = "https://media.imagesolymp.xyz/comics/covers/743/sabueso-venganza-lg.webp";
    expect(optimizeCoverUrl(raw)).toBe(
      "https://media.imagesolymp.xyz/comics/covers/743/sabueso-venganza-sm.webp"
    );
  });

  it("formatProxyUrl handles direct CDNs and proxied hosts properly", () => {
    // Open CDN host passes through directly to avoid proxy bottleneck
    const cdnUrl = "https://media.imagesolymp.xyz/comics/test.webp";
    expect(formatProxyUrl(cdnUrl)).toBe(cdnUrl);

    // Host requiring referer and anti-hotlink bypass routes through /api/proxy
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
});
