import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Loader2, Play, Calendar } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useNavigate } from "react-router-dom";
import { buildCourseUrl, Course } from "@/data/courses";
import CoursesService from "@/services/coursesService";
import { useAuth } from "@/contexts/AuthContext";
import VideoModal from "@/components/video-modal";
import CourseLoader from "@/components/CourseLoader";

// Componente para la tarjeta de curso con manejo de carga de imagen
const CourseCard = ({ course, onNavigate, onOpenVideo, formatDate }: { 
  course: Course; 
  onNavigate: (url: string) => void;
  onOpenVideo: (course: Course) => void;
  formatDate: (date: string | Date | any | undefined) => string;
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const imageSrc = course.imagen === "" || imageError ? "/placeholder.svg" : course.imagen;
  
  return (
    <Card
      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onNavigate(buildCourseUrl(course.id))}
    >
      <CardContent className="p-0 flex flex-row sm:flex-row h-auto sm:h-[200px]">
        {/* Imagen del curso - pequeña en mobile */}
        <div className="w-24 sm:w-1/3 h-24 sm:h-full relative overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <img
                src="/placeholder.svg"
                alt="Cargando..."
                className="w-full h-full object-cover opacity-50"
              />
            </div>
          )}
          <img
            src={imageSrc}
            alt={course.titulo}
            className={`object-cover w-full h-full transition-opacity duration-300 hover:scale-105 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </div>
        {/* Contenido del curso */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
          <div className="mb-2 sm:mb-4">
            <h3 className="font-bold text-sm sm:text-lg text-gray-900 dark:text-gray-100 break-words line-clamp-2">
              {course.titulo}
            </h3>
            
            {/* Fechas de dictado - siempre visibles en mobile */}
            {(course.fechaInicioDictado || course.fechaFinDictado) && (
              <div className="mt-1.5 sm:mt-2 space-y-1 sm:space-y-0">
                {course.fechaInicioDictado && (
                  <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="font-medium">Inicio:</span>
                    <span>{formatDate(course.fechaInicioDictado)}</span>
                  </div>
                )}
                {course.fechaFinDictado && (
                  <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 opacity-0 sm:opacity-100" />
                    <span className="font-medium">Fin:</span>
                    <span>{formatDate(course.fechaFinDictado)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Botón de video - siempre visible en mobile */}
            <button 
              className="text-xs sm:text-sm hover:underline text-gray-600 dark:text-gray-300 mt-1.5 sm:mt-2 flex items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onOpenVideo(course);
              }}
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-5 text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors duration-200" />
              <span>Ver video</span>
            </button>
            
            {/* Descripción solo en desktop */}
            <p className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 break-words">
              {course.descripcion}
            </p>
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 self-end sm:self-center" />
            </div>
            {/* Barra de progreso - naranja solo como detalle */}
            <div className="hidden sm:flex items-center gap-2 mt-3 sm:mt-4">
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300 shadow-sm"
                ></div>
              </div>
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium min-w-[2.5rem] text-right">
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Index = () => {
  const navigate = useNavigate();

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    description?: string;
    url: string;
    duration?: string;
    thumbnail?: string;
    topics?: string[];
  } | null>(null);
  const banners = ["/banner1.jpg", "/banner2.jpg", "/banner3.jpg"];

  const { theme } = useTheme();

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

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

  const handleOpenVideoModal = (course: Course) => {
    setSelectedVideo({
      id: course.id,
      title: `Video de formación - ${course.titulo}`,
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ", 
    });
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");

    const updateIsMobile = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Initialize state on mount
    updateIsMobile(mediaQuery);

    const listener = (event: MediaQueryListEvent) => updateIsMobile(event);

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    // Fallback para navegadores más antiguos
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    
    if (legacyMediaQuery.addListener) {
      legacyMediaQuery.addListener(listener);
      return () => legacyMediaQuery.removeListener?.(listener);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) =>
        prev === banners.length - 1 ? 0 : prev + 1
      );
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        const courses = await CoursesService.getAllCoursesPerUser(user.uid);
        // Asegurarse de que courses.data es un array
        const coursesData = Array.isArray(courses.data) ? courses.data : [];
        const filteredCourses = coursesData.filter((course) => course.estado === "activo");
        setCourses(filteredCourses);
      } catch (error) {
        console.error("Error al cargar cursos:", error);
        // En caso de error, establecer array vacío para evitar errores en la UI
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {!isMobile && (
        <div className="relative w-full overflow-hidden rounded-lg sm:rounded-xl shadow-lg mb-6 sm:mb-10">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <img
                  src={banner}
                  alt={`Banner ${index + 1}`}
                  className="w-full h-40 sm:h-56 md:h-64 lg:h-72 object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 flex justify-center space-x-1 sm:space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentBannerIndex ? "bg-white" : "bg-white/50"
                  }`}
                onClick={() => setCurrentBannerIndex(index)}
                aria-label={`Ir a banner ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="text-center mt-4">
        <div className="rounded-lg flex items-center justify-center">
          <img
            src={isDarkMode ? "/logo.webp" : "/logoNegro.png"}
            alt="Logo EPEFI"
            className="w-24 sm:w-40 md:w-36 h-auto object-contain transition-opacity duration-300"
            onError={(e) => {
              // Fallback en caso de error al cargar la imagen
              (e.target as HTMLImageElement).src = "/logo.webp";
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 ml-1">
          Mis formaciones
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <CourseLoader />
          ) : (
            <>
              {courses.length === 0
                ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No hay cursos asignados</p>
                  </div>
                ) : (
                  courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onNavigate={navigate}
                      onOpenVideo={handleOpenVideoModal}
                      formatDate={formatDate}
                    />
                  ))
                )}
            </>
          )}

        </div>
      </div>

      {/* Botón para adquirir más cursos - diseño elegante con naranja como detalle */}
      <a
        href="https://epefi.com.ar/escuela"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Card className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-400 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center py-6 sm:py-8 px-4 relative overflow-hidden">
            {/* Detalle naranja sutil */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500"></div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
              Adquirir más formaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
              Explorá toda nuestra oferta de formaciones
            </p>

            {/* Ícono con detalle naranja */}
            <div className="mt-3 flex justify-center">
              <ChevronRight className="w-5 h-5 text-orange-500 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </Card>
      </a>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        content={selectedVideo}
      />
    </div>
  );
};

export default Index;
