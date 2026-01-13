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
  ChevronLeft,
  ChevronRight,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Curso, Materia, Modulo } from "@/types/types";
import CoursesService from "@/services/coursesService";
import VideoModal from "@/components/video-modal";
import { useAuth } from "@/contexts/AuthContext";

const CourseDetailPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [courseDetail, setCourseDetail] = useState<Curso | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});
  const [loadingEnabledModules, setLoadingEnabledModules] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [loadingModulos, setLoadingModulos] = useState(true);
  const [expandedMaterias, setExpandedMaterias] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, Record<string, boolean>>>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const moduloRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedModuloId, setHighlightedModuloId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    description?: string;
    url: string;
    thumbnail?: string;
    videos?: string[]; // Array de todos los videos del módulo
    currentIndex?: number; // Índice del video actual
  } | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    url: string;
    title: string;
    documents?: string[]; // Array de todos los documentos del módulo
    currentIndex?: number; // Índice del documento actual
  } | null>(null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar iOS
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
  }, []);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirigir si el usuario está deshabilitado
  useEffect(() => {
    if (user && user.activo === false) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

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

  // Cargar módulos habilitados del estudiante
  useEffect(() => {
    const fetchEnabledModules = async () => {
      if (!user?.uid) {
        setEnabledModules({});
        setLoadingEnabledModules(false);
        return;
      }

      try {
        setLoadingEnabledModules(true);
        const response = await CoursesService.getStudentModules(user.uid);
        const modulosHabilitados = response.data?.modulos_habilitados || {};
        setEnabledModules(modulosHabilitados);
      } catch (error) {
        console.error('Error fetching enabled modules:', error);
        // Si hay error, asumir que todos los módulos están habilitados por defecto
        setEnabledModules({});
      } finally {
        setLoadingEnabledModules(false);
      }
    };

    fetchEnabledModules();
  }, [user?.uid]);

  // Cargar progreso del estudiante
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.uid) {
        setProgress({});
        setLoadingProgress(false);
        return;
      }

      try {
        setLoadingProgress(true);
        const response = await CoursesService.getStudentProgress(user.uid);
        const progressData = response.data?.progreso || {};
        setProgress(progressData);
      } catch (error: any) {
        // Si el endpoint no existe (404), simplemente inicializar con objeto vacío
        if (error?.response?.status === 404) {
          console.log('Endpoint de progreso no disponible todavía, inicializando vacío');
          setProgress({});
        } else {
          console.error('Error fetching progress:', error);
          setProgress({});
        }
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [user?.uid]);

  // Efecto para posicionar la página al principio cuando se carga el curso
  useEffect(() => {
    // Hacer scroll al principio cuando se carga el curso
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [courseId]);

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


  // Función para convertir URL de YouTube o Google Drive al formato embed
  const convertYouTubeToEmbed = (url: string): string => {
    if (!url) return url;
    
    try {
      // Google Drive
      if (url.includes('drive.google.com')) {
        // Extraer el ID del archivo de diferentes formatos de Google Drive
        let fileId = '';
        
        // Formato: drive.google.com/file/d/FILE_ID/view
        const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileMatch && fileMatch[1]) {
          fileId = fileMatch[1];
        }
        // Formato: drive.google.com/open?id=FILE_ID
        else if (url.includes('id=')) {
          const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (idMatch && idMatch[1]) {
            fileId = idMatch[1];
          }
        }
        // Formato: drive.google.com/drive/folders/FOLDER_ID (carpetas, no archivos)
        else if (url.includes('/folders/')) {
          // Para carpetas, no podemos hacer embed, retornar URL original
          return url;
        }
        
        if (fileId) {
          // Usar el formato preview de Google Drive para videos
          return `https://drive.google.com/file/d/${fileId}/preview`;
        }
        
        return url;
      }
      
      // YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Si ya es una URL embed, retornarla tal cual
        if (url.includes('youtube.com/embed/')) {
          return url;
        }
        
        const urlObj = new URL(url);
        let videoId = '';
        
        // Formato: youtube.com/watch?v=VIDEO_ID
        if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
          videoId = urlObj.searchParams.get('v') || '';
        }
        // Formato: youtu.be/VIDEO_ID
        else if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.replace('/', '').split('?')[0];
        }
        // Formato: youtube.com/embed/VIDEO_ID (ya es embed)
        else if (urlObj.pathname.includes('/embed/')) {
          return url;
        }
        
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Si no es YouTube ni Google Drive, retornar la URL original
      return url;
    } catch {
      // Si no es una URL válida, retornar tal cual
      return url;
    }
  };

  const handleOpenVideo = (modulo: Modulo, videoIndex: number = 0) => {
    // Verificar si el módulo está habilitado
    if (enabledModules[modulo.id] === false) {
      return; // No permitir abrir si está deshabilitado
    }
    
    // Obtener array de videos (puede ser string, array, o undefined)
    let videos: string[] = [];
    if (modulo.url_video) {
      if (Array.isArray(modulo.url_video)) {
        videos = modulo.url_video;
      } else {
        videos = [modulo.url_video];
      }
    }
    
    if (videos.length === 0) {
      console.error('No hay videos disponibles');
      return;
    }
    
    // Asegurar que el índice esté dentro del rango
    const validIndex = Math.max(0, Math.min(videoIndex, videos.length - 1));
    const videoUrl = videos[validIndex];
    
    // Convertir URL de YouTube o Google Drive al formato embed si es necesario
    const embedUrl = convertYouTubeToEmbed(videoUrl);
    
    setSelectedVideo({
      id: modulo.id,
      title: modulo.titulo,
      url: embedUrl,
      thumbnail: modulo.url_miniatura,
      videos: videos.map(v => convertYouTubeToEmbed(v)), // Convertir todos los videos
      currentIndex: validIndex,
    });
    setIsVideoModalOpen(true);
  };

  const handleCloseVideo = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  // Función para cambiar al siguiente video
  const handleNextVideo = () => {
    if (!selectedVideo || !selectedVideo.videos || selectedVideo.currentIndex === undefined) return;
    const nextIndex = (selectedVideo.currentIndex + 1) % selectedVideo.videos.length;
    const nextUrl = selectedVideo.videos[nextIndex];
    const embedUrl = convertYouTubeToEmbed(nextUrl);
    setSelectedVideo({
      ...selectedVideo,
      url: embedUrl,
      currentIndex: nextIndex,
    });
  };

  // Función para cambiar al video anterior
  const handlePreviousVideo = () => {
    if (!selectedVideo || !selectedVideo.videos || selectedVideo.currentIndex === undefined) return;
    const prevIndex = (selectedVideo.currentIndex - 1 + selectedVideo.videos.length) % selectedVideo.videos.length;
    const prevUrl = selectedVideo.videos[prevIndex];
    const embedUrl = convertYouTubeToEmbed(prevUrl);
    setSelectedVideo({
      ...selectedVideo,
      url: embedUrl,
      currentIndex: prevIndex,
    });
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

  // Función para formatear la URL del PDF con parámetros de zoom
  const formatPDFUrl = (url: string): string => {
    if (!url) return url;
    
    // Remover cualquier fragmento existente para evitar conflictos
    const baseUrl = url.split('#')[0];
    
    // Agregar parámetros para que el PDF se muestre completo y permita zoom manual
    // #view=FitH ajusta horizontalmente (muestra toda la página)
    // #toolbar=1 muestra la barra de herramientas para zoom manual
    // #navpanes=0 oculta el panel de navegación para más espacio
    // #scrollbar=1 muestra la barra de desplazamiento
    return `${baseUrl}#view=FitH&toolbar=1&navpanes=0&scrollbar=1`;
  };

  const handleOpenDocument = (modulo: Modulo, documentIndex: number = 0) => {
    // Verificar si el módulo está habilitado
    if (enabledModules[modulo.id] === false) {
      return; // No permitir abrir si está deshabilitado
    }
    if (!modulo.url_archivo) {
      console.error('No hay URL de archivo disponible');
      return;
    }

    // Parsear documentos (puede ser string simple o string con delimitador |||)
    let documents: string[] = [];
    if (modulo.url_archivo) {
      if (modulo.url_archivo.includes('|||')) {
        documents = modulo.url_archivo.split('|||').filter(url => url.trim());
      } else {
        documents = [modulo.url_archivo];
      }
    }
    
    if (documents.length === 0) {
      console.error('No hay documentos disponibles');
      return;
    }
    
    // Asegurar que el índice esté dentro del rango
    const validIndex = Math.max(0, Math.min(documentIndex, documents.length - 1));
    const selectedUrl = documents[validIndex];

    // Detectar si es una URL de Google Drive
    if (isGoogleDriveUrl(selectedUrl)) {
      // Para Google Drive, abrir en nueva pestaña
      window.open(selectedUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // En iOS, no mostrar estado de carga, mostrar directamente las opciones
    if (isIOS) {
      setIsDocumentLoading(false);
    } else {
      setIsDocumentLoading(true);
    }
    // Formatear la URL del PDF con parámetros de zoom
    const formattedUrl = formatPDFUrl(selectedUrl);
    setSelectedDocument({
      url: formattedUrl,
      title: modulo.titulo,
      documents: documents,
      currentIndex: validIndex,
    });
    setIsDocumentModalOpen(true);
  };

  const handleCloseDocument = () => {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
    setIsDocumentLoading(true);
  };

  // Función para cambiar al siguiente documento
  const handleNextDocument = () => {
    if (!selectedDocument || !selectedDocument.documents || selectedDocument.currentIndex === undefined) return;
    const nextIndex = (selectedDocument.currentIndex + 1) % selectedDocument.documents.length;
    const nextUrl = selectedDocument.documents[nextIndex];
    
    // Detectar si es una URL de Google Drive
    if (isGoogleDriveUrl(nextUrl)) {
      window.open(nextUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    setIsDocumentLoading(true);
    const formattedUrl = formatPDFUrl(nextUrl);
    setSelectedDocument({
      ...selectedDocument,
      url: formattedUrl,
      currentIndex: nextIndex,
    });
  };

  // Función para cambiar al documento anterior
  const handlePreviousDocument = () => {
    if (!selectedDocument || !selectedDocument.documents || selectedDocument.currentIndex === undefined) return;
    const prevIndex = (selectedDocument.currentIndex - 1 + selectedDocument.documents.length) % selectedDocument.documents.length;
    const prevUrl = selectedDocument.documents[prevIndex];
    
    // Detectar si es una URL de Google Drive
    if (isGoogleDriveUrl(prevUrl)) {
      window.open(prevUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    setIsDocumentLoading(true);
    const formattedUrl = formatPDFUrl(prevUrl);
    setSelectedDocument({
      ...selectedDocument,
      url: formattedUrl,
      currentIndex: prevIndex,
    });
  };

  const handleDocumentLoad = () => {
    setIsDocumentLoading(false);
  };

  // Función para marcar contenido como completado
  const handleMarkAsCompleted = async (moduleId: string, contentIndex: number, contentType: 'video' | 'document') => {
    if (!user?.uid) return;

    try {
      const contentKey = `${moduleId}_${contentType}_${contentIndex}`;
      const moduleProgress = progress[moduleId] || {};
      const isCompleted = moduleProgress[contentKey] === true;

      // Actualizar el estado local primero para feedback inmediato
      setProgress(prev => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          [contentKey]: !isCompleted
        }
      }));

      // Llamar al backend
      await CoursesService.markContentAsCompleted(user.uid, moduleId, contentIndex, contentType, !isCompleted);
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

  // Calcular progreso del curso
  const calculateCourseProgress = (): { completed: number; total: number; percentage: number } => {
    let completed = 0;
    let total = 0;

    materias.forEach(materia => {
      const materiasModulos = modulos
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
            {/* Fechas de dictado */}
            {(courseDetail.fechaInicioDictado || courseDetail.fechaFinDictado) && (
              <div className="mt-1.5 space-y-0.5">
                {courseDetail.fechaInicioDictado && (
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium">Inicio:</span>
                    <span>{formatDate(courseDetail.fechaInicioDictado)}</span>
                  </div>
                )}
                {courseDetail.fechaFinDictado && (
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 flex-shrink-0 opacity-0 sm:opacity-100" />
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

      <main className="mx-auto w-full max-w-6xl px-3 sm:px-4 py-4 sm:py-6 lg:px-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Barra de progreso */}
          {!loadingProgress && !loadingModulos && materias.length > 0 && (() => {
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
              <section className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Progreso del curso</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {courseProgress.completed} de {courseProgress.total} completados
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(courseProgress.percentage)} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${courseProgress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  {courseProgress.percentage}% completado
                </p>
              </section>
            );
          })()}

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
                {materias
                  .filter((materia) => {
                    // Obtener todos los módulos de esta materia
                    const materiasModulos = modulos.filter(modulo => modulo.id_materia === materia.id);
                    
                    // Si la materia no tiene módulos, mostrarla
                    if (materiasModulos.length === 0) {
                      return true;
                    }
                    
                    // Verificar si hay al menos un módulo habilitado
                    const hasEnabledModule = materiasModulos.some((modulo) => {
                      // Si el módulo no está en enabledModules, está habilitado por defecto
                      // Si está explícitamente deshabilitado (false), no está habilitado
                      return enabledModules[modulo.id] !== false;
                    });
                    
                    // Mostrar la materia solo si tiene al menos un módulo habilitado
                    return hasEnabledModule;
                  })
                  .map((materia) => {
                    // Filtrar módulos habilitados antes de contar y mostrar
                    const materiasModulos = modulos
                      .filter(modulo => modulo.id_materia === materia.id)
                      .filter((modulo) => {
                        // Si el módulo no está en enabledModules, está habilitado por defecto
                        // Si está explícitamente deshabilitado (false), no mostrarlo
                        return enabledModules[modulo.id] !== false;
                      });

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
                            ) : loadingEnabledModules ? (
                              <div className="space-y-3 sm:space-y-3.5 px-4 sm:px-5">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Cargando módulos...</p>
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
                                      isEnabled={enabledModules[modulo.id] !== false}
                                      isContentCompleted={isContentCompleted}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-4 sm:px-5 py-2 leading-relaxed">
                                No hay módulos disponibles para esta materia.
                              </div>
                            )}
                            {/* Advertencia si hay módulos deshabilitados - al final */}
                            {(() => {
                              const allMateriaModulos = modulos.filter(modulo => modulo.id_materia === materia.id);
                              const disabledModules = allMateriaModulos.filter((modulo) => enabledModules[modulo.id] === false);
                              
                              if (disabledModules.length > 0) {
                                return (
                                  <div className="mt-4 px-4 sm:px-5">
                                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                          Módulos pendientes
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                          Hay {disabledModules.length} módulo{disabledModules.length !== 1 ? 's' : ''} pendiente{disabledModules.length !== 1 ? 's' : ''} por estudiar en esta materia. Los módulos se habilitarán progresivamente según el plan de estudios.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
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

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideo}
        content={selectedVideo}
        onNextVideo={selectedVideo?.videos && selectedVideo.videos.length > 1 ? handleNextVideo : undefined}
        onPreviousVideo={selectedVideo?.videos && selectedVideo.videos.length > 1 ? handlePreviousVideo : undefined}
        onMarkAsCompleted={selectedVideo ? () => {
          if (selectedVideo.currentIndex !== undefined) {
            handleMarkAsCompleted(selectedVideo.id, selectedVideo.currentIndex, 'video');
          }
        } : undefined}
        isCompleted={selectedVideo && selectedVideo.currentIndex !== undefined ? isContentCompleted(selectedVideo.id, selectedVideo.currentIndex, 'video') : false}
      />

      {/* Modal de documento a pantalla completa */}
      <Dialog open={isDocumentModalOpen} onOpenChange={handleCloseDocument}>
        <DialogContent className="!max-w-[100vw] !max-h-[100vh] !w-screen !h-screen !m-0 !p-0 !rounded-none !left-0 !top-0 !translate-x-0 !translate-y-0 !transform-none flex flex-col [&>button]:hidden">
          <DialogHeader className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            {/* Fila 1: Título - En mobile ocupa toda la fila */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {selectedDocument?.title || 'Documento'}
                </DialogTitle>
                {selectedDocument?.documents && selectedDocument.documents.length > 1 && selectedDocument.currentIndex !== undefined && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Documento {selectedDocument.currentIndex + 1} de {selectedDocument.documents.length}
                  </p>
                )}
              </div>
              {/* Controles de navegación - Solo visible en desktop */}
              <div className="hidden sm:flex items-center gap-2">
                {selectedDocument?.documents && selectedDocument.documents.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePreviousDocument}
                      className="h-8 w-8"
                      disabled={selectedDocument.currentIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextDocument}
                      className="h-8 w-8"
                      disabled={selectedDocument.currentIndex === selectedDocument.documents.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {isIOS && selectedDocument && !isGoogleDriveUrl(selectedDocument.url) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Remover parámetros de fragmento para la URL original
                      const originalUrl = selectedDocument.url.split('#')[0];
                      window.open(originalUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="text-orange-600 dark:text-orange-400"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir en Safari
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription className="sr-only">
              Visualizador de documento PDF
            </DialogDescription>
          </DialogHeader>
          {/* Fila 2: Navegador (contenido del PDF) */}
          <div className="flex-1 overflow-hidden p-0 min-h-0 relative">
            {/* Solo mostrar estado de carga en dispositivos que no sean iOS */}
            {isDocumentLoading && !isIOS && (
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
              <>
                {/* En iOS, mostrar opciones para abrir en Safari ya que los PDFs embebidos no funcionan bien */}
                {isIOS ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
                    <div className="text-center space-y-4 max-w-md">
                      <FileText className="h-16 w-16 text-orange-500 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          {selectedDocument.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Para ver este documento en iOS, ábrelo en Safari para usar los controles nativos de visualización y zoom.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 pt-4">
                        <Button
                          onClick={() => {
                            // Remover parámetros de fragmento para la URL original
                            const originalUrl = selectedDocument.url.split('#')[0];
                            window.open(originalUrl, '_blank', 'noopener,noreferrer');
                            handleCloseDocument();
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                          size="lg"
                        >
                          <ExternalLink className="h-5 w-5 mr-2" />
                          Abrir en Safari
                        </Button>
                        <Button
                          onClick={handleCloseDocument}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={selectedDocument.url}
                    title={selectedDocument.title}
                    className="w-full h-full"
                    style={{ 
                      border: 'none', 
                      minHeight: 'calc(100vh - 80px)',
                      width: '100%',
                      height: '100%',
                    }}
                    allow="fullscreen"
                    onLoad={handleDocumentLoad}
                    onError={() => {
                      // Si hay error al cargar, abrir en nueva pestaña
                      setIsDocumentLoading(false);
                      // Remover parámetros de fragmento para la URL original
                      const originalUrl = selectedDocument.url.split('#')[0];
                      window.open(originalUrl, '_blank', 'noopener,noreferrer');
                      handleCloseDocument();
                    }}
                    key={selectedDocument.url} // Forzar re-render cuando cambia la URL
                  />
                )}
              </>
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
          {/* Fila 3: Botones de visto y cerrar - En mobile ocupa toda la fila */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2 p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            {/* Controles de navegación para mobile - Solo visible en mobile */}
            {selectedDocument?.documents && selectedDocument.documents.length > 1 && (
              <div className="flex sm:hidden items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousDocument}
                  className="h-8 w-8"
                  disabled={selectedDocument.currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-slate-500 dark:text-slate-400 px-2">
                  {selectedDocument.currentIndex! + 1} / {selectedDocument.documents.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextDocument}
                  className="h-8 w-8"
                  disabled={selectedDocument.currentIndex === selectedDocument.documents.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:justify-end">
              {selectedDocument && selectedDocument.currentIndex !== undefined && (() => {
                const modulo = modulos.find(m => m.titulo === selectedDocument.title);
                const moduleId = modulo?.id || '';
                const isDocCompleted = isContentCompleted(moduleId, selectedDocument.currentIndex, 'document');
                return (
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => {
                      if (modulo && selectedDocument.currentIndex !== undefined) {
                        handleMarkAsCompleted(modulo.id, selectedDocument.currentIndex, 'document');
                      }
                    }}
                    className={`h-12 px-6 sm:h-12 sm:px-8 text-base font-semibold shadow-lg transition-all flex-1 sm:flex-initial ${
                      isDocCompleted 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5 sm:mr-2" />
                    <span className={isMobile ? 'hidden' : ''}>
                      {isDocCompleted ? 'Completado' : 'Marcar como completado'}
                    </span>
                    <span className={isMobile ? '' : 'hidden'}>
                      {isDocCompleted ? 'LEIDO' : 'LEIDO'}
                    </span>
                  </Button>
                );
              })()}
              <Button
                variant="outline"
                size="lg"
                onClick={handleCloseDocument}
                className="h-10 px-4 sm:h-10 sm:px-6 font-medium flex-1 sm:flex-initial"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente para cada módulo con descripción desplegable
const ModuleItem = ({ modulo, handleOpenDocument, handleOpenVideo, isHighlighted = false, isEnabled = true, isContentCompleted }: { modulo: Modulo; handleOpenDocument: (modulo: Modulo, index?: number) => void; handleOpenVideo: (modulo: Modulo, index?: number) => void; isHighlighted?: boolean; isEnabled?: boolean; isContentCompleted: (moduleId: string, contentIndex: number, contentType: 'video' | 'document') => boolean }) => {
  const [isModuleExpanded, setIsModuleExpanded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const descripcion = modulo.descripcion || '';
  const maxLength = 150; // Caracteres para mostrar antes del "Ver más"
  const shouldTruncate = descripcion.length > maxLength;
  const displayDesc = shouldTruncate && !isDescExpanded 
    ? descripcion.substring(0, maxLength) + '...'
    : descripcion;

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

  // Verificar si todos los contenidos del módulo están completados
  const isModuleCompleted = (): boolean => {
    // Si no hay contenidos, no está completado
    if (documents.length === 0 && videos.length === 0) {
      return false;
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

  return (
    <div className={cn(
      "flex items-start gap-2 sm:gap-4 p-2 sm:p-4 rounded-md border transition-all duration-500",
      isHighlighted 
        ? "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700 shadow-md ring-2 ring-orange-400 dark:ring-orange-500 ring-opacity-50" 
        : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50"
    )}>
      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0 hidden sm:block"></div>
      <div className="flex-1 min-w-0">
        <button
          onClick={() => setIsModuleExpanded(!isModuleExpanded)}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <h4 className={cn(
            "text-xs sm:text-base font-medium leading-relaxed flex items-center gap-2",
            moduleCompleted 
              ? "text-green-600 dark:text-green-400" 
              : "text-slate-800 dark:text-slate-200"
          )}>
            {moduleCompleted && (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            )}
            {modulo.titulo}
          </h4>
          <ChevronDown className={cn(
            "h-4 w-4 sm:h-5 sm:w-5 text-slate-500 dark:text-slate-400 transition-transform flex-shrink-0",
            isModuleExpanded && "rotate-180"
          )} />
        </button>
        {isModuleExpanded && (
          <>
            {descripcion && (
              <div className="hidden sm:block mt-1.5 sm:mt-2">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {displayDesc}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescExpanded(!isDescExpanded);
                    }}
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
            <div className="flex flex-col gap-2 sm:gap-3 mt-2 sm:mt-4">
          {documents.map((doc, index) => {
            // Extraer y limpiar el nombre del archivo de forma amigable
            // Para todos los documentos, usar el mismo formato: Documento [X]
            const getFileName = (url: string): string => {
              if (documents.length > 1) {
                return `Documento ${index + 1}`;
              }
              return `Documento`;
            };
            const fileName = getFileName(doc);
            const isDocCompleted = isContentCompleted(modulo.id, index, 'document');
            
            return (
              <div key={`doc-${index}`}>
                {/* Botón para móvil - solo botón sin card */}
                <Button
                  className={`w-full h-10 sm:hidden px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    isDocCompleted
                      ? 'border border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/40'
                      : 'border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
                  }`}
                  onClick={() => handleOpenDocument(modulo, index)}
                >
                  {isDocCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {documents.length > 1 ? `Doc ${index + 1}` : 'Doc'}
                </Button>
                {/* Card para desktop */}
                <div 
                  className={`hidden sm:flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isDocCompleted
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {isDocCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <File className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                  )}
                  <span 
                    className={`flex-1 text-sm font-medium truncate min-w-0 ${
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
                    onClick={() => handleOpenDocument(modulo, index)}
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
            // Extraer y limpiar el nombre del video de forma amigable
            // Para todos los videos, usar el mismo formato: Video [X]
            const getVideoName = (url: string): string => {
              if (videos.length > 1) {
                return `Video ${index + 1}`;
              }
              return `Video`;
            };
            const videoName = getVideoName(video);
            const isVideoCompleted = isContentCompleted(modulo.id, index, 'video');
            
            return (
              <div key={`video-${index}`}>
                {/* Botón para móvil - solo botón sin card */}
                <Button
                  className={`w-full h-10 sm:hidden px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isVideoCompleted
                      ? 'border border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/40'
                      : 'border border-orange-400 dark:border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
                  }`}
                  onClick={() => handleOpenVideo(modulo, index)}
                  disabled={!isEnabled}
                >
                  {isVideoCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {videos.length > 1 ? `Video ${index + 1}` : 'Video'}
                </Button>
                {/* Card para desktop */}
                <div 
                  className={`hidden sm:flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isVideoCompleted
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {isVideoCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <Play className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                  )}
                  <span 
                    className={`flex-1 text-sm font-medium truncate min-w-0 ${
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
                    onClick={() => handleOpenVideo(modulo, index)}
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
