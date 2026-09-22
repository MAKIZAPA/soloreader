import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const parsedTarget = new URL(targetUrl);

    // Default referer fallback based on host
    let referer = searchParams.get("referer");
    if (!referer) {
      if (parsedTarget.hostname.includes("imagesolymp") || parsedTarget.hostname.includes("olympus")) {
        referer = "https://olympusbiblioteca.com/";
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
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch upstream image: ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400, immutable");
    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return new NextResponse(`Proxy error: ${error instanceof Error ? error.message : "Unknown"}`, {
      status: 500,
    });
  }
}
