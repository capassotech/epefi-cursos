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
  Loader2,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Curso, Materia, Modulo } from "@/types/types";
import CoursesService from "@/services/coursesService";
import VideoModal from "@/components/video-modal";

const CourseDetailPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const [courseDetail, setCourseDetail] = useState<Curso | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [loadingModulos, setLoadingModulos] = useState(true);
  const [expandedMaterias, setExpandedMaterias] = useState<string[]>([]);
  const moduloRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedModuloId, setHighlightedModuloId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    description?: string;
    url: string;
    thumbnail?: string;
  } | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await CoursesService.getCourseById(courseId);
        setCourseDetail(response.data);
      } catch (error) {
        console.error('Error fetching course:', error);
        setCourseDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    const fetchMaterias = async () => {
      if (!courseDetail?.materias || courseDetail.materias.length === 0) {
        setMaterias([]);
        setLoadingMaterias(false);
        return;
      }

      try {
        const materiasPromises = courseDetail.materias.map(async (materiaId) => {
          const responseMateria = await CoursesService.getMateriasByCourseId(materiaId);
          const materiaData = responseMateria.data;
          return Array.isArray(materiaData) ? materiaData : [materiaData];
        });

        const materiasArrays = await Promise.all(materiasPromises);
        const allMaterias = materiasArrays.flat();
        setMaterias(allMaterias);
        setLoadingMaterias(false);
      } catch (error) {
        console.error('Error fetching materias:', error);
        setMaterias([]);
        setLoadingMaterias(false);
      }
    };

    fetchMaterias();
  }, [courseDetail]);


  useEffect(() => {
    const fetchModulos = async () => {
      if (!materias || materias.length === 0) {
        setModulos([]);
        setLoadingModulos(false);
        return;
      }

      try {
        setLoadingModulos(true);
        const allModulosPromises: Promise<Modulo[]>[] = [];

        materias.forEach((materia) => {
          if (materia.modulos && materia.modulos.length > 0) {
            materia.modulos.forEach((moduloId) => {
              allModulosPromises.push(
                CoursesService.getModulosByMateriaId(moduloId).then((response) => {
                  const moduloData = response.data;
                  return Array.isArray(moduloData) ? moduloData : [moduloData];
                })
              );
            });
          }
        });

        const modulosArrays = await Promise.all(allModulosPromises);
        const allModulos = modulosArrays.flat();
        setModulos(allModulos);
        setLoadingModulos(false);
      } catch (error) {
        console.error('Error fetching modulos:', error);
        setModulos([]);
        setLoadingModulos(false);
      }
    };

    fetchModulos();
  }, [materias]);

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
    }, 500);

    return () => clearTimeout(scrollTimeout);
  }, [searchParams, modulos, materias]);


  const handleOpenVideo = (modulo: Modulo) => {
    setSelectedVideo({
      id: modulo.id,
      title: modulo.titulo,
      url: modulo.url_video,
      thumbnail: modulo.url_miniatura,
    });
    setIsVideoModalOpen(true);
  };

  const handleCloseVideo = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  // Función para detectar si es una URL de Google Drive
  const isGoogleDriveUrl = (url: string): boolean => {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    return urlLower.includes('drive.google.com') || 
           urlLower.includes('docs.google.com') ||
           urlLower.includes('googleusercontent.com') ||
           urlLower.startsWith('https://drive.google.com') ||
           urlLower.startsWith('http://drive.google.com');
  };

  const handleOpenDocument = (modulo: Modulo) => {
    if (!modulo.url_archivo) {
      console.error('No hay URL de archivo disponible');
      return;
    }

    // Detectar si es una URL de Google Drive
    if (isGoogleDriveUrl(modulo.url_archivo)) {
      // Para Google Drive, abrir en nueva pestaña
      window.open(modulo.url_archivo, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsDocumentLoading(true);
    setSelectedDocument({
      url: modulo.url_archivo,
      title: modulo.titulo,
    });
    setIsDocumentModalOpen(true);
  };

  const handleCloseDocument = () => {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
    setIsDocumentLoading(true);
  };

  const handleDocumentLoad = () => {
    setIsDocumentLoading(false);
  };

  // Verificar si el documento es de Google Drive cuando se selecciona
  useEffect(() => {
    if (selectedDocument && isGoogleDriveUrl(selectedDocument.url)) {
      // Si es Google Drive, abrir en nueva pestaña y cerrar el modal
      const url = selectedDocument.url;
      setIsDocumentModalOpen(false);
      setSelectedDocument(null);
      setIsDocumentLoading(true);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [selectedDocument]);

  // Función para formatear fechas
  const formatDate = (date: string | Date | any | undefined): string => {
    if (!date) return "";
    
    try {
      let dateObj: Date;
      
      // Si es un string, convertir a Date
      if (typeof date === "string") {
        dateObj = new Date(date);
      }
      // Si es un objeto Date, usar directamente
      else if (date instanceof Date) {
        dateObj = date;
      }
      // Si es un Timestamp de Firestore, usar toDate()
      else if (date && typeof date.toDate === "function") {
        dateObj = date.toDate();
      }
      // Si es un objeto con método getTime, intentar crear Date
      else if (date && typeof date.getTime === "function") {
        dateObj = date;
      }
      // Si es un objeto con seconds (Timestamp de Firestore serializado)
      else if (date && typeof date.seconds === "number") {
        dateObj = new Date(date.seconds * 1000);
      }
      // Si tiene _seconds (otro formato de Timestamp)
      else if (date && typeof date._seconds === "number") {
        dateObj = new Date(date._seconds * 1000);
      }
      // Intentar convertir directamente
      else {
        dateObj = new Date(date);
      }
      
      // Validar que sea una fecha válida
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
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
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 lg:px-6">
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

  if (loading) {
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
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-300"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-[13px] uppercase tracking-wider text-orange-500">Curso</p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100" data-testid="course-title">
              {courseDetail.titulo}
            </h1>
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

      <main className="mx-auto w-full max-w-6xl px-3 sm:px-4 py-4 sm:py-6 lg:px-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 px-1">
              <School className="h-4 w-4 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Contenido del curso</h2>
            </div>

            {materias.length > 0 ? (
              <Accordion 
                type="multiple" 
                className="w-full space-y-2.5 sm:space-y-3"
                value={expandedMaterias}
                onValueChange={setExpandedMaterias}
              >
                {materias.map((materia) => {
                  const materiasModulos = modulos.filter(modulo => modulo.id_materia === materia.id);

                  return (
                    <AccordionItem
                      key={materia.id}
                      value={materia.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 sm:px-5 bg-white dark:bg-slate-900/70"
                    >
                          <AccordionTrigger className="hover:no-underline py-3.5 sm:py-4">
                            <div className="flex items-center gap-3 text-left w-full">
                              <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-snug block">
                                  {materia.nombre}
                                </span>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                  {materiasModulos.length} módulo{materiasModulos.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pb-4 sm:pb-5 pt-0">
                            {loadingModulos ? (
                              <div className="space-y-3 sm:space-y-3.5 px-4 sm:px-5">
                                {[1, 2, 3].map((item) => (
                                  <div
                                    key={item}
                                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-md bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
                                  >
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1.5 sm:mt-2 animate-pulse"></div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                      <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                      <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
                                        <div className="h-7 sm:h-8 w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                        <div className="h-7 sm:h-8 w-20 sm:w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : materiasModulos.length > 0 ? (
                              <div className="space-y-3 sm:space-y-3.5 px-4 sm:px-5">
                                {materiasModulos.map((modulo, index) => (
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
                                    />
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
            ) : loadingMaterias ? (
              <div className="space-y-2.5 sm:space-y-3">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 sm:px-5 py-3.5 sm:py-4 bg-white dark:bg-slate-900/70"
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
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No hay materias asignadas a este curso.
                </p>
              </div>
            )}
          </section>

          {/* Sección de documentos del curso */}
          {(courseDetail?.planDeEstudiosUrl || courseDetail?.fechasDeExamenesUrl) && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-500" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Documentos del curso</h2>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="space-y-3">
                  {/* Plan de Estudios */}
                  {courseDetail.planDeEstudiosUrl && (
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                          Plan de Estudios
                        </h4>
                        {courseDetail.planDeEstudiosFechaActualizacion && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Última actualización: {formatDate(courseDetail.planDeEstudiosFechaActualizacion)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0"
                        asChild
                      >
                        <a
                          href={courseDetail.planDeEstudiosUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Ver
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Fechas de Exámenes */}
                  {courseDetail.fechasDeExamenesUrl && (
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                          Fechas de Exámenes
                        </h4>
                        {courseDetail.fechasDeExamenesFechaActualizacion && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Última actualización: {formatDate(courseDetail.fechasDeExamenesFechaActualizacion)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0"
                        asChild
                      >
                        <a
                          href={courseDetail.fechasDeExamenesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Ver
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
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
          <div className="pt-2">
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {courseDetail?.descripcion || 'Descripción no disponible'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideo}
        content={selectedVideo}
      />

      {/* Modal de documento a pantalla completa */}
      <Dialog open={isDocumentModalOpen} onOpenChange={handleCloseDocument}>
        <DialogContent className="!max-w-[100vw] !max-h-[100vh] !w-screen !h-screen !m-0 !p-0 !rounded-none !left-0 !top-0 !translate-x-0 !translate-y-0 !transform-none flex flex-col">
          <DialogHeader className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              {selectedDocument?.title || 'Documento'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Visualizador de documento PDF
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-0 min-h-0 relative">
            {isDocumentLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-950 z-10">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                    Cargando documento...
                  </p>
                </div>
              </div>
            )}
            {selectedDocument && !isGoogleDriveUrl(selectedDocument.url) && (
              <iframe
                src={selectedDocument.url}
                title={selectedDocument.title}
                className="w-full h-full"
                style={{ border: 'none', minHeight: 'calc(100vh - 80px)' }}
                onLoad={handleDocumentLoad}
                onError={() => {
                  // Si hay error al cargar, abrir en nueva pestaña
                  setIsDocumentLoading(false);
                  window.open(selectedDocument.url, '_blank', 'noopener,noreferrer');
                  handleCloseDocument();
                }}
              />
            )}
            {selectedDocument && isGoogleDriveUrl(selectedDocument.url) && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4">
                    Este documento se abrirá en una nueva pestaña
                  </p>
                  <Button
                    onClick={() => {
                      window.open(selectedDocument.url, '_blank', 'noopener,noreferrer');
                      handleCloseDocument();
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Abrir documento
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente para cada módulo con descripción desplegable
const ModuleItem = ({ modulo, handleOpenDocument, handleOpenVideo, isHighlighted = false }: { modulo: Modulo; handleOpenDocument: (modulo: Modulo) => void; handleOpenVideo: (modulo: Modulo) => void; isHighlighted?: boolean }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const descripcion = modulo.descripcion || '';
  const maxLength = 150; // Caracteres para mostrar antes del "Ver más"
  const shouldTruncate = descripcion.length > maxLength;
  const displayDesc = shouldTruncate && !isDescExpanded 
    ? descripcion.substring(0, maxLength) + '...'
    : descripcion;

  return (
    <div className={cn(
      "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-md border transition-all duration-500",
      isHighlighted 
        ? "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700 shadow-md ring-2 ring-orange-400 dark:ring-orange-500 ring-opacity-50" 
        : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50"
    )}>
      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
          {modulo.titulo}
        </h4>
        {descripcion && (
          <div className="hidden sm:block mt-1.5 sm:mt-2">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {displayDesc}
            </p>
            {shouldTruncate && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 mt-1.5 transition-colors flex items-center gap-1"
              >
                {isDescExpanded ? (
                  <>
                    Ver menos
                    <ChevronDown className="h-3 w-3 rotate-180" />
                  </>
                ) : (
                  <>
                    Ver más
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
          {modulo.url_archivo && (
            <Button
              className="h-11 sm:h-9 w-full sm:w-auto px-4 sm:px-4 text-sm sm:text-sm font-medium flex items-center justify-center gap-2 border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
              onClick={() => handleOpenDocument(modulo)}
            >
              <File className="h-4 w-4 sm:h-4 sm:w-4" />
              Leer documento
            </Button>
          )}
          {modulo.url_video && (
            <Button
              className="h-11 sm:h-9 w-full sm:w-auto px-4 sm:px-4 text-sm sm:text-sm font-medium flex items-center justify-center gap-2 border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
              onClick={() => handleOpenVideo(modulo)}
            >
              <Play className="h-4 w-4 sm:h-4 sm:w-4" />
              Ver video
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
