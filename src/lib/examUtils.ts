import type {
  ExamEstado,
  ExamQuestion,
  StudentAnswersMap,
  StudentTextAnswersMap,
} from "@/types/exam";

const PASSING_GRADE = 7;

export function isPassingGrade(nota: number, minGrade = PASSING_GRADE): boolean {
  return nota >= minGrade;
}

/** Pregunta abierta: se responde con texto y la corrige un administrador. */
export function isDesarrolloQuestion(question: ExamQuestion): boolean {
  if (question.tipoPregunta === "desarrollo") return true;
  return (question.tipoInput ?? "").toLowerCase().includes("textarea");
}

/** True si el examen requiere corrección manual. */
export function hasDesarrolloQuestions(questions: ExamQuestion[]): boolean {
  return questions.some(isDesarrolloQuestion);
}

/** Radio/checkbox según tipoInput del backend. */
export function isMultipleChoiceQuestion(question: ExamQuestion): boolean {
  if (isDesarrolloQuestion(question)) return false;

  const tipo = (question.tipoInput ?? question.tipo ?? "").toLowerCase();
  if (tipo.includes("checkbox") || tipo === "multiple" || tipo.includes("multi")) {
    return true;
  }
  if (tipo.includes("radio") || tipo === "unica" || tipo === "single") {
    return false;
  }
  return false;
}

export function sortQuestionsByOrder(questions: ExamQuestion[]): ExamQuestion[] {
  return [...questions].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export function validateAllQuestionsAnswered(
  questions: ExamQuestion[],
  answers: StudentAnswersMap,
  textAnswers: StudentTextAnswersMap = {}
): boolean {
  return questions.every((q) => {
    if (isDesarrolloQuestion(q)) {
      return (textAnswers[q.id] ?? "").trim().length > 0;
    }
    const selected = answers[q.id] ?? [];
    return selected.length > 0;
  });
}

function buildAnswerEntry(
  question: ExamQuestion,
  answers: StudentAnswersMap,
  textAnswers: StudentTextAnswersMap
) {
  if (isDesarrolloQuestion(question)) {
    return {
      idPregunta: question.id,
      respuestasSeleccionadas: [] as string[],
      respuestaDesarrollo: (textAnswers[question.id] ?? "").trim(),
    };
  }
  return {
    idPregunta: question.id,
    respuestasSeleccionadas: answers[question.id] ?? [],
  };
}

export function buildSubmissionPayload(
  questions: ExamQuestion[],
  answers: StudentAnswersMap,
  textAnswers: StudentTextAnswersMap = {}
) {
  return questions.map((q) => buildAnswerEntry(q, answers, textAnswers));
}

/** Incluye todas las preguntas; las no respondidas van vacías (cierre forzado). */
export function buildForcedClosePayload(
  questions: ExamQuestion[],
  answers: StudentAnswersMap,
  textAnswers: StudentTextAnswersMap = {}
) {
  return questions.map((q) => buildAnswerEntry(q, answers, textAnswers));
}

export function formatExamCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Muestra 10 en lugar de 10.0; conserva decimales si los hay (ej. 7.5). */
export function formatNota(nota: number): string {
  return String(parseFloat(nota.toFixed(1)));
}

/** Muestra 75% en lugar de 75.0%. */
export function formatPorcentaje(porcentaje: number): string {
  return `${String(parseFloat(porcentaje.toFixed(1)))}%`;
}

export { PASSING_GRADE };
