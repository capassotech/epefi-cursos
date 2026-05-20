/** Modo privacidad; requiere “Permitir inserción” en YouTube Studio. */
const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/** Parámetros de reproductor embebido minimalista (sin fs=0: puede dejar el player en negro). */
const YOUTUBE_EMBED_QUERY: Record<string, string> = {
  rel: "0",
  modestbranding: "1",
  controls: "1",
  iv_load_policy: "3",
  playsinline: "1",
};

export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be|youtube-nocookie\.com/i.test(url);
}

/** Extrae el ID de video desde watch, youtu.be, embed o shorts. */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || !isYouTubeUrl(url)) return null;

  try {
    const parsed = new URL(url, "https://www.youtube.com");
    const host = parsed.hostname.replace(/^www\./i, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }

    if (host.includes("youtube.com") || host === "youtube-nocookie.com") {
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?&]+)/);
      if (embedMatch?.[1]) return embedMatch[1];

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?&]+)/);
      if (shortsMatch?.[1]) return shortsMatch[1];

      const v = parsed.searchParams.get("v");
      if (v) return v;
    }
  } catch {
    /* fallback regex abajo */
  }

  const fallback = url.match(
    /(?:embed\/|shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return fallback?.[1] ?? null;
}

export function buildYouTubeEmbedUrl(
  videoId: string,
  pageOrigin?: string
): string {
  const embed = new URL(`${YOUTUBE_EMBED_ORIGIN}/embed/${videoId}`);
  for (const [key, value] of Object.entries(YOUTUBE_EMBED_QUERY)) {
    embed.searchParams.set(key, value);
  }
  const origin =
    pageOrigin ??
    (typeof window !== "undefined" ? window.location.origin : undefined);
  if (origin) {
    embed.searchParams.set("origin", origin);
  }
  return embed.toString();
}

/**
 * Convierte cualquier URL de YouTube al embed nocookie con parámetros minimalistas.
 * Si no es YouTube, devuelve la URL sin cambios.
 */
export function toYouTubeEmbedUrl(url: string): string {
  if (!url || !isYouTubeUrl(url)) return url;
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return url;
  return buildYouTubeEmbedUrl(videoId);
}

/** @deprecated Usar {@link toYouTubeEmbedUrl}; se mantiene por compatibilidad. */
export function ensureYouTubeEmbedParams(url: string): string {
  return toYouTubeEmbedUrl(url);
}
