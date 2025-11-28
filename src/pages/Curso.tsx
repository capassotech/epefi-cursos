import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  School,
  ChevronDown,
  Play,
  File,
  FileText,
  Calendar,
  Download,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Curso, Materia, Modulo } from "@/types/types";
import CoursesService from "@/services/coursesService";
import VideoModal from "@/components/video-modal";

const CourseDetailPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [courseDetail, setCourseDetail] = useState<Curso | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [loadingModulos, setLoadingModulos] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    description?: string;
    url: string;
    thumbnail?: string;
  } | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

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

  const handleDownloadFile = async (modulo: Modulo) => {
    if (!modulo.url_archivo) {
      console.error('No hay URL de archivo disponible');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = modulo.url_archivo;
      
      const fileName = `${modulo.titulo.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.${modulo.tipo_contenido}`;
      link.download = fileName;
      
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
    }
  };

  const handleViewPDF = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownloadPDF = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para formatear fechas
  const formatDate = (date: string | Date | any | undefined): string => {
    if (!date) return "";
    
    try {
      let dateObj: Date;
      
      if (typeof date === "string") {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (date && typeof date.toDate === "function") {
        dateObj = date.toDate();
      } else if (date && typeof date.getTime === "function") {
        dateObj = date;
      } else if (date && typeof date.seconds === "number") {
        dateObj = new Date(date.seconds * 1000);
      } else if (date && typeof date._seconds === "number") {
        dateObj = new Date(date._seconds * 1000);
      } else {
        dateObj = new Date(date);
      }
      
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return "";
      }
      
      return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const CourseInfoCard = ({ className = "" }) => (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900/70",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            Información del curso
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {courseDetail?.descripcion || 'Descripción no disponible'}
          </p>
        </div>
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cargando curso...</p>
        </div>
      </div>
    );
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
          <section className="space-y-4 lg:col-start-1 lg:row-start-1">
            {/* Documentos PDF */}
            {(courseDetail?.planDeEstudiosUrl || courseDetail?.fechasDeExamenesUrl) && (
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Documentos del curso</h2>
                </div>
                
                <div className="space-y-4">
                  {courseDetail.planDeEstudiosUrl && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Plan de Estudios
                          </p>
                          {courseDetail.planDeEstudiosFechaActualizacion && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Actualizado: {formatDate(courseDetail.planDeEstudiosFechaActualizacion)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleViewPDF(courseDetail.planDeEstudiosUrl!)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDownloadPDF(courseDetail.planDeEstudiosUrl!, `plan-de-estudios-${courseDetail.titulo}.pdf`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  )}

                  {courseDetail.fechasDeExamenesUrl && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Fechas de Exámenes
                          </p>
                          {courseDetail.fechasDeExamenesFechaActualizacion && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Actualizado: {formatDate(courseDetail.fechasDeExamenesFechaActualizacion)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleViewPDF(courseDetail.fechasDeExamenesUrl!)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDownloadPDF(courseDetail.fechasDeExamenesUrl!, `fechas-examenes-${courseDetail.titulo}.pdf`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Contenido del curso</h2>
            </div>

            {materias.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Materias y Módulos:</h3>

                  <Accordion type="multiple" className="w-full space-y-2.5 sm:space-y-3">
                    {materias.map((materia) => {
                      const materiasModulos = modulos.filter(modulo => modulo.id_materia === materia.id);

                      return (
                        <AccordionItem
                          key={materia.id}
                          value={materia.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 sm:px-5"
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
                              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-4 sm:px-5 py-2">
                                Cargando módulos...
                              </div>
                            ) : materiasModulos.length > 0 ? (
                              <div className="space-y-3 sm:space-y-3.5 px-4 sm:px-5">
                                {materiasModulos.map((modulo, index) => (
                                  <ModuleItem key={modulo.id} modulo={modulo} handleDownloadFile={handleDownloadFile} handleOpenVideo={handleOpenVideo} />
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
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {loadingMaterias ? "Cargando materias..." : "No hay materias asignadas a este curso."}
                </p>
              </div>
            )}
          </section>

          <CourseInfoCard className="lg:hidden" />

          <aside className="hidden lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:flex lg:flex-col lg:gap-6">
            <CourseInfoCard />
          </aside>
        </div>
      </main>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideo}
        content={selectedVideo}
      />
    </div>
  );
};

// Componente para cada módulo con descripción desplegable
const ModuleItem = ({ modulo, handleDownloadFile, handleOpenVideo }: { modulo: Modulo; handleDownloadFile: (modulo: Modulo) => void; handleOpenVideo: (modulo: Modulo) => void }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const descripcion = modulo.descripcion || '';
  const maxLength = 150; // Caracteres para mostrar antes del "Ver más"
  const shouldTruncate = descripcion.length > maxLength;
  const displayDesc = shouldTruncate && !isDescExpanded 
    ? descripcion.substring(0, maxLength) + '...'
    : descripcion;

  return (
    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-md bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
          {modulo.titulo}
        </h4>
        {descripcion && (
          <div className="mt-1.5 sm:mt-2">
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
          {modulo.url_archivo && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm"
              onClick={() => handleDownloadFile(modulo)}
            >
              <File className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Descargar .{modulo.tipo_contenido}
            </Button>
          )}
          {modulo.url_video && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 sm:h-8 px-3 sm:px-4 text-xs sm:text-sm"
              onClick={() => handleOpenVideo(modulo)}
            >
              <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Ver video
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
