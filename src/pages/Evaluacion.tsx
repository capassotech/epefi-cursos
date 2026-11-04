import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Hourglass,
  Loader2,
  Lock,
  RotateCcw,
  Timer,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { clearExamDraft, loadExamDraft, saveExamDraft } from "@/lib/examDraft";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/components/ThemeProvider";
import { ExamResultDisplay, ExamStartSummary } from "@/components/exam/ExamParts";
import VerExamenRealizadoModal from "@/components/VerExamenRealizadoModal";
import { cn } from "@/lib/utils";
import {
  buildForcedClosePayload,
  buildSubmissionPayload,
  countUnansweredQuestions,
  DEFAULT_EXAM_MINUTES,
  formatExamCountdown,
  formatPorcentaje,
  getExamBlockReason,
  getExamRules,
  hasDesarrolloQuestions,
  isDesarrolloQuestion,
  isMultipleChoiceQuestion,
  sortQuestionsByOrder,
} from "@/lib/examUtils";
import ExamService, { getApiErrorMessage } from "@/services/examService";
import type {
  CourseExam,
  ExamEstado,
  ExamQuestion,
  ExamRealizadoDetalle,
  ExamUltimoIntento,
  StudentAnswersMap,
  StudentTextAnswersMap,
  SubmitExamResult,
} from "@/types/exam";

type ExamPhase = "loading" | "intro" | "blocked" | "starting" | "taking" | "result";

type ConfirmState = { kind: "close" } | { kind: "unanswered"; count: number } | null;

