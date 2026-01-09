// ===== TIPOS BASE =====

export interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  estado: "activo" | "inactivo";
  imagen: string;
  precio: number;
  materias: string[]; // IDs de materias asociadas
  fechaInicioDictado?: string | Date; // ISO string o Date
  fechaFinDictado?: string | Date; // ISO string o Date
  planDeEstudiosUrl?: string; // URL del PDF del plan de estudios
  fechasDeExamenesUrl?: string; // URL del PDF de fechas de exámenes
  planDeEstudiosFechaActualizacion?: string | Date; // Fecha de última actualización
  fechasDeExamenesFechaActualizacion?: string | Date; // Fecha de última actualización
}

export interface Materia {
  id: string;
  nombre: string;
  id_cursos: string[]; // IDs de cursos a los que pertenece
  modulos: string[]; // IDs de módulos asociados
}

export interface Modulo {
  id: string;
  id_materia: string;
  titulo: string;
  descripcion: string;
  tipo_contenido: "pdf" | "video" | "evaluacion" | "extra" | "imagen";
  url_archivo: string; // Puede ser string simple o string con delimitador ||| para múltiples archivos
  url_miniatura?: string;
  bibliografia?: string;
  url_video?: string | string[]; // Puede ser string simple o array de strings para múltiples videos
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: "alumno" | "admin";
  fecha_registro: string; // ISO string
  fecha_actualizacion: string; // ISO string
  cursos_asignados: string[]; // IDs de cursos habilitados
  activo: boolean;
  // Campos adicionales para compatibilidad con auth
  uid?: string;
  dni?: string;
}

// ===== TIPOS DE AUTENTICACIÓN =====

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  dni?: string;
}

export interface LoginData {
  email: string;
  password: string;
}
export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  role: string;
  fechaRegistro: string;
}
export interface AuthResponse {
  message: string;
  user: {
    uid: string;
    email: string;
    nombre: string;
    apellido: string;
    role: string;
  };
  customToken?: string;
}

// ===== TIPOS EXTENDIDOS PARA VISTAS =====

// Para mostrar curso con sus materias y módulos poblados
export interface CursoCompleto extends Omit<Curso, "materias"> {
  materias: MateriaCompleta[];
  progreso: number; // Calculado dinámicamente
}

// Para mostrar materia con sus módulos poblados
export interface MateriaCompleta extends Omit<Materia, "modulos"> {
  modulos: Modulo[];
}

// Para búsquedas y listados
export interface ContenidoBusqueda {
  id: string;
  tipo: "curso" | "materia" | "modulo";
  titulo: string;
  descripcion: string;
  imagen?: string;
  duracion?: string;
  materia?: string; // Nombre de la materia (para módulos)
  curso?: string; // Nombre del curso
  path: string; // Ruta de navegación
}
