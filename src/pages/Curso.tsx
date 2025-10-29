import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  School,
  ChevronDown,
  Play,
  File,
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

  const CourseInfoCard = ({ className = "" }) => (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-orange-500" />
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Información del curso</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {courseDetail?.descripcion || 'Descripción no disponible'}
          </p>
          {courseDetail?.precio && (
            <p className="text-sm font-medium text-orange-600 dark:text-orange-300">
              Precio: ${courseDetail.precio}
            </p>
          )}
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
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Contenido del curso</h2>
            </div>

            {materias.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Materias y Módulos:</h3>

                  <Accordion type="multiple" className="w-full space-y-2">
                    {materias.map((materia) => {
                      const materiasModulos = modulos.filter(modulo => modulo.id_materia === materia.id);

                      return (
                        <AccordionItem
                          key={materia.id}
                          value={materia.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg px-3"
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-3 text-left">
                              <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                              <div>
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {materia.nombre}
                                </span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {materiasModulos.length} módulo{materiasModulos.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pb-3">
                            {loadingModulos ? (
                              <div className="text-xs text-slate-500 dark:text-slate-400 px-3">
                                Cargando módulos...
                              </div>
                            ) : materiasModulos.length > 0 ? (
                              <div className="space-y-2 px-3">
                                {materiasModulos.map((modulo, index) => (
                                  <div
                                    key={modulo.id}
                                    className="flex items-start gap-3 p-2 rounded-md bg-slate-50 dark:bg-slate-800/30"
                                  >
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                        {modulo.titulo}
                                      </h4>
                                      {modulo.descripcion && (
                                        <p className="text-xs hidden md:block text-slate-600 dark:text-slate-400 mt-1">
                                          {modulo.descripcion}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-3 mt-1">
                                        {modulo.url_archivo && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => handleDownloadFile(modulo)}
                                          >
                                            <File className="h-3 w-3 mr-1" />
                                            Descargar archivo .{modulo.tipo_contenido}
                                          </Button>
                                        )}
                                        {modulo.url_video && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => handleOpenVideo(modulo)}
                                          >
                                            <Play className="h-3 w-3 mr-1" />
                                            Ver video
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 dark:text-slate-400 px-3">
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

export default CourseDetailPage;
