/**
 * En iOS Safari, los iframes de YouTube suelen necesitar el parámetro `playsinline=1`
 * para reproducir dentro de la página; sin él el reproductor puede quedarse en el
 * spinner de carga al estar embebido (comportamiento distinto al escritorio).
 */
export function ensureYouTubeEmbedParams(url: string): string {
  if (!url || !url.includes("youtube.com/embed/")) {
    return url;
  }
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("youtube.com")) {
      return url;
    }
    u.searchParams.set("playsinline", "1");
    return u.toString();
  } catch {
    return url;
  }
}
