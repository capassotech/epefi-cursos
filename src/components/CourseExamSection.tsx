import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  ClipboardCheck,
  Clock,
  Loader2,
  Lock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import axios from "axios";
import { resolveFormacionId } from "@/lib/formacionId";
import { getExamBlockReason, getExamRules } from "@/lib/examUtils";
import {
  getCourseContentProgress,
  getVisibleModulesProgress,
  isVisibleCourseProgressComplete,
  type ModuleProgressMap,
} from "@/lib/courseProgress";
import ExamService, { getApiErrorMessage } from "@/services/examService";
import VerExamenRealizadoModal from "@/components/VerExamenRealizadoModal";
import { ExamResultDisplay, ExamStartSummary } from "@/components/exam/ExamParts";
import type { Modulo } from "@/types/types";
import type { ExamEstado, ExamRealizadoDetalle } from "@/types/exam";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const [loadingEstado, setLoadingEstado] = useState(true);
  const [estado, setEstado] = useState<ExamEstado | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showVerExamenModal, setShowVerExamenModal] = useState(false);
  const [examenDetalle, setExamenDetalle] = useState<ExamRealizadoDetalle | null>(null);
  const [loadingVerExamen, setLoadingVerExamen] = useState(false);
  /** Verificando con el backend que se pueda comenzar */
  const [checkingStart, setCheckingStart] = useState(false);
  /** Aviso previo con tiempo e intentos antes de ir a la página de la evaluación */
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);

  const formacionId = useMemo(
    () => resolveFormacionId(coursePayload, courseId),
    [coursePayload, courseId]
  );

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

  /** Verifica con datos frescos que se pueda rendir y muestra el aviso previo */
  const requestStart = useCallback(async () => {
    if (!formacionId) return;

    setCheckingStart(true);
    try {
      const fresh = await ExamService.getExamEstado(formacionId);
      setEstado(fresh);

      const reason = getExamBlockReason(fresh);
      if (reason) {
        toast.error(reason.title, { description: reason.description });
        return;
      }

      const readyNow = isVisibleCourseProgressComplete(
        modulos,
        materiaIds,
        enabledModules,
        progress
      );
      if (!fresh.puedeRealizar && !readyNow) {
        toast.error("Evaluación no disponible", {
          description:
            "Debés completar todos los contenidos de cada módulo. Revisá el progreso del curso.",
        });
        return;
      }

      setStartConfirmOpen(true);
    } catch (error) {
      console.error("Error refreshing exam estado:", error);
      toast.error("No se pudo verificar la evaluación", {
        description: getApiErrorMessage(error, "Intentá nuevamente."),
      });
    } finally {
      setCheckingStart(false);
    }
  }, [formacionId, modulos, materiaIds, enabledModules, progress]);

  const goToExam = () => {
    setStartConfirmOpen(false);
    navigate(
      `/curso/${courseId}/evaluacion?formacion=${encodeURIComponent(formacionId)}`,
      { state: { autoStart: true } }
    );
  };

  const handleVerExamenRealizado = useCallback(async () => {
    const intentoId = estado?.ultimoIntento?.id;
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
  }, [estado?.ultimoIntento?.id]);

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

  const rules = getExamRules(estado);
  const { notaMinima, intentosMaximos, intentosUsados, intentosRestantes } = rules;
  const ultimoIntento = estado?.ultimoIntento ?? null;
  const passed = ultimoIntento?.aprobado === true;
  const tieneIntento = ultimoIntento != null;
  /** Con preguntas de desarrollo el intento espera corrección manual. */
  const esperandoCorreccion = ultimoIntento?.estado === "pendiente_correccion";
  const intentosAgotados = estado?.intentosAgotados === true;
  const examenHabilitado = estado?.examenHabilitado !== false;
  /** El backend decide: aprobó, agotó intentos o el admin se lo habilitó. */
  const puedeVerDetalle = Boolean(
    estado?.puedeRevisar && !esperandoCorreccion && tieneIntento && ultimoIntento?.id
  );
  const canShowButton =
    examenHabilitado &&
    !passed &&
    !esperandoCorreccion &&
    !intentosAgotados &&
    !!estado?.idExamen &&
    (estado.puedeRealizar === true || locallyReady);

  const sectionTitle = estado?.titulo?.trim() || "Evaluación de la formación";

  /** Mensaje breve y cercano según dónde está parado el alumno */
  const statusMessage = passed
    ? "¡Aprobaste esta evaluación!"
    : esperandoCorreccion
      ? "Tu evaluación está en corrección."
      : !examenHabilitado
        ? "Todavía no está disponible."
        : intentosAgotados
          ? "Ya usaste todos los intentos disponibles."
          : canShowButton && !tieneIntento
            ? locallyReady
              ? "¡Completaste el curso! Ya podés rendir la evaluación final."
              : "La evaluación ya está disponible. Podés rendirla cuando quieras."
            : tieneIntento
              ? `Te ${intentosRestantes === 1 ? "queda" : "quedan"} ${intentosRestantes} ${intentosRestantes === 1 ? "intento" : "intentos"}.`
              : "";

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
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="flex items-center gap-3 p-4 sm:p-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-50 dark:bg-orange-950/40">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </span>
            <div>
              <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                Cargando evaluación
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Estamos consultando tu estado y tus intentos…
              </p>
            </div>
          </CardContent>
        </Card>
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

        <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
          {/* Franja de acento según el estado */}
          <div
            className={cn(
              "h-1",
              passed
                ? "bg-green-500"
                : intentosAgotados || !examenHabilitado
                  ? "bg-slate-300 dark:bg-slate-700"
                  : "bg-gradient-to-r from-orange-400 to-orange-600"
            )}
          />
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-sm sm:h-12 sm:w-12",
                    passed
                      ? "bg-green-500 text-white"
                      : intentosAgotados || !examenHabilitado
                        ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        : "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                  )}
                >
                  {passed ? (
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : intentosAgotados || !examenHabilitado ? (
                    <Lock className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </span>
                <div className="min-w-0 space-y-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {sectionTitle}
                    </h3>
                    {statusMessage && (
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{statusMessage}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { icon: Clock, label: `${rules.duracionMinutos} min` },
                      { icon: RotateCcw, label: `Intentos ${intentosUsados} de ${intentosMaximos}` },
                      { icon: Award, label: `Nota mínima ${notaMinima}` },
                    ].map(({ icon: Icon, label }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                      >
                        <Icon className="h-3.5 w-3.5 text-orange-500" />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {canShowButton && !tieneIntento && (
                <Button
                  size="lg"
                  className="h-14 sm:h-11 w-full shrink-0 gap-2 text-base sm:text-sm sm:w-auto"
                  onClick={() => void requestStart()}
                  disabled={checkingStart}
                >
                  {checkingStart ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Realizar evaluación
                </Button>
              )}
            </div>

            {!examenHabilitado && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Evaluación no disponible
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {estado?.mensajeBloqueo ||
                    "Esta evaluación aún no está disponible. Las evaluaciones se habilitarán según el plan de estudios. Si tenés alguna consulta, comunicate con tu profesor."}
                </AlertDescription>
              </Alert>
            )}

            {examenHabilitado && intentosAgotados && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
                <Lock className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-900 dark:text-red-100">
                  Evaluación bloqueada
                </AlertTitle>
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {estado?.mensajeBloqueo ||
                    `Alcanzaste el máximo de ${intentosMaximos} intentos. Ya no podés volver a realizar esta evaluación.`}
                </AlertDescription>
              </Alert>
            )}

            {esperandoCorreccion && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <div className="flex items-start gap-3">
                  <Hourglass className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-amber-900 dark:text-amber-100">
                        Evaluación enviada
                      </p>
                      <Badge
                        variant="outline"
                        className="border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-200"
                      >
                        En espera de corrección
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Tu evaluación fue enviada correctamente y la corrige un docente. Vas a
                      ver la nota y el resultado en las próximas horas.
                    </p>
                    {ultimoIntento?.intentoNumero != null && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Intento {ultimoIntento.intentoNumero}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tieneIntento && !esperandoCorreccion && (
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
                    {!passed && !intentosAgotados && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No alcanzaste la nota mínima. Te{" "}
                        {intentosRestantes === 1 ? "queda" : "quedan"}{" "}
                        {intentosRestantes}{" "}
                        {intentosRestantes === 1 ? "intento" : "intentos"}.
                      </p>
                    )}
                    {!passed && intentosAgotados && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No alcanzaste la nota mínima y usaste los {intentosMaximos}{" "}
                        intentos disponibles.
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
                    <Button
                      className="w-full sm:w-auto gap-2"
                      onClick={() => void requestStart()}
                      disabled={checkingStart}
                    >
                      {checkingStart ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Reintentar evaluación
                    </Button>
                  )}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </section>

      <AlertDialog open={startConfirmOpen} onOpenChange={setStartConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Comenzar la evaluación?</AlertDialogTitle>
            <AlertDialogDescription>
              {sectionTitle}. Revisá las condiciones antes de empezar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ExamStartSummary rules={rules} />
          <AlertDialogFooter>
            <AlertDialogCancel>Ahora no</AlertDialogCancel>
            <AlertDialogAction onClick={goToExam}>Comenzar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VerExamenRealizadoModal
        open={showVerExamenModal}
        onOpenChange={setShowVerExamenModal}
        detalle={examenDetalle}
        loading={loadingVerExamen}
      />
    </>
  );
}
