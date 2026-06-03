import type { Modulo } from "@/types/types";



export type ModuleProgressMap = Record<string, Record<string, boolean>>;



/** Misma lógica que getModuleContentKeys del backend (formacionProgress.ts). */
export function getModuleDocuments(modulo: Modulo): string[] {
  if (!modulo.url_archivo?.trim()) return [];

  let documentCount = 1;
  if (modulo.nombres_archivos?.trim()) {
    const byComma = modulo.nombres_archivos
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const byPipe =
      byComma.length === 0
        ? modulo.nombres_archivos
            .split("|||")
            .map((n) => n.trim())
            .filter(Boolean)
        : byComma;
    if (byPipe.length > 0) documentCount = byPipe.length;
  } else if (modulo.url_archivo.includes("|||")) {
    documentCount = modulo.url_archivo.split("|||").filter((url) => url.trim()).length;
  }

  return Array.from({ length: documentCount }, (_, index) => `document-${index}`);
}



export function getModuleVideos(modulo: Modulo): string[] {

  if (!modulo.url_video) return [];

  if (Array.isArray(modulo.url_video)) return modulo.url_video;

  return [modulo.url_video];

}



export function isContentCompleted(

  progress: ModuleProgressMap,

  moduleId: string,

  contentIndex: number,

  contentType: "video" | "document"

): boolean {

  const contentKey = `${moduleId}_${contentType}_${contentIndex}`;

  return progress[moduleId]?.[contentKey] === true;

}



export function isModuleFullyCompleted(

  modulo: Modulo,

  progress: ModuleProgressMap

): boolean {

  const documents = getModuleDocuments(modulo);

  const videos = getModuleVideos(modulo);



  if (documents.length === 0 && videos.length === 0) {

    return true;

  }



  const allDocumentsCompleted = documents.every((_, index) =>

    isContentCompleted(progress, modulo.id, index, "document")

  );



  const allVideosCompleted = videos.every((_, index) =>

    isContentCompleted(progress, modulo.id, index, "video")

  );



  return allDocumentsCompleted && allVideosCompleted;

}



/** Misma lógica que la barra de progreso del curso (videos + documentos). */

export function getCourseContentProgress(

  modulos: Modulo[],

  materiaIds: string[],

  enabledModules: Record<string, boolean>,

  progress: ModuleProgressMap

): { completed: number; total: number; percentage: number } {

  let completed = 0;

  let total = 0;



  for (const materiaId of materiaIds) {

    const materiasModulos = modulos

      .filter((m) => m.id_materia === materiaId)

      .filter((m) => enabledModules[m.id] !== false);



    for (const modulo of materiasModulos) {

      const videos = getModuleVideos(modulo);

      videos.forEach((_, index) => {

        total++;

        if (isContentCompleted(progress, modulo.id, index, "video")) {

          completed++;

        }

      });



      const documents = getModuleDocuments(modulo);

      documents.forEach((_, index) => {

        total++;

        if (isContentCompleted(progress, modulo.id, index, "document")) {

          completed++;

        }

      });

    }

  }



  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };

}



export function isCourseContentProgressComplete(

  modulos: Modulo[],

  materiaIds: string[],

  enabledModules: Record<string, boolean>,

  progress: ModuleProgressMap

): boolean {

  const { completed, total } = getCourseContentProgress(

    modulos,

    materiaIds,

    enabledModules,

    progress

  );

  return total > 0 && completed >= total;

}



export function areAllEnabledModulesCompleted(
  modulos: Modulo[],
  enabledModules: Record<string, boolean>,
  progress: ModuleProgressMap
): boolean {
  const enabled = modulos.filter((m) => enabledModules[m.id] !== false);
  if (enabled.length === 0) return false;
  return enabled.every((modulo) => isModuleFullyCompleted(modulo, progress));
}

/** Módulos visibles en el curso (misma lista que la página del curso). */
export function getVisibleModulesProgress(
  modulos: Modulo[],
  materiaIds: string[],
  enabledModules: Record<string, boolean>,
  progress: ModuleProgressMap
): {
  totalModulos: number;
  modulosCompletados: number;
  modulosPendientes: number;
} {
  const visible = modulos.filter(
    (m) => materiaIds.includes(m.id_materia) && enabledModules[m.id] !== false
  );
  const modulosCompletados = visible.filter((m) =>
    isModuleFullyCompleted(m, progress)
  ).length;

  return {
    totalModulos: visible.length,
    modulosCompletados,
    modulosPendientes: Math.max(0, visible.length - modulosCompletados),
  };
}

/** Curso terminado según lo que ve el alumno en pantalla. */
export function isVisibleCourseProgressComplete(
  modulos: Modulo[],
  materiaIds: string[],
  enabledModules: Record<string, boolean>,
  progress: ModuleProgressMap
): boolean {
  const content = getCourseContentProgress(
    modulos,
    materiaIds,
    enabledModules,
    progress
  );
  const modules = getVisibleModulesProgress(
    modulos,
    materiaIds,
    enabledModules,
    progress
  );
  return (
    content.total > 0 &&
    content.completed >= content.total &&
    modules.totalModulos > 0 &&
    modules.modulosCompletados >= modules.totalModulos
  );
}

