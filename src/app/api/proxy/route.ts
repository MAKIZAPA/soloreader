import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CacheEntry {
  buffer: ArrayBuffer;
  contentType: string;
  timestamp: number;
}

// In-memory cache for fast repeat requests and pre-fetching
const imageCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 250;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Check in-memory cache
  const cached = imageCache.get(targetUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const headers = new Headers();
    headers.set("Content-Type", cached.contentType);
    headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-Proxy-Cache", "HIT");
    return new NextResponse(cached.buffer, {
      status: 200,
      headers,
    });
  }

  try {
    const parsedTarget = new URL(targetUrl);

    // Default referer fallback based on host
    let referer = searchParams.get("referer");
    if (!referer) {
      if (parsedTarget.hostname.includes("imagesolymp") || parsedTarget.hostname.includes("olympus")) {
        referer = "https://olympusbiblioteca.com/";
      } else if (parsedTarget.hostname.includes("dragontranslation")) {
        referer = "https://dragontranslation.org/";
      } else if (parsedTarget.hostname.includes("mangadex")) {
        referer = "https://mangadex.org/";
      } else {
        referer = `${parsedTarget.protocol}//${parsedTarget.host}/`;
      }
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Referer": referer,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch upstream image: ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    // Store in RAM cache
    if (imageCache.size >= MAX_CACHE_ENTRIES) {
      // Remove oldest entry
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }
    imageCache.set(targetUrl, {
      buffer: arrayBuffer,
      contentType,
      timestamp: Date.now(),
    });

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-Proxy-Cache", "MISS");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    return new NextResponse(`Proxy error: ${error instanceof Error ? error.message : "Unknown"}`, {
      status: 500,
    });
  }
}
