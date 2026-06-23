import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardCheck,
  Loader2,
  Lock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import axios from "axios";
import { resolveFormacionId } from "@/lib/formacionId";
import {
  buildSubmissionPayload,
  formatNota,
  formatPorcentaje,
  isMultipleChoiceQuestion,
  PASSING_GRADE,
  sortQuestionsByOrder,
  validateAllQuestionsAnswered,
} from "@/lib/examUtils";
import {
  getCourseContentProgress,
  getVisibleModulesProgress,
  isVisibleCourseProgressComplete,
  type ModuleProgressMap,
} from "@/lib/courseProgress";
import ExamService, { getApiErrorMessage } from "@/services/examService";
import VerExamenRealizadoModal from "@/components/VerExamenRealizadoModal";
import type { Modulo } from "@/types/types";
import type {
  CourseExam,
  ExamEstado,
  ExamQuestion,
  ExamRealizadoDetalle,
  ExamResultSummary,
  ExamUltimoIntento,
  StudentAnswersMap,
} from "@/types/exam";
import { toast } from "sonner";

type ExamPhase = "idle" | "loading_exam" | "taking" | "result";

function ExamResultDisplay({
  result,
  prominent = false,
  showStatus = false,
}: {
  result: ExamResultSummary;
  prominent?: boolean;
  showStatus?: boolean;
}) {
  return (
    <div className={cn("space-y-1", prominent ? "text-center" : "text-left")}>
      {showStatus && (
        <Badge
          variant={result.aprobado ? "default" : "destructive"}
          className={cn(prominent ? "mx-auto" : "")}
        >
          {result.aprobado ? "Aprobado" : "No aprobado"}
        </Badge>
      )}
      <p
        className={cn(
          "font-bold text-slate-900 dark:text-slate-100",
          prominent ? "text-3xl" : "text-base"
        )}
      >
        Aciertos: {formatPorcentaje(result.porcentajeAciertos)}
      </p>
      <p
        className={cn(
          "text-slate-700 dark:text-slate-300",
          prominent ? "text-xl" : "text-sm"
        )}
      >
        Nota: {formatNota(result.nota)}
      </p>
      {result.respuestasCorrectas != null && result.totalPreguntas != null && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Respuestas correctas: {result.respuestasCorrectas} de {result.totalPreguntas}
        </p>
      )}
    </div>
  );
}

interface CourseExamSectionProps {
  courseId: string;
  coursePayload?: unknown;
  /** Se incrementa al marcar contenido completado para refrescar el estado del examen. */
  progressRevision?: number;
  modulos?: Modulo[];
  materiaIds?: string[];
  enabledModules?: Record<string, boolean>;
  progress?: ModuleProgressMap;
}

