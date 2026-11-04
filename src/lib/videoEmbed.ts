import { ensureYouTubeEmbedParams } from "@/lib/youtubeEmbed";

export const isYouTubeUrl = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");

export const isGoogleDriveVideoUrl = (url: string) => url.includes("drive.google.com");

/** Convierte enlaces de YouTube o Google Drive a su formato embebible; el resto se usa tal cual. */
export function convertVideoUrlToEmbed(url: string): string {
  if (!url) return url;

  try {
    if (url.includes("drive.google.com")) {
      let fileId = "";

      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch?.[1]) {
        fileId = fileMatch[1];
      } else if (url.includes("id=")) {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch?.[1]) {
          fileId = idMatch[1];
        }
      } else if (url.includes("/folders/")) {
        return url;
      }

      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }

      return url;
    }

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      if (url.includes("youtube.com/embed/")) {
        return url;
      }

      const urlObj = new URL(url);
      let videoId = "";

      if (urlObj.hostname.includes("youtube.com") && urlObj.searchParams.has("v")) {
        videoId = urlObj.searchParams.get("v") || "";
      } else if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.replace("/", "").split("?")[0];
      } else if (urlObj.pathname.includes("/embed/")) {
        return url;
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

export const toPlayableVideoUrl = (url: string) => ensureYouTubeEmbedParams(convertVideoUrlToEmbed(url));

/** iPhone / iPod / iPad (incl. Chrome “CriOS”, que usa WebKit; sin fullscreen API útil en iframes). */
export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iP(hone|od|ad)/i.test(ua)) return true;
  if (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1) return true;
  return false;
}
