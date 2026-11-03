import type { StudentAnswersMap, StudentTextAnswersMap } from "@/types/exam";

/** Progreso de una evaluación en curso guardado en el dispositivo del alumno. */
export interface ExamDraft {
  idExamen: string;
  /** Momento (ms) en que se termina el tiempo; permite retomar con el reloj correcto. */
  deadline: number;
  answers: StudentAnswersMap;
  textAnswers: StudentTextAnswersMap;
  savedAt: number;
}

const draftKey = (userId: string, idExamen: string) => `epefi-exam-draft:${userId}:${idExamen}`;

export function loadExamDraft(userId: string, idExamen: string): ExamDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(userId, idExamen));
    if (!raw) return null;
    const draft = JSON.parse(raw) as ExamDraft;
    if (draft?.idExamen !== idExamen || typeof draft.deadline !== "number") return null;
    return {
      ...draft,
      answers: draft.answers ?? {},
      textAnswers: draft.textAnswers ?? {},
    };
  } catch {
    return null;
  }
}

export function saveExamDraft(userId: string, draft: Omit<ExamDraft, "savedAt">): void {
  try {
    window.localStorage.setItem(
      draftKey(userId, draft.idExamen),
      JSON.stringify({ ...draft, savedAt: Date.now() })
    );
  } catch {
    // Sin almacenamiento disponible (modo privado, cuota llena): se sigue sin respaldo local
  }
}

export function clearExamDraft(userId: string, idExamen: string): void {
  try {
    window.localStorage.removeItem(draftKey(userId, idExamen));
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible
  }
}
