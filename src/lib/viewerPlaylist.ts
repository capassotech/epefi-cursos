import { getModulesForMateria } from "@/lib/courseModules";
import type { Materia, Modulo } from "@/types/types";

export type PlaylistItemType = "document" | "video";

/** Un material del curso (documento o video) en el orden en que se muestra. */
export interface PlaylistItem {
  /** Misma clave que usa el progreso: `${moduloId}_${type}_${index}` */
  key: string;
  moduloId: string;
  type: PlaylistItemType;
  index: number;
  name: string;
  enabled: boolean;
}

export interface PlaylistGroup {
  moduloId: string;
  titulo: string;
  items: PlaylistItem[];
}

export const playlistKey = (moduloId: string, type: PlaylistItemType, index: number) =>
  `${moduloId}_${type}_${index}`;

/** Por debajo de este ancho la lista va debajo del material y los PDF se abren en otra pestaña */
export const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 768;

export const getDocumentUrl = (modulo: Modulo, index: number) =>
  getDocuments(modulo)[index]?.trim() ?? "";

/** Debe llamarse dentro del clic del usuario para que el navegador no bloquee la pestaña */
export const openDocumentInNewTab = (url: string) =>
  window.open(url.split("#")[0], "_blank", "noopener,noreferrer");

/** Segmento de la URL de la página de material para cada tipo */
const TYPE_SEGMENT: Record<PlaylistItemType, string> = { document: "documento", video: "video" };

export const parseTypeSegment = (segment?: string): PlaylistItemType | null =>
  segment === "documento" ? "document" : segment === "video" ? "video" : null;

export const materialPath = (
  courseId: string,
  moduloId: string,
  type: PlaylistItemType,
  index: number
) => `/curso/${courseId}/material/${moduloId}/${TYPE_SEGMENT[type]}/${index}`;

/** Último material abierto por el alumno en un curso (se guarda en el dispositivo) */
export interface LastViewed {
  moduloId: string;
  type: PlaylistItemType;
  index: number;
}

const lastViewedKey = (userId: string, courseId: string) => `epefi-last-viewed:${userId}:${courseId}`;

export function saveLastViewed(userId: string, courseId: string, item: LastViewed): void {
  try {
    window.localStorage.setItem(lastViewedKey(userId, courseId), JSON.stringify(item));
  } catch {
    // Sin almacenamiento disponible: se propondrá el primer material pendiente
  }
}

export function readLastViewed(userId: string, courseId: string): LastViewed | null {
  try {
    const raw = window.localStorage.getItem(lastViewedKey(userId, courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastViewed;
    return parsed?.moduloId && (parsed.type === "document" || parsed.type === "video")
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/**
 * Material para el botón "Continuar": el último abierto si sigue disponible;
 * si no, el primer pendiente (o el primero del curso).
 */
export function pickResumeItem(
  groups: PlaylistGroup[],
  last: LastViewed | null,
  isCompleted: (item: PlaylistItem) => boolean
): { item: PlaylistItem; group: PlaylistGroup; isLast: boolean } | null {
  const entries = groups.flatMap((group) => group.items.map((item) => ({ item, group })));
  const enabled = entries.filter(({ item }) => item.enabled);
  if (last) {
    const key = playlistKey(last.moduloId, last.type, last.index);
    const found = enabled.find(({ item }) => item.key === key);
    if (found) return { ...found, isLast: true };
  }
  const pending = enabled.find(({ item }) => !isCompleted(item)) ?? enabled[0];
  return pending ? { ...pending, isLast: false } : null;
}

/** Estado de la página del curso que se recupera al volver de un material */
export interface CourseViewState {
  scrollY: number;
  expanded: string[];
}

const courseViewKey = (courseId: string) => `epefi-course-view:${courseId}`;

export function saveCourseViewState(courseId: string, state: CourseViewState): void {
  try {
    window.sessionStorage.setItem(courseViewKey(courseId), JSON.stringify(state));
  } catch {
    // Sin almacenamiento disponible: al volver se verá el curso desde arriba
  }
}

export function clearCourseViewState(courseId: string): void {
  try {
    window.sessionStorage.removeItem(courseViewKey(courseId));
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible
  }
}

/** Lee el estado guardado sin borrarlo (se borra después de aplicarlo) */
export function readCourseViewState(courseId: string): CourseViewState | null {
  try {
    const raw = window.sessionStorage.getItem(courseViewKey(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CourseViewState;
    return typeof parsed?.scrollY === "number" && Array.isArray(parsed.expanded) ? parsed : null;
  } catch {
    return null;
  }
}

const splitList = (value?: string) =>
  value ? (value.includes("|||") ? value.split("|||") : [value]) : [];

const getDocuments = (modulo: Modulo) =>
  splitList(modulo.url_archivo).filter((url) => url.trim());

const getVideos = (modulo: Modulo): string[] => {
  if (!modulo.url_video) return [];
  return Array.isArray(modulo.url_video) ? modulo.url_video : [modulo.url_video];
};

/** Todo el material del curso agrupado por módulo, en el mismo orden que la página del curso. */
export function buildPlaylist(
  materias: Materia[],
  modulos: Modulo[],
  enabledModules: Record<string, boolean>
): PlaylistGroup[] {
  const groups: PlaylistGroup[] = [];
  const seen = new Set<string>();

  for (const materia of materias) {
    if ((materia.modulos?.length ?? 0) === 0) continue;
    for (const modulo of getModulesForMateria(materia, modulos)) {
      if (seen.has(modulo.id)) continue;
      seen.add(modulo.id);

      const enabled = enabledModules[modulo.id] !== false;
      const documents = getDocuments(modulo);
      const videos = getVideos(modulo);
      const docNames = splitList(modulo.nombres_archivos);
      const videoNames = splitList(modulo.nombres_videos);

      const items: PlaylistItem[] = [
        ...documents.map((_, index) => ({
          key: playlistKey(modulo.id, "document", index),
          moduloId: modulo.id,
          type: "document" as const,
          index,
          name:
            docNames[index]?.trim() ||
            (documents.length > 1 ? `Documento ${index + 1}` : "Documento"),
          enabled,
        })),
        ...videos.map((_, index) => ({
          key: playlistKey(modulo.id, "video", index),
          moduloId: modulo.id,
          type: "video" as const,
          index,
          name: videoNames[index]?.trim() || (videos.length > 1 ? `Video ${index + 1}` : "Video"),
          enabled,
        })),
      ];

      if (items.length > 0) {
        groups.push({ moduloId: modulo.id, titulo: modulo.titulo, items });
      }
    }
  }

  return groups;
}
