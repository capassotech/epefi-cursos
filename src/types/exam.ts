export interface ExamOption {
  id: string;
  texto: string;
}

export type TipoPregunta = "opcion_multiple" | "desarrollo";

/** Estado de corrección del intento. */
export type EstadoExamenRealizado = "completado" | "pendiente_correccion";

export interface ExamQuestion {
  id: string;
  texto: string;
  orden?: number;
  opciones: ExamOption[];
  /** Viene del backend: "radio" | "checkbox" | "textarea". */
  tipoInput?: string;
  tipo?: "unica" | "multiple" | "radio" | "checkbox";
  /** Por defecto opcion_multiple (exámenes legacy). */
  tipoPregunta?: TipoPregunta;
}

export interface CourseExam {
  id: string;
  idFormacion?: string;
  titulo?: string;
  /** Duración total en minutos (default 90). */
  duracionMinutos?: number;
  preguntas: ExamQuestion[];
}

export interface ExamResultSummary {
  nota: number;
  aprobado: boolean;
  porcentajeAciertos: number;
  respuestasCorrectas?: number;
  totalPreguntas?: number;
}

export interface ExamUltimoIntento extends ExamResultSummary {
  id?: string;
  intentoNumero?: number;
  fechaRealizacion?: string;
  /** "pendiente_correccion" cuando el examen tiene preguntas de desarrollo. */
  estado?: EstadoExamenRealizado;
}

export interface ExamRealizadoOpcionDetalle {
  id: string;
  texto: string;
  esCorrecta: boolean;
  seleccionadaPorAlumno: boolean;
}

export interface ExamRealizadoPreguntaDetalle {
  orden: number;
  id: string;
  texto: string;
  tipoInput?: string;
  tipoPregunta?: TipoPregunta;
  esCorrecta: boolean;
  acertada: boolean;
  /** Puntos máximos de la pregunta. */
  puntos?: number;
  /** Puntos asignados en la corrección. */
  puntosObtenidos?: number;
  respuestasSeleccionadas: Array<{ id: string; texto: string; esCorrecta: boolean }>;
  respuestasCorrectas: Array<{ id: string; texto: string }>;
  opciones: ExamRealizadoOpcionDetalle[];
  /** Texto escrito por el alumno en preguntas de desarrollo. */
  respuestaDesarrollo?: string;
  /** Comentario / observación del docente al corregir. */
  comentario?: string;
}

export interface ExamRealizadoDetalle extends ExamUltimoIntento {
  idExamen: string;
  idFormacion: string;
  tituloExamen?: string;
  tituloFormacion?: string;
  estadoCorreccion?: EstadoExamenRealizado;
  preguntas?: ExamRealizadoPreguntaDetalle[];
  detallePreguntas?: ExamRealizadoPreguntaDetalle[];
}

export interface ExamEstado {
  examenDisponible: boolean;
  puedeRealizar: boolean;
  formacionCompleta: boolean;
  idExamen?: string;
  titulo?: string;
  duracionMinutos?: number;
  notaMinima?: number;
  mensaje?: string;
  progresoFormacion?: {
    totalModulos: number;
    modulosCompletados: number;
    modulosPendientes: number;
  };
  ultimoIntento?: ExamUltimoIntento;
}

export interface ExamAnswerSubmission {
  idPregunta: string;
  respuestasSeleccionadas: string[];
  /** Solo en preguntas de desarrollo. */
  respuestaDesarrollo?: string;
}

export interface SubmitExamPayload {
  idExamen: string;
  idFormacion: string;
  respuestas: ExamAnswerSubmission[];
  motivoCierre?: "tiempo" | "abandono" | "envio";
}

export interface ExamAttempt extends ExamResultSummary {
  id: string;
  idExamen?: string;
  idFormacion?: string;
  respuestas?: ExamAnswerSubmission[];
  fecha?: string;
  createdAt?: string;
}

export interface SubmitExamResult extends ExamResultSummary {
  examenRealizado?: ExamAttempt;
  mensaje?: string;
  puedeReintentar?: boolean;
  estado?: EstadoExamenRealizado;
}

/** Opciones seleccionadas por pregunta de opción múltiple. */
export type StudentAnswersMap = Record<string, string[]>;

/** Texto ingresado por pregunta de desarrollo. */
export type StudentTextAnswersMap = Record<string, string>;