export default function CourseExamSection({
  courseId,
  coursePayload,
  progressRevision = 0,
  modulos = [],
  materiaIds = [],
  enabledModules = {},
  progress = {},
}: CourseExamSectionProps) {
  const [loadingEstado, setLoadingEstado] = useState(true);
  const [estado, setEstado] = useState<ExamEstado | null>(null);
  const [exam, setExam] = useState<CourseExam | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState<ExamPhase>("idle");
  const [displayQuestions, setDisplayQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<StudentAnswersMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<ExamUltimoIntento | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showVerExamenModal, setShowVerExamenModal] = useState(false);
  const [examenDetalle, setExamenDetalle] = useState<ExamRealizadoDetalle | null>(null);
  const [loadingVerExamen, setLoadingVerExamen] = useState(false);

  const formacionId = useMemo(
    () => resolveFormacionId(coursePayload, courseId),
    [coursePayload, courseId]
  );

  const resetExamSession = useCallback(() => {
    setPhase("idle");
    setExam(null);
    setDisplayQuestions([]);
    setAnswers({});
  }, []);

  const loadEstado = useCallback(async (options?: { silent?: boolean }) => {
    if (!formacionId) {
      setLoadingEstado(false);
      return;
    }

    if (!options?.silent) {
      setLoadingEstado(true);
    }
    setLoadError(null);
    try {
      const data = await ExamService.getExamEstado(formacionId);
      setEstado(data);
      if (data.ultimoIntento) {
        setLastResult(data.ultimoIntento);
      }
    } catch (error) {
      console.error("Error loading exam estado:", error);
      const message =
        axios.isAxiosError(error) && typeof error.response?.data === "object"
          ? String(
              (error.response.data as Record<string, unknown>).error ??
                "No se pudo cargar la evaluación."
            )
          : "No se pudo cargar la evaluación. Intentá nuevamente más tarde.";
      setLoadError(message);
      setEstado(null);
    } finally {
      setLoadingEstado(false);
    }
  }, [formacionId]);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    const silent = !isInitialLoad.current;
    isInitialLoad.current = false;
    void loadEstado({ silent });
  }, [loadEstado, progressRevision]);

  const startExam = useCallback(
    async (idExamen: string) => {
      setPhase("loading_exam");
      setAnswers({});
      setLastResult(null);

      try {
        const examData = await ExamService.getExamForStudent(idExamen);
        if (!examData || examData.preguntas.length === 0) {
          toast.error("No hay preguntas disponibles para esta evaluación.");
          setPhase("idle");
          setModalOpen(false);
          return;
        }
        setExam(examData);
        setDisplayQuestions(sortQuestionsByOrder(examData.preguntas));
        setPhase("taking");
      } catch (error) {
        console.error("Error loading exam questions:", error);
        toast.error("No se pudo iniciar la evaluación", {
          description: getApiErrorMessage(
            error,
            "Completá todos los módulos antes de realizar la evaluación."
          ),
        });
        setPhase("idle");
        setModalOpen(false);
        void loadEstado({ silent: true });
      }
    },
    [loadEstado]
  );

  const openExamModal = useCallback(async () => {
    if (!formacionId) return;

    setModalOpen(true);
    setPhase("loading_exam");

    try {
      const fresh = await ExamService.getExamEstado(formacionId);
      setEstado(fresh);

      const readyNow = isVisibleCourseProgressComplete(
        modulos,
        materiaIds,
        enabledModules,
        progress
      );

      if (!fresh.idExamen) {
        toast.error("No hay evaluación configurada para esta formación.");
        setModalOpen(false);
        setPhase("idle");
        return;
      }

      if (!fresh.puedeRealizar && !readyNow) {
        toast.error("Evaluación no disponible", {
          description:
            "Debés completar todos los contenidos de cada módulo. Revisá el progreso del curso.",
        });
        setModalOpen(false);
        setPhase("idle");
        return;
      }

      await startExam(fresh.idExamen);
    } catch (error) {
      console.error("Error refreshing exam estado:", error);
      toast.error("No se pudo verificar la evaluación", {
        description: getApiErrorMessage(error, "Intentá nuevamente."),
      });
      setModalOpen(false);
      setPhase("idle");
    }
  }, [formacionId, startExam, modulos, materiaIds, enabledModules, progress]);

  const handleModalChange = (open: boolean) => {
    if (!open && submitting) return;
    if (!open) {
      resetExamSession();
    }
    setModalOpen(open);
  };

  const handleSingleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }));
  };

  const handleMultipleToggle = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (checked) {
        return { ...prev, [questionId]: [...current, optionId] };
      }
      return {
        ...prev,
        [questionId]: current.filter((id) => id !== optionId),
      };
    });
  };

  const handleVerExamenRealizado = useCallback(async () => {
    const intentoId = lastResult?.id ?? estado?.ultimoIntento?.id;
    if (!intentoId) {
      toast.error("No se encontró el registro del examen realizado.");
      return;
    }

    setShowVerExamenModal(true);
    setLoadingVerExamen(true);
    setExamenDetalle(null);

    try {
      const detalle = await ExamService.getExamenRealizadoDetalle(intentoId);
      setExamenDetalle(detalle);
    } catch (error) {
      console.error("Error loading exam detail:", error);
      toast.error("No se pudo cargar el examen realizado", {
        description: getApiErrorMessage(error, "Intentá nuevamente más tarde."),
      });
      setShowVerExamenModal(false);
    } finally {
      setLoadingVerExamen(false);
    }
  }, [estado?.ultimoIntento?.id, lastResult?.id]);

  const handleSubmit = async () => {
    if (!exam || !estado?.idExamen) return;

    if (!validateAllQuestionsAnswered(displayQuestions, answers)) {
      toast.error("Completá todas las preguntas", {
        description: "Debés responder cada pregunta antes de enviar la evaluación.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await ExamService.submitExam({
        idExamen: estado.idExamen,
        idFormacion: formacionId,
        respuestas: buildSubmissionPayload(displayQuestions, answers),
      });

      const intentoResultado: ExamUltimoIntento = {
        nota: result.nota,
        aprobado: result.aprobado,
        porcentajeAciertos: result.porcentajeAciertos,
        respuestasCorrectas: result.respuestasCorrectas,
        totalPreguntas: result.totalPreguntas,
        ...(result.examenRealizado?.id ? { id: result.examenRealizado.id } : {}),
      };

      setLastResult(intentoResultado);
      setPhase("result");

      if (result.aprobado) {
        toast.success("¡Felicitaciones!", {
          description: `Aprobaste con ${formatPorcentaje(result.porcentajeAciertos)} de aciertos.`,
        });
        setEstado((prev) =>
          prev
            ? {
                ...prev,
                puedeRealizar: false,
                ultimoIntento: intentoResultado,
              }
            : prev
        );
      } else {
        toast.info("Evaluación no aprobada", {
          description: `Obtuviste ${formatPorcentaje(result.porcentajeAciertos)} de aciertos. Podés reintentar cuando quieras.`,
        });
        setEstado((prev) =>
          prev
            ? {
                ...prev,
                ultimoIntento: intentoResultado,
              }
            : prev
        );
      }
    } catch (error: unknown) {
      console.error("Error submitting exam:", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo enviar la evaluación. Intentá nuevamente.";
      toast.error("Error al enviar", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const contentProgress = useMemo(() => {
    if (modulos.length === 0 || materiaIds.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    return getCourseContentProgress(modulos, materiaIds, enabledModules, progress);
  }, [modulos, materiaIds, enabledModules, progress]);

  const moduleProgress = useMemo(() => {
    if (modulos.length === 0 || materiaIds.length === 0) {
      return { totalModulos: 0, modulosCompletados: 0, modulosPendientes: 0 };
    }
    return getVisibleModulesProgress(modulos, materiaIds, enabledModules, progress);
  }, [modulos, materiaIds, enabledModules, progress]);

  const locallyReady = useMemo(
    () =>
      isVisibleCourseProgressComplete(
        modulos,
        materiaIds,
        enabledModules,
        progress
      ) && !!estado?.idExamen,
    [modulos, materiaIds, enabledModules, progress, estado?.idExamen]
  );

  const notaMinima = estado?.notaMinima ?? PASSING_GRADE;
  const ultimoIntento = lastResult ?? estado?.ultimoIntento ?? null;
  const passed = ultimoIntento?.aprobado === true;
  const tieneIntento = ultimoIntento != null;
  const puedeVerDetalle = Boolean(ultimoIntento?.id);
  const canShowButton =
    !passed && !!estado?.idExamen && (estado.puedeRealizar === true || locallyReady);

  const sectionTitle = useMemo(
    () => estado?.titulo?.trim() || exam?.titulo?.trim() || "Evaluación de la formación",
    [estado?.titulo, exam?.titulo]
  );

  const sectionHeader = (
    <div className="flex items-center gap-2">
      <ClipboardCheck className="h-4 w-4 text-orange-500" />
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        Evaluación
      </h2>
    </div>
  );

  if (loadingEstado) {
    return (
      <section className="space-y-4">
        {sectionHeader}
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="space-y-4">
        {sectionHeader}
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={() => void loadEstado()}>
          Reintentar carga
        </Button>
      </section>
    );
  }

  if (!estado?.examenDisponible && !locallyReady) {
    const sinExamenConfigurado = estado?.formacionCompleta && !estado.idExamen;

    return (
      <section className="space-y-4">
        {sectionHeader}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 sm:p-6">
            {!estado?.formacionCompleta ? (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Evaluación bloqueada
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Completá todo el contenido de cada módulo para habilitar la evaluación final.
                  {contentProgress.total > 0 && (
                    <span className="block mt-1">
                      Progreso: {contentProgress.completed} de {contentProgress.total}{" "}
                      completados
                    </span>
                  )}
                  {moduleProgress.totalModulos > 0 && (
                    <span className="block mt-1">
                      Módulos completos: {moduleProgress.modulosCompletados} de{" "}
                      {moduleProgress.totalModulos}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <AlertTitle className="text-slate-900 dark:text-slate-100">
                  Evaluación no disponible
                </AlertTitle>
                <AlertDescription className="text-slate-600 dark:text-slate-400">
                  {sinExamenConfigurado
                    ? "Completaste el curso, pero esta formación aún no tiene evaluación configurada."
                    : "La evaluación no está disponible en este momento."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-4">
        {sectionHeader}

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                {sectionTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Nota mínima para aprobar: {notaMinima}
              </p>
            </div>

            {locallyReady && !passed && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                <AlertDescription className="text-blue-900 dark:text-blue-100 text-sm">
                  Completaste todo el contenido del curso. Podés realizar la evaluación final.
                </AlertDescription>
              </Alert>
            )}

            {tieneIntento && (
              <div
                className={cn(
                  "rounded-lg border p-4 space-y-3",
                  passed
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                    : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {passed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {passed ? "¡Aprobaste la evaluación!" : "Último intento"}
                    </p>
                    <ExamResultDisplay result={ultimoIntento} showStatus />
                    {!passed && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No alcanzaste la nota mínima. Podés reintentar.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {puedeVerDetalle && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto gap-2"
                      onClick={() => void handleVerExamenRealizado()}
                    >
                      <FileText className="h-4 w-4" />
                      Ver examen realizado
                    </Button>
                  )}
                  {!passed && canShowButton && (
                    <Button className="w-full sm:w-auto gap-2" onClick={() => void openExamModal()}>
                      <RotateCcw className="h-4 w-4" />
                      Reintentar evaluación
                    </Button>
                  )}
                </div>
              </div>
            )}

            {canShowButton && !tieneIntento && (
              <Button className="w-full sm:w-auto" onClick={() => void openExamModal()}>
                Realizar evaluación
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={modalOpen} onOpenChange={handleModalChange}>
        <DialogContent
          className={cn(
            "max-w-2xl w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden",
            "max-h-[min(90dvh,900px)] flex flex-col"
          )}
          onInteractOutside={(e) => {
            if (submitting || phase === "taking") e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (submitting) e.preventDefault();
          }}
        >
          <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <DialogTitle className="text-left pr-8">{sectionTitle}</DialogTitle>
            <DialogDescription className="text-left">
              Nota mínima para aprobar: {notaMinima}
              {displayQuestions.length > 0 && phase === "taking" && (
                <span className="block mt-0.5">
                  {displayQuestions.length} pregunta
                  {displayQuestions.length !== 1 ? "s" : ""}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4">
            {phase === "loading_exam" && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <p className="text-sm text-slate-500">Cargando evaluación...</p>
              </div>
            )}

            {phase === "taking" && exam && (
              <div className="space-y-5">
                {displayQuestions.map((question, index) => {
                  const isMultiple = isMultipleChoiceQuestion(question);
                  const selected = answers[question.id] ?? [];

                  return (
                    <div
                      key={question.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        <span className="text-orange-500 mr-2">{index + 1}.</span>
                        {question.texto}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isMultiple
                          ? "Podés seleccionar más de una respuesta"
                          : "Seleccioná una respuesta"}
                      </p>

                      {isMultiple ? (
                        <div className="space-y-2">
                          {question.opciones.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-start gap-3 rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-600 p-2"
                            >
                              <Checkbox
                                id={`modal-${question.id}-${option.id}`}
                                checked={selected.includes(option.id)}
                                onCheckedChange={(checked) =>
                                  handleMultipleToggle(
                                    question.id,
                                    option.id,
                                    checked === true
                                  )
                                }
                                disabled={submitting}
                              />
                              <Label
                                htmlFor={`modal-${question.id}-${option.id}`}
                                className="text-sm font-normal leading-snug cursor-pointer flex-1"
                              >
                                {option.texto}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <RadioGroup
                          value={selected[0] ?? ""}
                          onValueChange={(value) => handleSingleSelect(question.id, value)}
                          className="space-y-2"
                          disabled={submitting}
                        >
                          {question.opciones.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-start gap-3 rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-600 p-2"
                            >
                              <RadioGroupItem
                                value={option.id}
                                id={`modal-${question.id}-${option.id}`}
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor={`modal-${question.id}-${option.id}`}
                                className="text-sm font-normal leading-snug cursor-pointer flex-1"
                              >
                                {option.texto}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {phase === "result" && lastResult && (
              <div className="space-y-4 py-4">
                <div
                  className={cn(
                    "rounded-lg border p-6 text-center space-y-2",
                    lastResult.aprobado
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                      : "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30"
                  )}
                >
                  {lastResult.aprobado ? (
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                  ) : (
                    <XCircle className="h-12 w-12 text-orange-500 mx-auto" />
                  )}
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {lastResult.aprobado ? "¡Aprobaste!" : "No aprobaste"}
                  </p>
                  <ExamResultDisplay result={lastResult} prominent />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {lastResult.aprobado
                      ? `Felicitaciones, alcanzaste la nota mínima de ${notaMinima}.`
                      : `Necesitás al menos ${notaMinima} para aprobar. Tu resultado quedó registrado.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {(phase === "taking" || phase === "result") && (
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-2 bg-background">
              {phase === "taking" && (
                <>
                  <Button
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className="flex-1 sm:flex-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Finalizar evaluación"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={submitting}
                    onClick={() => handleModalChange(false)}
                  >
                    Cancelar
                  </Button>
                </>
              )}

              {phase === "result" && lastResult && !lastResult.aprobado && (
                <>
                  <Button
                    className="w-full sm:w-auto gap-2"
                    onClick={() => void openExamModal()}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reintentar evaluación
                  </Button>
                  {lastResult.id && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto gap-2"
                      onClick={() => void handleVerExamenRealizado()}
                    >
                      <FileText className="h-4 w-4" />
                      Ver examen realizado
                    </Button>
                  )}
                </>
              )}

              {phase === "result" && lastResult?.aprobado && (
                <>
                  {lastResult.id && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto gap-2"
                      onClick={() => void handleVerExamenRealizado()}
                    >
                      <FileText className="h-4 w-4" />
                      Ver examen realizado
                    </Button>
                  )}
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => handleModalChange(false)}
                  >
                    Cerrar
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VerExamenRealizadoModal
        open={showVerExamenModal}
        onOpenChange={setShowVerExamenModal}
        detalle={examenDetalle}
        loading={loadingVerExamen}
      />
    </>
  );
}
