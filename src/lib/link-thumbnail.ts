/**
 * Automatic preview image for a work-sample link.
 *
 * YouTube is a fixed URL pattern; Vimeo needs its public oEmbed endpoint; anything
 * else falls back to the page's own og:image. Every lookup has a short timeout and
 * is cached for a day by Next's fetch cache, and any failure returns undefined so a
 * slow or blocked site just means a card without a picture, never a broken page.
 */
const TIMEOUT_MS = 3000;
const DAY = 60 * 60 * 24;

/** Links are member-typed, so never let the server be pointed at itself or its network. */
function isPublicWebUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return false;
    // Bare IPs (v4 or v6) are never a real portfolio site.
    return !/^[\d.]+$/.test(h) && !h.includes(":");
  } catch {
    return false;
  }
}

async function get(url: string, init?: RequestInit): Promise<Response | null> {
  if (!isPublicWebUrl(url)) return null;
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: DAY },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

function youTubeThumbnail(link: string): string | undefined {
  const m = link.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : undefined;
}

async function vimeoThumbnail(link: string): Promise<string | undefined> {
  const res = await get(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(link)}&width=640`);
  const data = (await res?.json().catch(() => null)) as { thumbnail_url?: string } | null;
  return data?.thumbnail_url;
}

async function ogImage(link: string): Promise<string | undefined> {
  const res = await get(link, { headers: { "user-agent": "Mozilla/5.0 (compatible; PCCBot/1.0)" } });
  if (!res || !(res.headers.get("content-type") ?? "").includes("html")) return undefined;
  const html = (await res.text()).slice(0, 200_000);
  const tag = html.match(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*>/i)?.[0];
  const src = tag?.match(/content=["']([^"']+)["']/i)?.[1];
  if (!src) return undefined;
  try {
    const abs = new URL(src.replace(/&amp;/g, "&"), link);
    return abs.protocol === "https:" || abs.protocol === "http:" ? abs.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function linkThumbnail(link: string | undefined): Promise<string | undefined> {
  if (!link) return undefined;
  const yt = youTubeThumbnail(link);
  if (yt) return yt;
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    if (host === "vimeo.com" || host === "player.vimeo.com") return await vimeoThumbnail(link);
  } catch {
    return undefined;
  }
  return ogImage(link);
}