/** Página donde el alumno rinde la evaluación final de una formación. */
export default function Evaluacion() {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const formacionId = searchParams.get("formacion") || courseId;
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const courseUrl = `/curso/${courseId}`;

  // El alumno ya confirmó en la página del curso: se comienza sin volver a preguntar
  const autoStartRef = useRef(
    (location.state as { autoStart?: boolean } | null)?.autoStart === true
  );

  const [phase, setPhase] = useState<ExamPhase>("loading");
  const [estado, setEstado] = useState<ExamEstado | null>(null);
  const [blockReason, setBlockReason] = useState<{ title: string; description: string } | null>(null);
  const [exam, setExam] = useState<CourseExam | null>(null);
  const [displayQuestions, setDisplayQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<StudentAnswersMap>({});
  const [textAnswers, setTextAnswers] = useState<StudentTextAnswersMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<ExamUltimoIntento | null>(null);
  const [lastResultPublicacionManual, setLastResultPublicacionManual] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  /** Momento en que termina el tiempo; el reloj se calcula contra él para sobrevivir recargas */
  const [deadline, setDeadline] = useState<number | null>(null);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [showVerExamenModal, setShowVerExamenModal] = useState(false);
  const [examenDetalle, setExamenDetalle] = useState<ExamRealizadoDetalle | null>(null);
  const [loadingVerExamen, setLoadingVerExamen] = useState(false);
  // Una sola confirmación visible a la vez: salir de la evaluación o enviar con preguntas pendientes
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const openCloseConfirm = useCallback(
    () => setConfirm((prev) => prev ?? { kind: "close" }),
    []
  );
  // Conserva el último contenido para que la animación de cierre no cambie de texto
  const [shownConfirm, setShownConfirm] = useState<ConfirmState>(confirm);
  if (confirm && confirm !== shownConfirm) setShownConfirm(confirm);

  const submittingRef = useRef(false);
  const answersRef = useRef<StudentAnswersMap>({});
  const textAnswersRef = useRef<StudentTextAnswersMap>({});
  const displayQuestionsRef = useRef<ExamQuestion[]>([]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    textAnswersRef.current = textAnswers;
  }, [textAnswers]);

  useEffect(() => {
    displayQuestionsRef.current = displayQuestions;
  }, [displayQuestions]);

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const startExam = useCallback(async (idExamen: string) => {
    setPhase("starting");
    setAnswers({});
    setTextAnswers({});
    setLastResult(null);
    setLastResultPublicacionManual(false);
    setRemainingSeconds(null);
    setDeadline(null);
    setConfirm(null);

    try {
      const examData = await ExamService.getExamForStudent(idExamen);
      if (!examData || examData.preguntas.length === 0) {
        toast.error("No hay preguntas disponibles para esta evaluación.");
        setPhase("intro");
        return;
      }
      const questions = sortQuestionsByOrder(examData.preguntas);
      setExam(examData);
      setDisplayQuestions(questions);
      const minutos =
        examData.duracionMinutos && examData.duracionMinutos > 0
          ? examData.duracionMinutos
          : DEFAULT_EXAM_MINUTES;
      const now = Date.now();
      let examDeadline = now + minutos * 60_000;

      // Si quedó una evaluación a medias en este dispositivo, se retoma con sus respuestas y su reloj
      const draft = userId ? loadExamDraft(userId, idExamen) : null;
      if (draft) {
        const questionIds = new Set(questions.map((q) => q.id));
        const keepKnown = <T,>(map: Record<string, T>) =>
          Object.fromEntries(Object.entries(map).filter(([id]) => questionIds.has(id)));
        setAnswers(keepKnown(draft.answers));
        setTextAnswers(keepKnown(draft.textAnswers));
        examDeadline = Math.min(draft.deadline, examDeadline);
        toast.info("Retomamos tu evaluación", {
          description: "Recuperamos las respuestas que habías marcado.",
        });
      }

      setActiveExamId(idExamen);
      setDeadline(examDeadline);
      setRemainingSeconds(Math.max(0, Math.ceil((examDeadline - now) / 1000)));
      setPhase("taking");
    } catch (error) {
      console.error("Error loading exam questions:", error);
      toast.error("No se pudo iniciar la evaluación", {
        description: getApiErrorMessage(
          error,
          "Completá todos los módulos antes de realizar la evaluación."
        ),
      });
      setPhase("intro");
    }
  }, [userId]);

  /** Consulta el estado actualizado y muestra la introducción, o comienza si ya se confirmó. */
  const loadEstado = useCallback(async (isCancelled?: () => boolean) => {
    setPhase("loading");
    try {
      const fresh = await ExamService.getExamEstado(formacionId);
      if (isCancelled?.()) return;
      setEstado(fresh);
      const reason = getExamBlockReason(fresh);
      if (reason) {
        setBlockReason(reason);
        setPhase("blocked");
        return;
      }
      const hasDraft = !!fresh.idExamen && !!userId && !!loadExamDraft(userId, fresh.idExamen);
      if ((autoStartRef.current || hasDraft) && fresh.idExamen) {
        autoStartRef.current = false;
        await startExam(fresh.idExamen);
        return;
      }
      setPhase("intro");
    } catch (error) {
      if (isCancelled?.()) return;
      console.error("Error loading exam estado:", error);
      setBlockReason({
        title: "No se pudo cargar la evaluación",
        description: getApiErrorMessage(error, "Intentá nuevamente más tarde."),
      });
      setPhase("blocked");
    }
  }, [formacionId, startExam, userId]);

  useEffect(() => {
    let cancelled = false;
    void loadEstado(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadEstado]);

  // El aviso de inicio se consume una sola vez: al recargar o volver se muestra la introducción
  useEffect(() => {
    if ((location.state as { autoStart?: boolean } | null)?.autoStart) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  const applySubmitResult = useCallback(
    (result: SubmitExamResult, motivo: "tiempo" | "abandono" | "envio") => {
      const pendienteCorreccion = result.estado === "pendiente_correccion";
      const publicacionManual = result.publicacionManualDeNota === true;
      setLastResultPublicacionManual(publicacionManual);
      const intentoResultado: ExamUltimoIntento = {
        nota: result.nota,
        aprobado: result.aprobado,
        porcentajeAciertos: result.porcentajeAciertos,
        respuestasCorrectas: result.respuestasCorrectas,
        totalPreguntas: result.totalPreguntas,
        ...(result.intentoNumero != null ? { intentoNumero: result.intentoNumero } : {}),
        ...(result.examenRealizado?.id ? { id: result.examenRealizado.id } : {}),
        ...(result.estado ? { estado: result.estado } : {}),
      };

      setLastResult(intentoResultado);
      setPhase("result");
      setRemainingSeconds(null);

      if (publicacionManual || pendienteCorreccion) {
        toast.success("Evaluación enviada", {
          description:
            result.mensaje ||
            (publicacionManual && !pendienteCorreccion
              ? "La nota será publicada por el administrador en las próximas horas."
              : "Contiene preguntas de desarrollo: será corregida en las próximas horas."),
        });
      } else if (motivo === "tiempo") {
        toast.warning("Tiempo agotado", {
          description: result.mensaje || "Se agotó el tiempo. El intento quedó registrado.",
        });
      } else if (motivo === "abandono") {
        toast.info("Evaluación cerrada", {
          description: result.mensaje || "Saliste de la evaluación. El intento quedó registrado.",
        });
      } else if (result.aprobado) {
        toast.success("¡Felicitaciones!", {
          description: `Aprobaste con ${formatPorcentaje(result.porcentajeAciertos)} de aciertos.`,
        });
      } else if (!result.puedeReintentar) {
        toast.error("Evaluación bloqueada", {
          description:
            result.mensaje ||
            "Alcanzaste el máximo de intentos. Ya no podés volver a realizarla.",
        });
      } else {
        toast.info("Evaluación no aprobada", {
          description:
            result.mensaje ||
            `Obtuviste ${formatPorcentaje(result.porcentajeAciertos)} de aciertos. Podés reintentar cuando quieras.`,
        });
      }

      const maxIntentos = result.intentosMaximos ?? 1;
      const usados = result.intentosUsados ?? result.intentoNumero;
      const agotoIntentos =
        !result.aprobado &&
        !pendienteCorreccion &&
        result.puedeReintentar !== true &&
        typeof usados === "number" &&
        usados >= maxIntentos;

      setEstado((prev) =>
        prev
          ? {
              ...prev,
              puedeRealizar: result.puedeReintentar === true,
              intentosUsados: usados ?? prev.intentosUsados,
              intentosMaximos: maxIntentos,
              intentosAgotados: agotoIntentos,
              puedeRevisar: result.puedeRevisar === true,
              mensajeBloqueo: agotoIntentos ? result.mensaje : undefined,
              ultimoIntento: intentoResultado,
            }
          : prev
      );
    },
    []
  );

  const submitExamAttempt = useCallback(
    async (motivo: "tiempo" | "abandono" | "envio") => {
      if (!exam || !estado?.idExamen) return;
      if (submittingRef.current) return;

      const questions = displayQuestionsRef.current;
      const currentAnswers = answersRef.current;
      const currentTextAnswers = textAnswersRef.current;

      submittingRef.current = true;
      setSubmitting(true);
      try {
        const respuestas =
          motivo === "envio"
            ? buildSubmissionPayload(questions, currentAnswers, currentTextAnswers)
            : buildForcedClosePayload(questions, currentAnswers, currentTextAnswers);

        const result = await ExamService.submitExam({
          idExamen: estado.idExamen,
          idFormacion: formacionId,
          respuestas,
          motivoCierre: motivo,
        });

        if (userId) clearExamDraft(userId, estado.idExamen);
        applySubmitResult(result, motivo);
      } catch (error: unknown) {
        console.error("Error submitting exam:", error);
        // Sin conexión las respuestas siguen guardadas en el dispositivo y se reenvían al reconectar
        if (!navigator.onLine) {
          toast.error("Sin conexión", {
            description:
              motivo === "tiempo"
                ? "Tus respuestas están guardadas. La evaluación se enviará cuando vuelva la conexión."
                : "Tus respuestas están guardadas. Intentá enviar de nuevo cuando vuelva la conexión.",
          });
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo enviar la evaluación. Intentá nuevamente.";
        toast.error("Error al enviar", { description: message });
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [applySubmitResult, exam, estado?.idExamen, formacionId, userId]
  );

  // Contador mientras se rinde, calculado contra la hora límite para no desfasarse.
  // Se congela mientras se envía: el alumno ya finalizó y no debe ver correr el tiempo
  useEffect(() => {
    if (phase !== "taking" || deadline == null || submitting) return;

    const tick = () =>
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    const timerId = window.setInterval(tick, 1000);

    return () => window.clearInterval(timerId);
  }, [phase, deadline, submitting]);

  // Al llegar a 0, cerrar y registrar intento (si no hay conexión, se reintenta al reconectar)
  useEffect(() => {
    if (phase === "taking" && remainingSeconds === 0 && isOnline && !submittingRef.current) {
      void submitExamAttempt("tiempo");
    }
  }, [phase, remainingSeconds, isOnline, submitExamAttempt]);

  // Respaldo local de cada respuesta mientras se rinde
  useEffect(() => {
    if (phase !== "taking" || !userId || !activeExamId || deadline == null) return;
    saveExamDraft(userId, { idExamen: activeExamId, deadline, answers, textAnswers });
  }, [phase, userId, activeExamId, deadline, answers, textAnswers]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Mientras se rinde: avisar antes de recargar o cerrar la pestaña, y pedir confirmación al tocar "atrás"
  useEffect(() => {
    if (phase !== "taking") return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    // Entrada duplicada en el historial para interceptar el botón "atrás" del navegador
    window.history.pushState(window.history.state, "", window.location.href);
    const onPopState = () => {
      window.history.pushState(window.history.state, "", window.location.href);
      openCloseConfirm();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [phase, openCloseConfirm]);

  const handleSingleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }));
  };

  const handleMultipleToggle = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      return {
        ...prev,
        [questionId]: checked ? [...current, optionId] : current.filter((id) => id !== optionId),
      };
    });
  };

  const handleTextAnswerChange = (questionId: string, value: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const pendientes = countUnansweredQuestions(
      displayQuestionsRef.current,
      answersRef.current,
      textAnswersRef.current
    );
    if (pendientes > 0) {
      setConfirm({ kind: "unanswered", count: pendientes });
      return;
    }
    void submitExamAttempt("envio");
  };

  const confirmSubmitWithUnanswered = () => {
    setConfirm(null);
    void submitExamAttempt("envio");
  };

  const confirmAbandonExam = () => {
    setConfirm(null);
    void submitExamAttempt("abandono");
  };

  const handleVerExamenRealizado = async () => {
    const intentoId = lastResult?.id;
    if (!intentoId) {
      toast.error("No se encontró el registro del examen realizado.");
      return;
    }

    setShowVerExamenModal(true);
    setLoadingVerExamen(true);
    setExamenDetalle(null);

    try {
      setExamenDetalle(await ExamService.getExamenRealizadoDetalle(intentoId));
    } catch (error) {
      console.error("Error loading exam detail:", error);
      toast.error("No se pudo cargar el examen realizado", {
        description: getApiErrorMessage(error, "Intentá nuevamente más tarde."),
      });
      setShowVerExamenModal(false);
    } finally {
      setLoadingVerExamen(false);
    }
  };

  const goToCourse = () => navigate(courseUrl, { replace: true });

  const handleExit = () => {
    if (submitting) return;
    if (phase === "taking") {
      openCloseConfirm();
      return;
    }
    goToCourse();
  };

  /** Reintentar vuelve a la introducción para que el alumno vea los intentos que le quedan */
  const handleRetry = () => {
    setExam(null);
    setDisplayQuestions([]);
    void loadEstado();
  };

  const rules = getExamRules(estado);
  const title = estado?.titulo?.trim() || exam?.titulo?.trim() || "Evaluación de la formación";
  const examRequiereCorreccion = useMemo(
    () => hasDesarrolloQuestions(displayQuestions),
    [displayQuestions]
  );
  const answeredCount =
    displayQuestions.length -
    countUnansweredQuestions(displayQuestions, answers, textAnswers);
  const esperandoPublicacion =
    lastResult?.estado === "pendiente_correccion" || lastResultPublicacionManual;
  const puedeReintentar =
    !!lastResult &&
    !lastResult.aprobado &&
    !esperandoPublicacion &&
    estado?.examenHabilitado !== false &&
    !estado?.intentosAgotados &&
    estado?.puedeRealizar === true;
  const puedeVerDetalle =
    !!lastResult?.id && estado?.puedeRevisar === true && !esperandoPublicacion;

  return (
    <div className="min-h-dvh bg-slate-50 text-foreground dark:bg-gray-950">
      {/* Barra superior propia: sin menú de la app para que el alumno se concentre */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <img
            src={isDarkMode ? "/logo.webp" : "/logoNegro.png"}
            alt="EPEFI"
            className="w-10 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </p>
            {phase === "taking" && displayQuestions.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {answeredCount} de {displayQuestions.length} respondidas
              </p>
            )}
          </div>
          {phase === "taking" && remainingSeconds != null && (
            <div
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-semibold tabular-nums",
                remainingSeconds <= 60
                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                  : remainingSeconds <= 300
                    ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    : "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              )}
              aria-live="polite"
              aria-label="Tiempo restante"
            >
              <Timer className="h-4 w-4" />
              {formatExamCountdown(remainingSeconds)}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-slate-500"
            onClick={handleExit}
            disabled={submitting}
            aria-label={phase === "taking" ? "Salir de la evaluación" : "Volver al curso"}
            title={phase === "taking" ? "Salir de la evaluación" : "Volver al curso"}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {phase === "taking" && !isOnline && (
          <div className="border-t border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 text-xs text-amber-900 dark:text-amber-100 sm:text-sm">
              <WifiOff className="h-4 w-4 shrink-0" />
              Sin conexión. Podés seguir respondiendo: tus respuestas se guardan en este dispositivo.
            </p>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-28">
        {(phase === "loading" || phase === "starting") && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="text-sm text-slate-500">
              {phase === "starting" ? "Preparando la evaluación..." : "Cargando evaluación..."}
            </p>
          </div>
        )}

        {phase === "blocked" && blockReason && (
          <div className="mx-auto max-w-lg space-y-4 py-10">
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">{blockReason.title}</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                {blockReason.description}
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full gap-2" onClick={goToCourse}>
              <ArrowLeft className="h-4 w-4" />
              Volver al curso
            </Button>
          </div>
        )}

        {phase === "intro" && (
          <div className="mx-auto max-w-lg space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Revisá las condiciones antes de comenzar.
              </p>
            </div>
            <ExamStartSummary rules={rules} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={goToCourse}>
                Volver al curso
              </Button>
              <Button onClick={() => estado?.idExamen && void startExam(estado.idExamen)}>
                Comenzar evaluación
              </Button>
            </div>
          </div>
        )}

        {phase === "taking" && exam && (
          <div className="space-y-4">
            {examRequiereCorreccion && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                <Hourglass className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Esta evaluación se corrige manualmente
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  Incluye preguntas de desarrollo, por lo que al enviarla queda en espera de
                  corrección y vas a recibir la nota en las próximas horas.
                </AlertDescription>
              </Alert>
            )}

            {displayQuestions.map((question, index) => {
              const esDesarrollo = isDesarrolloQuestion(question);
              const isMultiple = isMultipleChoiceQuestion(question);
              const selected = answers[question.id] ?? [];
              const textoRespuesta = textAnswers[question.id] ?? "";

              return (
                <section
                  key={question.id}
                  className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 sm:text-base">
                    <span className="mr-2 text-orange-500">{index + 1}.</span>
                    {question.texto}
                  </p>
                  {question.imagenUrl ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
                      <img
                        src={question.imagenUrl}
                        alt={`Imagen de la pregunta ${index + 1}`}
                        className="max-h-80 w-full rounded object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {esDesarrollo
                      ? "Escribí tu respuesta. La corrige un docente."
                      : isMultiple
                        ? "Podés seleccionar más de una respuesta"
                        : "Seleccioná una respuesta"}
                  </p>

                  {esDesarrollo ? (
                    <Textarea
                      id={`exam-${question.id}-desarrollo`}
                      value={textoRespuesta}
                      onChange={(e) => handleTextAnswerChange(question.id, e.target.value)}
                      disabled={submitting}
                      rows={5}
                      placeholder="Escribí tu respuesta acá..."
                      className="min-h-[120px] resize-y"
                    />
                  ) : isMultiple ? (
                    <div className="space-y-2">
                      {question.opciones.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-start gap-3 rounded-md border border-transparent p-2 hover:border-slate-200 dark:hover:border-slate-600"
                        >
                          <Checkbox
                            id={`exam-${question.id}-${option.id}`}
                            checked={selected.includes(option.id)}
                            onCheckedChange={(checked) =>
                              handleMultipleToggle(question.id, option.id, checked === true)
                            }
                            disabled={submitting}
                          />
                          <Label
                            htmlFor={`exam-${question.id}-${option.id}`}
                            className="flex-1 cursor-pointer text-sm font-normal leading-snug"
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
                          className="flex items-start gap-3 rounded-md border border-transparent p-2 hover:border-slate-200 dark:hover:border-slate-600"
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`exam-${question.id}-${option.id}`}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor={`exam-${question.id}-${option.id}`}
                            className="flex-1 cursor-pointer text-sm font-normal leading-snug"
                          >
                            {option.texto}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {phase === "result" && lastResult && (
          <div className="mx-auto max-w-lg space-y-4 py-4">
            {esperandoPublicacion ? (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
                <Hourglass className="mx-auto h-12 w-12 text-amber-600" />
                <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                  Evaluación enviada
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {lastResultPublicacionManual && lastResult.estado !== "pendiente_correccion"
                    ? "Tu evaluación fue enviada. La nota será publicada por el administrador en las próximas horas."
                    : "Recibimos tus respuestas. La evaluación la corrige un docente y vas a ver la nota en las próximas horas."}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  No hace falta que la vuelvas a enviar.
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "space-y-2 rounded-xl border p-6 text-center",
                  lastResult.aprobado
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                    : "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30"
                )}
              >
                {lastResult.aprobado ? (
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                ) : (
                  <XCircle className="mx-auto h-12 w-12 text-orange-500" />
                )}
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {lastResult.aprobado ? "¡Aprobaste!" : "No aprobaste"}
                </p>
                <ExamResultDisplay result={lastResult} prominent />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {lastResult.aprobado
                    ? `Felicitaciones, alcanzaste la nota mínima de ${rules.notaMinima}.`
                    : estado?.intentosAgotados
                      ? estado.mensajeBloqueo ||
                        `Alcanzaste el máximo de ${rules.intentosMaximos} intentos. La evaluación quedó bloqueada.`
                      : `Necesitás al menos ${rules.notaMinima} para aprobar. Te ${rules.intentosRestantes === 1 ? "queda" : "quedan"} ${rules.intentosRestantes} ${rules.intentosRestantes === 1 ? "intento" : "intentos"}.`}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {puedeVerDetalle && (
                <Button variant="outline" className="gap-2" onClick={() => void handleVerExamenRealizado()}>
                  <FileText className="h-4 w-4" />
                  Ver examen realizado
                </Button>
              )}
              {puedeReintentar && (
                <Button variant="outline" className="gap-2" onClick={handleRetry}>
                  <RotateCcw className="h-4 w-4" />
                  Reintentar evaluación
                </Button>
              )}
              <Button onClick={goToCourse}>Volver al curso</Button>
            </div>
          </div>
        )}
      </main>

      {/* Acción principal fija abajo mientras se rinde */}
      {phase === "taking" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
            <Button variant="outline" disabled={submitting} onClick={openCloseConfirm}>
              Salir
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1 sm:ml-auto sm:flex-none">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Finalizar evaluación"
              )}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !submitting) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          {shownConfirm?.kind === "unanswered" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Tenés preguntas sin responder</AlertDialogTitle>
                <AlertDialogDescription>
                  {shownConfirm.count === 1
                    ? "Quedó 1 pregunta sin responder."
                    : `Quedaron ${shownConfirm.count} preguntas sin responder.`}{" "}
                  Si enviás ahora, se van a contar como incorrectas. ¿Querés enviar la evaluación
                  igual?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submitting}>Seguir respondiendo</AlertDialogCancel>
                <AlertDialogAction
                  disabled={submitting}
                  onClick={(e) => {
                    e.preventDefault();
                    confirmSubmitWithUnanswered();
                  }}
                >
                  Enviar igual
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Salir de la evaluación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Si salís ahora, se registrará como un intento perdido con las respuestas que
                  hayas marcado hasta el momento. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submitting}>Seguir rindiendo</AlertDialogCancel>
                <AlertDialogAction
                  disabled={submitting}
                  onClick={(e) => {
                    e.preventDefault();
                    confirmAbandonExam();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {submitting ? "Registrando..." : "Salir y registrar intento"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <VerExamenRealizadoModal
        open={showVerExamenModal}
        onOpenChange={setShowVerExamenModal}
        detalle={examenDetalle}
        loading={loadingVerExamen}
      />
    </div>
  );
}
