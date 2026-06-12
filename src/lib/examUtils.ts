import type { ExamEstado, ExamQuestion, StudentAnswersMap } from "@/types/exam";

const PASSING_GRADE = 7;

export function isPassingGrade(nota: number, minGrade = PASSING_GRADE): boolean {
  return nota >= minGrade;
}

/** Radio/checkbox según tipoInput del backend. */
export function isMultipleChoiceQuestion(question: ExamQuestion): boolean {
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
  answers: StudentAnswersMap
): boolean {
  return questions.every((q) => {
    const selected = answers[q.id] ?? [];
    return selected.length > 0;
  });
}

export function buildSubmissionPayload(
  questions: ExamQuestion[],
  answers: StudentAnswersMap
) {
  return questions.map((q) => ({
    idPregunta: q.id,
    respuestasSeleccionadas: answers[q.id] ?? [],
  }));
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
