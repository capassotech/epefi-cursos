export interface ExamOption {
  id: string;
  texto: string;
}

export interface ExamQuestion {
  id: string;
  texto: string;
  orden?: number;
  opciones: ExamOption[];
  /** Viene del backend: "radio" | "checkbox". */
  tipoInput?: string;
  tipo?: "unica" | "multiple" | "radio" | "checkbox";
}

export interface CourseExam {
  id: string;
  idFormacion?: string;
  titulo?: string;
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
  esCorrecta: boolean;
  acertada: boolean;
  respuestasSeleccionadas: Array<{ id: string; texto: string; esCorrecta: boolean }>;
  respuestasCorrectas: Array<{ id: string; texto: string }>;
  opciones: ExamRealizadoOpcionDetalle[];
}

export interface ExamRealizadoDetalle extends ExamUltimoIntento {
  idExamen: string;
  idFormacion: string;
  tituloExamen?: string;
  tituloFormacion?: string;
  estado?: string;
  preguntas?: ExamRealizadoPreguntaDetalle[];
  detallePreguntas?: ExamRealizadoPreguntaDetalle[];
}

export interface ExamEstado {
  examenDisponible: boolean;
  puedeRealizar: boolean;
  formacionCompleta: boolean;
  idExamen?: string;
  titulo?: string;
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
}

export interface SubmitExamPayload {
  idExamen: string;
  idFormacion: string;
  respuestas: ExamAnswerSubmission[];
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
}

export type StudentAnswersMap = Record<string, string[]>;
