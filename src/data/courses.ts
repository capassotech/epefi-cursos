export type ContentType = "VIDEO" | "PDF" | "EVALUACION" | "EXTRA";

export interface ModuleItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  duration?: string;
  size?: string;
  completed?: boolean;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  items: ModuleItem[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  modules: Module[];
}

export interface Course {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  estado: "activo" | "inactivo";
  precio: number;
  materias: string[];
  fechaInicioDictado?: string | Date; // ISO string o Date
  fechaFinDictado?: string | Date; // ISO string o Date
  planDeEstudiosUrl?: string; // URL del PDF del plan de estudios
  fechasDeExamenesUrl?: string; // URL del PDF de fechas de exámenes
  planDeEstudiosFechaActualizacion?: string | Date; // Fecha de última actualización
  fechasDeExamenesFechaActualizacion?: string | Date; // Fecha de última actualización
}

export const buildCourseUrl = (
  courseId?: string,
  subjectId?: string,
  moduleId?: string
) => {
  const basePath = courseId ? `/curso/${courseId}` : "/curso";

  const params = new URLSearchParams();

  if (subjectId) {
    params.set("materia", subjectId);
  }

  if (moduleId) {
    params.set("modulo", moduleId);
  }

  const search = params.toString();

  return search ? `${basePath}?${search}` : basePath;
};
