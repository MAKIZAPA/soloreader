import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function optimizeCoverUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  // Ensure crisp, sharp high-definition covers (-lg.webp is 768w, ~25KB) avoiding both blurry -sm and bloated -xl
  if (rawUrl.includes("imagesolymp.xyz")) {
    return rawUrl.replace(/-(xl|sm)\.webp$/, "-lg.webp");
  }
  return rawUrl;
}

export function formatProxyUrl(rawUrl: string, referer?: string): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
    return rawUrl;
  }
  // Fast path: CDNs with open CORS and no anti-hotlink restrictions load directly in the browser
  if (rawUrl.includes("imagesolymp.xyz") || rawUrl.includes("uploads.mangadex.org")) {
    return rawUrl;
  }

  const params = new URLSearchParams();
  params.set("url", rawUrl);
  if (referer) {
    params.set("referer", referer);
  }
  return `/api/proxy?${params.toString()}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}
