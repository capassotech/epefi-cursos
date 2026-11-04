import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  School,
  ChevronDown,
  Play,
  File,
  Info,
  FileText,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  buildPlaylist,
  clearCourseViewState,
  getDocumentUrl,
  isMobileViewport,
  openDocumentInNewTab,
  materialPath,
  pickResumeItem,
  readCourseViewState,
  readLastViewed,
  saveCourseViewState,
  type PlaylistItemType,
} from "@/lib/viewerPlaylist";
import { cn } from "@/lib/utils";
import { Curso, Materia, Modulo } from "@/types/types";
import CoursesService from "@/services/coursesService";
import { useStudentCourseContent } from "@/hooks/useStudentCourseContent";
import { queryClient, queryKeys } from "@/lib/queryClient";
import CourseExamSection from "@/components/CourseExamSection";
import { getMissingModuleIds } from "@/lib/courseModules";
import { getModulesForMateria } from "@/lib/courseModules";
import { useAuth } from "@/contexts/AuthContext";

const CourseDetailPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: courseContent, isPending: isCourseContentPending } =
    useStudentCourseContent(courseId, user?.uid);
  const [courseDetail, setCourseDetail] = useState<Curso | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
  const [loadingEnabledModules, setLoadingEnabledModules] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [loadingModulos, setLoadingModulos] = useState(true);
  // Si se vuelve de un material, se recupera cómo estaba el curso (materias abiertas y posición)
  const [restoreView] = useState(() => (courseId ? readCourseViewState(courseId) : null));
  const [expandedMaterias, setExpandedMaterias] = useState<string[]>(() => restoreView?.expanded ?? []);
  const [progress, setProgress] = useState<Record<string, Record<string, boolean>>>({});
  const [examProgressRevision, setExamProgressRevision] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const moduloRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedModuloId, setHighlightedModuloId] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDisabledModuleDialogOpen, setIsDisabledModuleDialogOpen] = useState(false);

  // Redirigir si el usuario está deshabilitado
  useEffect(() => {
    if (user && user.activo === false) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!courseContent) return;

    setCourseDetail(courseContent.curso);
    setMaterias(courseContent.materias ?? []);
    setModulos(courseContent.modulos ?? []);
    setProgress(courseContent.progreso ?? {});
    setEnabledModules(courseContent.modulos_habilitados ?? {});
  }, [courseContent]);

  useEffect(() => {
    const isInitialLoad = isCourseContentPending && !courseContent;
    setLoading(isInitialLoad);
    setLoadingMaterias(isInitialLoad);
    setLoadingModulos(isInitialLoad);
    setLoadingProgress(isInitialLoad);
    setLoadingEnabledModules(isInitialLoad);
  }, [isCourseContentPending, courseContent]);

  // Al volver de un material se recupera la posición; si no, el curso arranca desde arriba
  useEffect(() => {
    if (!restoreView) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [courseId, restoreView]);

  useEffect(() => {
    if (!restoreView || !courseId || loading) return;
    clearCourseViewState(courseId);
    requestAnimationFrame(() => {
      window.scrollTo({ top: restoreView.scrollY, behavior: 'instant' });
    });
  }, [restoreView, courseId, loading]);

  // Efecto para manejar el filtro de módulo desde la URL
  useEffect(() => {
    // Soporta tanto "modulo" como "module" para compatibilidad
    const moduloId = searchParams.get("modulo") || searchParams.get("module");
    
    if (!moduloId || modulos.length === 0 || materias.length === 0) {
      return;
    }

    // Encontrar el módulo y su materia correspondiente
    const modulo = modulos.find(m => m.id === moduloId);
    if (!modulo) {
      return;
    }

    const materiaId = modulo.id_materia;
    const materia = materias.find(m => m.id === materiaId);
    if (!materia) {
      return;
    }

    // Abrir automáticamente la materia si no está abierta
    setExpandedMaterias(prev => {
      if (!prev.includes(materiaId)) {
        return [...prev, materiaId];
      }
      return prev;
    });

    // Hacer scroll al módulo después de un pequeño delay para asegurar que el DOM esté actualizado
    // Aumentamos el delay para que primero se posicione al principio
    const scrollTimeout = setTimeout(() => {
      const moduloElement = moduloRefs.current[moduloId];
      if (moduloElement) {
        moduloElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Resaltar el módulo
        setHighlightedModuloId(moduloId);
        
        // Remover el resaltado después de 3 segundos
        setTimeout(() => {
          setHighlightedModuloId(null);
        }, 3000);
      }
    }, 800);

    return () => clearTimeout(scrollTimeout);
  }, [searchParams, modulos, materias]);


  /** Abre un documento o video en su propia página y guarda cómo estaba el curso para volver igual */
  const openMaterial = (modulo: Modulo, type: PlaylistItemType, index: number) => {
    if (enabledModules[modulo.id] === false) {
      setIsDisabledModuleDialogOpen(true);
      return;
    }
    if (!courseId) return;

    // En celular los PDF no se ven dentro de la página: además de ir al visor, se abre el documento
    // en una pestaña nueva en el mismo toque (si no, el navegador lo bloquea). Al volver, queda el visor con la lista.
    if (type === 'document' && isMobileViewport()) {
      const url = getDocumentUrl(modulo, index);
      if (url) openDocumentInNewTab(url);
    }

    saveCourseViewState(courseId, { scrollY: window.scrollY, expanded: expandedMaterias });
    navigate(materialPath(courseId, modulo.id, type, index), { state: { fromCourse: true } });
  };

  const handleOpenDocument = (modulo: Modulo, documentIndex: number = 0) =>
    openMaterial(modulo, 'document', documentIndex);

  const handleOpenVideo = (modulo: Modulo, videoIndex: number = 0) =>
    openMaterial(modulo, 'video', videoIndex);


  // Función para marcar contenido como completado
  const handleMarkAsCompleted = async (moduleId: string, contentIndex: number, contentType: 'video' | 'document') => {
    if (!user?.uid) return;

    try {
      const contentKey = `${moduleId}_${contentType}_${contentIndex}`;
      const moduleProgress = progress[moduleId] || {};
      const isCompleted = moduleProgress[contentKey] === true;

      // Actualizar el estado local primero para feedback inmediato
      const nextProgress = {
        ...progress,
        [moduleId]: {
          ...progress[moduleId],
          [contentKey]: !isCompleted,
        },
      };
      setProgress(nextProgress);

      if (courseId && user.uid) {
        queryClient.setQueryData(
          queryKeys.courseContent(courseId, user.uid),
          (old: typeof courseContent) =>
            old ? { ...old, progreso: nextProgress } : old
        );
      }

      // Llamar al backend
      await CoursesService.markContentAsCompleted(user.uid, moduleId, contentIndex, contentType, !isCompleted);
      setExamProgressRevision((r) => r + 1);
      if (user.uid) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.studentHome(user.uid),
        });
      }
    } catch (error) {
      console.error('Error marking content as completed:', error);
      // Revertir el cambio en caso de error
      const contentKey = `${moduleId}_${contentType}_${contentIndex}`;
      const moduleProgress = progress[moduleId] || {};
      const isCompleted = moduleProgress[contentKey] === true;
      setProgress(prev => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          [contentKey]: isCompleted
        }
      }));
    }
  };

  // Función para verificar si un contenido está completado
  const isContentCompleted = (moduleId: string, contentIndex: number, contentType: 'video' | 'document'): boolean => {
    const contentKey = `${moduleId}_${contentType}_${contentIndex}`;
    const moduleProgress = progress[moduleId] || {};
    return moduleProgress[contentKey] === true;
  };

  // "Continuar donde dejaste": último material abierto, o el primero pendiente
  const coursePlaylist = buildPlaylist(materias, modulos, enabledModules);
  const resume = pickResumeItem(
    coursePlaylist,
    user?.uid && courseId ? readLastViewed(user.uid, courseId) : null,
    (item) => isContentCompleted(item.moduloId, item.index, item.type)
  );

  // Calcular progreso del curso
  const calculateCourseProgress = (): { completed: number; total: number; percentage: number } => {
    let completed = 0;
    let total = 0;

    // Deduplicar el array global de módulos por ID antes de contar, por si el mismo
    // ID aparece en el array de módulos de más de una materia en Firestore.
    const seenIds = new Set<string>();
    const uniqueModulos = modulos.filter((m) => {
      if (seenIds.has(m.id)) return false;
      seenIds.add(m.id);
      return true;
    });

    materias.forEach(materia => {
      const materiasModulos = uniqueModulos
        .filter(modulo => modulo.id_materia === materia.id)
        .filter(modulo => enabledModules[modulo.id] !== false);

      materiasModulos.forEach(modulo => {
        // Contar videos
        if (modulo.url_video) {
          const videos = Array.isArray(modulo.url_video) ? modulo.url_video : [modulo.url_video];
          videos.forEach((_, index) => {
            total++;
            if (isContentCompleted(modulo.id, index, 'video')) {
              completed++;
            }
          });
        }

        // Contar documentos
        if (modulo.url_archivo) {
          const documents = modulo.url_archivo.includes('|||') 
            ? modulo.url_archivo.split('|||').filter(url => url.trim())
            : [modulo.url_archivo];
          documents.forEach((_, index) => {
            total++;
            if (isContentCompleted(modulo.id, index, 'document')) {
              completed++;
            }
          });
        }
      });
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  // Función para formatear fechas
  const formatDate = (date: string | Date | any | undefined): string => {
    if (!date) return "";
    
    try {
      let dateObj: Date | null = null;
      
      // Si es null o undefined, retornar vacío
      if (date === null || date === undefined) {
        return "";
      }
      
      // Si es un string vacío, retornar vacío
      if (typeof date === "string" && date.trim() === "") {
        return "";
      }
      
      // Si es un Timestamp de Firestore con toDate (verificar primero)
      if (date && typeof date === "object" && typeof date.toDate === "function") {
        try {
          dateObj = date.toDate();
        } catch (e) {
          console.warn("Error calling toDate():", e);
        }
      }
      
      // Si es un objeto con seconds (Timestamp de Firestore serializado)
      if (!dateObj && date && typeof date === "object" && typeof date.seconds === "number") {
        dateObj = new Date(date.seconds * 1000);
      }
      
      // Si tiene _seconds (otro formato de Timestamp)
      if (!dateObj && date && typeof date === "object" && typeof date._seconds === "number") {
        dateObj = new Date(date._seconds * 1000);
      }
      
      // Si es un objeto Date, usar directamente
      if (!dateObj && date instanceof Date) {
        dateObj = date;
      }
      
      // Si es un número (timestamp en milisegundos)
      if (!dateObj && typeof date === "number" && !isNaN(date) && date > 0) {
        dateObj = new Date(date);
      }
      
      // Si es un string, intentar parsear
      if (!dateObj && typeof date === "string") {
        // Intentar parsear como ISO string
        dateObj = new Date(date);
        // Si no es válido, intentar otros formatos
        if (isNaN(dateObj.getTime())) {
          // Intentar parsear como timestamp numérico
          const numDate = Number(date);
          if (!isNaN(numDate) && numDate > 0) {
            dateObj = new Date(numDate);
          } else {
            return "";
          }
        }
      }
      
      // Si es un objeto con método getTime, intentar crear Date
      if (!dateObj && date && typeof date.getTime === "function") {
        try {
          dateObj = new Date(date.getTime());
        } catch (e) {
          console.warn("Error creating Date from getTime():", e);
        }
      }
      
      // Último intento: convertir directamente
      if (!dateObj) {
        try {
          dateObj = new Date(date);
        } catch (e) {
          console.warn("Error creating Date:", e);
        }
      }
      
      // Validar que sea una fecha válida
      if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        console.warn("Fecha inválida o no pudo ser parseada:", date);
        return "";
      }
      
      return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "";
    }
  };


  // Componente Skeleton para el loading
  const CourseSkeleton = () => (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header Skeleton */}
      <header className="relative border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 lg:px-6">
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-5 w-48 sm:w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-6">
          {/* Contenido principal skeleton */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4 sm:mb-5 animate-pulse"></div>
              
              {/* Skeleton de materias */}
              <div className="space-y-2.5 sm:space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 sm:px-5 py-3.5 sm:py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                      </div>
                      <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );

  // Mostrar skeleton mientras se carga el curso, las materias o los módulos
  const isLoadingContent = loading || loadingMaterias || loadingModulos;
  
  if (isLoadingContent) {
    return <CourseSkeleton />;
  }

  if (!courseDetail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Curso no encontrado</p>
          <Button variant="outline" onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="relative border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-300"
            // Destino fijo: "atrás" en el historial podía caer en otra copia del curso
            // (por ejemplo, al volver de una evaluación) y la pantalla no cambiaba
            onClick={() => navigate("/")}
            aria-label="Volver a mis cursos"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-[11px] sm:text-[13px] uppercase tracking-wider text-orange-500">Curso</p>
            <h1 className="text-base sm:text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100" data-testid="course-title">
              {courseDetail.titulo}
            </h1>
            {/* Fechas de dictado */}
            {(courseDetail.fechaInicioDictado || courseDetail.fechaFinDictado) && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 sm:mt-1.5 sm:block sm:space-y-0.5">
                {courseDetail.fechaInicioDictado && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium">Inicio:</span>
                    <span>{formatDate(courseDetail.fechaInicioDictado)}</span>
                  </div>
                )}
                {courseDetail.fechaFinDictado && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium">Fin:</span>
                    <span>{formatDate(courseDetail.fechaFinDictado)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400"
            onClick={() => setIsInfoModalOpen(true)}
            aria-label="Información del curso"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl py-4 sm:py-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Barra de progreso fija — sin márgenes negativos (evita glitch sticky en mobile) */}
          {!loadingProgress && !loadingModulos && !loadingEnabledModules && materias.length > 0 && (() => {
            const courseProgress = calculateCourseProgress();
            
            // Función para determinar el color según el progreso
            const getProgressColor = (percentage: number): string => {
              if (percentage < 34) {
                // Rojo para bajo progreso (0-33%)
                return "bg-gradient-to-r from-red-400 to-red-500";
              } else if (percentage < 67) {
                // Amarillo para progreso medio (34-66%)
                return "bg-gradient-to-r from-yellow-400 to-yellow-500";
              } else {
                // Verde para alto progreso (67-100%)
                return "bg-gradient-to-r from-green-400 to-green-500";
              }
            };

            return (
              <section className="sticky top-[72px] z-30 bg-white dark:bg-slate-900 py-3 px-4 lg:px-6 shadow-sm border-b border-slate-200 dark:border-slate-700 space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Progreso</span>
                  <span className="text-slate-600 dark:text-slate-400 tabular-nums">
                    {courseProgress.percentage}% completado
                  </span>
                </div>
                {/* Barra de progreso - más delgada en mobile */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 sm:h-3 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(courseProgress.percentage)} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${courseProgress.percentage}%` }}
                  />
                </div>
              </section>
            );
          })()}

          <div className="flex flex-col gap-6 px-4 lg:px-6">
          {resume && (() => {
            const modulo = modulos.find((m) => m.id === resume.item.moduloId);
            if (!modulo) return null;
            const allDone = !resume.isLast && isContentCompleted(resume.item.moduloId, resume.item.index, resume.item.type);
            const label = resume.isLast
              ? 'Continuá donde dejaste'
              : allDone
                ? 'Repasar el curso'
                : resume.item.key === coursePlaylist[0]?.items[0]?.key
                  ? 'Empezá el curso'
                  : 'Seguí con lo pendiente';
            const ResumeIcon = resume.item.type === 'video' ? Play : FileText;
            return (
              <button
                type="button"
                onClick={() => openMaterial(modulo, resume.item.type, resume.item.index)}
                className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-left text-white shadow-lg shadow-orange-500/20 transition hover:shadow-xl hover:shadow-orange-500/30 sm:gap-5 sm:p-6"
              >
                {/* Brillo decorativo */}
                <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
                <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-orange-600 shadow-md transition group-hover:scale-105 sm:h-16 sm:w-16">
                  <ResumeIcon className={cn("h-7 w-7 sm:h-8 sm:w-8", resume.item.type === 'video' && "ml-1")} fill={resume.item.type === 'video' ? 'currentColor' : 'none'} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-white/80">{label}</span>
                  <span className="mt-0.5 block text-base font-semibold leading-snug line-clamp-2 sm:text-lg">{resume.item.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-white/80 sm:text-sm">{modulo.titulo}</span>
                </span>
                <ChevronDown className="relative hidden h-6 w-6 shrink-0 -rotate-90 transition group-hover:translate-x-1 sm:block" />
              </button>
            );
          })()}
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 px-1">
              <School className="h-4 w-4 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Contenido</h2>
            </div>

            {materias.length > 0 ? (
              <Accordion 
                type="multiple" 
                className="w-full space-y-2.5 sm:space-y-3"
                value={expandedMaterias}
                onValueChange={setExpandedMaterias}
              >
                {materias
                  .filter((materia) => (materia.modulos?.length ?? 0) > 0)
                  .map((materia) => {
                    const materiasModulos = getModulesForMateria(materia, modulos);
                    const missingModuleIds = getMissingModuleIds(materia, modulos);

                  return (
                    <AccordionItem
                      key={materia.id}
                      value={materia.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 sm:px-5 bg-white dark:bg-slate-900/70"
                    >
                          <AccordionTrigger className="hover:no-underline py-5 sm:py-4 min-h-[64px] sm:min-h-0 [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-4 sm:[&>svg]:w-4">
                            <div className="flex items-center gap-3 text-left w-full">
                              <div className="h-2.5 w-2.5 sm:h-2 sm:w-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <span
                                  className="text-base font-medium text-slate-900 dark:text-slate-100 leading-snug block line-clamp-2 sm:truncate"
                                  title={materia.nombre}
                                >
                                  {materia.nombre}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pb-4 sm:pb-5 pt-0">
                            {loadingEnabledModules ? (
                              <div className="space-y-3 sm:space-y-3.5 sm:px-5">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Cargando módulos...</p>
                              </div>
                            ) : materiasModulos.length > 0 || missingModuleIds.length > 0 ? (
                              <div className="space-y-3 sm:space-y-3.5 sm:px-5">
                                {materiasModulos.map((modulo) => (
                                  <div
                                    key={modulo.id}
                                    ref={(el) => {
                                      moduloRefs.current[modulo.id] = el;
                                    }}
                                  >
                                    <ModuleItem 
                                      modulo={modulo} 
                                      handleOpenDocument={handleOpenDocument} 
                                      handleOpenVideo={handleOpenVideo}
                                      isHighlighted={highlightedModuloId === modulo.id}
                                      isEnabled={enabledModules[modulo.id] !== false}
                                      isContentCompleted={isContentCompleted}
                                      handleMarkAsCompleted={handleMarkAsCompleted}
                                      onDisabledClick={() => setIsDisabledModuleDialogOpen(true)}
                                    />
                                  </div>
                                ))}
                                {missingModuleIds.map((moduleId) => (
                                  <div
                                    key={`missing-${moduleId}`}
                                    className="rounded-lg border border-dashed border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30 p-4"
                                  >
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                      Módulo no disponible
                                    </p>
                                    <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1">
                                      Este módulo está en la materia pero no está habilitado
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-4 sm:px-5 py-2 leading-relaxed">
                                No hay módulos disponibles para esta materia.
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
              </Accordion>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No hay materias asignadas a este curso.
                </p>
              </div>
            )}
          </section>

          {user?.uid && courseId && (
            <CourseExamSection
              key={courseId}
              courseId={courseId}
              coursePayload={courseDetail}
              progressRevision={examProgressRevision}
              modulos={modulos}
              materiaIds={materias.map((m) => m.id)}
              enabledModules={enabledModules}
              progress={progress}
            />
          )}

          {/* Documentos del curso: discretos, al final de la página */}
          {(courseDetail?.planDeEstudiosUrl || courseDetail?.fechasDeExamenesUrl) && (
            <section className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 sm:text-slate-500">
              {[
                { label: "Plan de estudios", url: courseDetail.planDeEstudiosUrl },
                { label: "Fechas de exámenes", url: courseDetail.fechasDeExamenesUrl },
              ]
                .filter((doc) => doc.url)
                .map((doc) => (
                  <a
                    key={doc.label}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      // Mobile: botón suave y cómodo de tocar. Desktop: enlace discreto
                      "flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-center font-medium transition-colors active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:active:bg-slate-800",
                      "sm:inline-flex sm:h-auto sm:gap-1.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-1 sm:font-normal sm:underline-offset-4 sm:hover:text-orange-500 sm:hover:underline sm:dark:bg-transparent sm:dark:hover:text-orange-400"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-orange-500 sm:hidden" />
                    <span className="leading-tight">{doc.label}</span>
                    <ExternalLink className="hidden h-3.5 w-3.5 sm:block" />
                  </a>
                ))}
            </section>
          )}
          </div>
        </div>
      </main>

      {/* Modal de información del curso */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Información del curso
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-4">
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {courseDetail?.descripcion || 'Descripción no disponible'}
            </p>
            
            {/* Fechas de dictado */}
            {(courseDetail?.fechaInicioDictado || courseDetail?.fechaFinDictado) && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Fechas de dictado
                </h3>
                <div className="space-y-1.5">
                  {courseDetail.fechaInicioDictado && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium min-w-[60px]">Inicio:</span>
                      <span>{formatDate(courseDetail.fechaInicioDictado)}</span>
                    </div>
                  )}
                  {courseDetail.fechaFinDictado && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium min-w-[60px]">Fin:</span>
                      <span>{formatDate(courseDetail.fechaFinDictado)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para módulos deshabilitados */}
      <Dialog open={isDisabledModuleDialogOpen} onOpenChange={setIsDisabledModuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Módulo no disponible
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-4">
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Este módulo aún no está disponible. Los módulos se habilitarán progresivamente según el plan de estudios.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Si tienes alguna consulta, por favor comunícate con tu profesor.
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

// Componente para cada módulo con descripción desplegable
const ModuleItem = ({ modulo, handleOpenDocument, handleOpenVideo, isHighlighted = false, isEnabled = true, isContentCompleted, handleMarkAsCompleted, onDisabledClick }: { modulo: Modulo; handleOpenDocument: (modulo: Modulo, index?: number) => void; handleOpenVideo: (modulo: Modulo, index?: number) => void; isHighlighted?: boolean; isEnabled?: boolean; isContentCompleted: (moduleId: string, contentIndex: number, contentType: 'video' | 'document') => boolean; handleMarkAsCompleted: (moduleId: string, contentIndex: number, contentType: 'video' | 'document') => Promise<void>; onDisabledClick?: () => void }) => {
  const [isModuleExpanded, setIsModuleExpanded] = useState(true);
  const [isDescOpen, setIsDescOpen] = useState(false);
  const descripcion = modulo.descripcion?.trim() || '';

  // Obtener array de documentos
  const getDocuments = (): string[] => {
    if (!modulo.url_archivo) return [];
    if (modulo.url_archivo.includes('|||')) {
      return modulo.url_archivo.split('|||').filter(url => url.trim());
    }
    return [modulo.url_archivo];
  };

  // Obtener array de videos
  const getVideos = (): string[] => {
    if (!modulo.url_video) return [];
    if (Array.isArray(modulo.url_video)) {
      return modulo.url_video;
    }
    return [modulo.url_video];
  };

  const documents = getDocuments();
  const videos = getVideos();

  const nombresArchivos: string[] = modulo.nombres_archivos
    ? (modulo.nombres_archivos.includes('|||')
        ? modulo.nombres_archivos.split('|||')
        : [modulo.nombres_archivos])
    : [];

  const nombresVideos: string[] = modulo.nombres_videos
    ? (modulo.nombres_videos.includes('|||')
        ? modulo.nombres_videos.split('|||')
        : [modulo.nombres_videos])
    : [];

  const getDocName = (index: number): string =>
    nombresArchivos[index]?.trim() || (documents.length > 1 ? `Documento ${index + 1}` : 'Documento');

  const getVidName = (index: number): string =>
    nombresVideos[index]?.trim() || (videos.length > 1 ? `Video ${index + 1}` : 'Video');

  // Verificar si todos los contenidos del módulo están completados
  const isModuleCompleted = (): boolean => {
    if (documents.length === 0 && videos.length === 0) {
      return true;
    }

    // Verificar que todos los documentos estén completados
    const allDocumentsCompleted = documents.every((_, index) => 
      isContentCompleted(modulo.id, index, 'document')
    );

    // Verificar que todos los videos estén completados
    const allVideosCompleted = videos.every((_, index) => 
      isContentCompleted(modulo.id, index, 'video')
    );

    // El módulo está completado solo si todos los contenidos están completados
    return allDocumentsCompleted && allVideosCompleted;
  };

  const moduleCompleted = isModuleCompleted();

  // Con un solo material no hace falta desplegar: se abre directo desde la fila del módulo
  const isSingleItem = documents.length + videos.length === 1;
  const singleIsVideo = isSingleItem && documents.length === 0;
  const singleCompleted =
    isSingleItem && isContentCompleted(modulo.id, 0, singleIsVideo ? 'video' : 'document');
  const openSingleItem = () => {
    if (!isEnabled) {
      onDisabledClick?.();
    } else if (singleIsVideo) {
      handleOpenVideo(modulo, 0);
    } else {
      handleOpenDocument(modulo, 0);
    }
  };

  return (
    <div className={cn(
      "flex min-w-0 items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-lg sm:rounded-md border transition-colors duration-200",
      !isEnabled 
        ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
        : isHighlighted 
          ? "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700 shadow-md ring-2 ring-orange-400 dark:ring-orange-500 ring-opacity-50" 
          : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50"
    )}>
      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0 hidden sm:block"></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (isSingleItem) {
              openSingleItem();
            } else if (!isEnabled && onDisabledClick) {
              onDisabledClick();
            } else {
              setIsModuleExpanded(!isModuleExpanded);
            }
          }}
          className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left min-h-[44px] sm:min-h-0"
        >
          <h4 className={cn(
            "text-[15px] sm:text-base font-medium leading-snug flex items-center gap-2 min-w-0 flex-1",
            !isEnabled
              ? "text-slate-500 dark:text-slate-400"
              : moduleCompleted 
                ? "text-green-600 dark:text-green-400" 
                : "text-slate-800 dark:text-slate-200"
          )}>
            {moduleCompleted && isEnabled && (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            )}
            {!isEnabled && (
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <span className="min-w-0 line-clamp-2 sm:truncate" title={modulo.titulo}>
              {modulo.titulo}
            </span>
            {descripcion && (
              <Tooltip open={isDescOpen} onOpenChange={setIsDescOpen}>
                <TooltipTrigger asChild>
                  {/* span y no button: queda dentro del botón que expande el módulo */}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Ver descripción del módulo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescOpen((open) => !open);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDescOpen((open) => !open);
                      }
                    }}
                    className="inline-flex flex-shrink-0 rounded-full p-1 sm:p-0.5 text-slate-400/70 transition-colors hover:text-slate-500 dark:text-slate-500/70 dark:hover:text-slate-400"
                  >
                    <Info className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-[min(24rem,calc(100vw-2rem))] text-xs font-normal leading-relaxed">
                  {descripcion}
                </TooltipContent>
              </Tooltip>
            )}
            {!isEnabled && (
              <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 ml-1">(No disponible)</span>
            )}
          </h4>
          {!isSingleItem && (
            <ChevronDown className={cn(
              "h-4 w-4 sm:h-5 sm:w-5 text-slate-500 dark:text-slate-400 transition-transform flex-shrink-0",
              isModuleExpanded && "rotate-180"
            )} />
          )}
        </button>
        {/* Material único en desktop: el botón va en la misma fila del título */}
        {isSingleItem && (
          <Button
            className={`hidden sm:flex h-8 px-3 text-sm font-medium items-center justify-center gap-1.5 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
              singleCompleted
                ? 'border border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30'
                : 'border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
            }`}
            onClick={openSingleItem}
            disabled={!isEnabled}
          >
            {singleCompleted ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            ) : singleIsVideo ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Ver
          </Button>
        )}
        </div>
        {(isModuleExpanded || isSingleItem) && (
          <>
            <div className={cn("flex flex-col gap-2.5 sm:gap-3 mt-3 sm:mt-4", isSingleItem && "sm:hidden")}>
          {documents.map((doc, index) => {
            const fileName = getDocName(index);
            const isDocCompleted = isContentCompleted(modulo.id, index, 'document');
            
            return (
              <div key={`doc-${index}`}>
                {/* Botón para móvil - con opción de marcar como visto */}
                <div className="w-full min-w-0 max-w-full sm:hidden flex items-center gap-2">
                  <Button
                    className={`min-w-0 max-w-full flex-1 overflow-hidden h-auto min-h-14 px-4 py-3 text-base font-medium flex items-center justify-center gap-2 transition-colors ${
                      !isEnabled
                        ? 'border border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-60'
                        : isDocCompleted
                          ? 'border border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/40'
                          : 'border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
                    }`}
                    onClick={() => {
                      if (!isEnabled && onDisabledClick) {
                        onDisabledClick();
                      } else {
                        handleOpenDocument(modulo, index);
                      }
                    }}
                    disabled={!isEnabled}
                    title={fileName}
                  >
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <span className="min-w-0 flex-1 text-left line-clamp-2 break-words leading-snug">{fileName}</span>
                  </Button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsCompleted(modulo.id, index, 'document');
                    }}
                    className={`h-14 w-14 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                      isDocCompleted
                        ? 'bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                    title={isDocCompleted ? 'Marcar como no visto' : 'Marcar como visto'}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                </div>
                {/* Card para desktop */}
                <div 
                  className={`hidden ${isSingleItem ? '' : 'sm:flex'} cursor-pointer items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isDocCompleted
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  role="button"
                  tabIndex={-1}
                  onClick={() => {
                    if (!isEnabled && onDisabledClick) {
                      onDisabledClick();
                    } else {
                      handleOpenDocument(modulo, index);
                    }
                  }}
                >
                  {isDocCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <File className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                  )}
                  <span 
                    className={`flex-1 text-sm font-medium min-w-0 line-clamp-2 break-words leading-snug ${
                      isDocCompleted
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                    title={fileName}
                  >
                    {fileName}
                  </span>
                  <Button
                    className={`h-8 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDocCompleted
                        ? 'border border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30'
                        : 'border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEnabled && onDisabledClick) {
                        onDisabledClick();
                      } else {
                        handleOpenDocument(modulo, index);
                      }
                    }}
                    disabled={!isEnabled}
                  >
                    {isDocCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                    Ver
                  </Button>
                </div>
              </div>
            );
          })}
          {videos.map((video, index) => {
            const videoName = getVidName(index);
            const isVideoCompleted = isContentCompleted(modulo.id, index, 'video');
            
            return (
              <div key={`video-${index}`}>
                {/* Botón para móvil - con opción de marcar como visto */}
                <div className="w-full min-w-0 max-w-full sm:hidden flex items-center gap-2">
                  <Button
                    className={`min-w-0 max-w-full flex-1 overflow-hidden h-auto min-h-14 px-4 py-3 text-base font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      !isEnabled
                        ? 'border border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-60'
                        : isVideoCompleted
                          ? 'border border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/40'
                          : 'border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
                    }`}
                    onClick={() => {
                      if (!isEnabled && onDisabledClick) {
                        onDisabledClick();
                      } else {
                        handleOpenVideo(modulo, index);
                      }
                    }}
                    disabled={!isEnabled}
                    title={videoName}
                  >
                    <Play className="h-5 w-5 flex-shrink-0" />
                    <span className="min-w-0 flex-1 text-left line-clamp-2 break-words leading-snug">{videoName}</span>
                  </Button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsCompleted(modulo.id, index, 'video');
                    }}
                    className={`h-14 w-14 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                      isVideoCompleted
                        ? 'bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                    title={isVideoCompleted ? 'Marcar como no visto' : 'Marcar como visto'}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                </div>
                {/* Card para desktop */}
                <div 
                  className={`hidden ${isSingleItem ? '' : 'sm:flex'} cursor-pointer items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isVideoCompleted
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  role="button"
                  tabIndex={-1}
                  onClick={() => {
                    if (!isEnabled && onDisabledClick) {
                      onDisabledClick();
                    } else {
                      handleOpenVideo(modulo, index);
                    }
                  }}
                >
                  {isVideoCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <Play className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                  )}
                  <span 
                    className={`flex-1 text-sm font-medium min-w-0 line-clamp-2 break-words leading-snug ${
                      isVideoCompleted
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                    title={videoName}
                  >
                    {videoName}
                  </span>
                  <Button
                    className={`h-8 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isVideoCompleted
                        ? 'border border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30'
                        : 'border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEnabled && onDisabledClick) {
                        onDisabledClick();
                      } else {
                        handleOpenVideo(modulo, index);
                      }
                    }}
                    disabled={!isEnabled}
                  >
                    {isVideoCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Ver
                  </Button>
                </div>
              </div>
            );
          })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
