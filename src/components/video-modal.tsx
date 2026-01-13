import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    description?: string;
    url: string;
    duration?: string;
    thumbnail?: string;
    topics?: string[];
    videos?: string[];
    currentIndex?: number;
  } | null;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  onMarkAsCompleted?: () => void;
  isCompleted?: boolean;
}

const VideoModal = ({ isOpen, onClose, content, onNextVideo, onPreviousVideo, onMarkAsCompleted, isCompleted = false }: VideoModalProps) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  if (!content) return null;

  // Convertir URL de YouTube o Google Drive al formato embed si es necesario
  const convertVideoUrlToEmbed = (url: string): string => {
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

  const videoUrl = convertVideoUrlToEmbed(content.url);
  const isYouTube = content.url.includes('youtube.com') || content.url.includes('youtu.be');
  const isGoogleDrive = content.url.includes('drive.google.com');

  // Determinar el título del video
  const getVideoTitle = (): string => {
    if (content.videos && content.videos.length > 1 && content.currentIndex !== undefined) {
      return `Video ${content.currentIndex + 1}`;
    }
    return 'Video';
  };

  const videoTitle = getVideoTitle();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl [&>button]:hidden">
        <DialogTitle className="sr-only">
          {videoTitle}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Reproducción del video seleccionado
        </DialogDescription>
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-4">
            {/* Fila 1: Título - En mobile ocupa toda la fila, en desktop está junto con controles */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center justify-between w-full sm:w-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{videoTitle}</h3>
                {/* Botón de expandir para mobile - Solo visible en mobile */}
                {!isYouTube && !isGoogleDrive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="cursor-pointer sm:hidden"
                    onClick={async () => {
                      if (!videoRef.current) return;
                      
                      try {
                        if (!isFullscreen) {
                          // Entrar en pantalla completa
                          if (videoRef.current.requestFullscreen) {
                            await videoRef.current.requestFullscreen();
                          } else if ((videoRef.current as any).webkitRequestFullscreen) {
                            await (videoRef.current as any).webkitRequestFullscreen();
                          } else if ((videoRef.current as any).mozRequestFullScreen) {
                            await (videoRef.current as any).mozRequestFullScreen();
                          } else if ((videoRef.current as any).msRequestFullscreen) {
                            await (videoRef.current as any).msRequestFullscreen();
                          }
                        } else {
                          // Salir de pantalla completa
                          if (document.exitFullscreen) {
                            await document.exitFullscreen();
                          } else if ((document as any).webkitExitFullscreen) {
                            await (document as any).webkitExitFullscreen();
                          } else if ((document as any).mozCancelFullScreen) {
                            await (document as any).mozCancelFullScreen();
                          } else if ((document as any).msExitFullscreen) {
                            await (document as any).msExitFullscreen();
                          }
                        }
                      } catch (error) {
                        console.error('Error al cambiar pantalla completa:', error);
                      }
                    }}
                    title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {/* Controles de navegación - Solo visible en desktop */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Controles de navegación para múltiples videos */}
                {content.videos && content.videos.length > 1 && content.currentIndex !== undefined && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onPreviousVideo}
                      disabled={!onPreviousVideo || content.currentIndex === 0}
                      className="cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                      {content.currentIndex + 1} / {content.videos.length}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onNextVideo}
                      disabled={!onNextVideo || content.currentIndex === content.videos.length - 1}
                      className="cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {!isYouTube && !isGoogleDrive && (
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={async () => {
                      if (!videoRef.current) return;
                      
                      try {
                        if (!isFullscreen) {
                          // Entrar en pantalla completa
                          if (videoRef.current.requestFullscreen) {
                            await videoRef.current.requestFullscreen();
                          } else if ((videoRef.current as any).webkitRequestFullscreen) {
                            await (videoRef.current as any).webkitRequestFullscreen();
                          } else if ((videoRef.current as any).mozRequestFullScreen) {
                            await (videoRef.current as any).mozRequestFullScreen();
                          } else if ((videoRef.current as any).msRequestFullscreen) {
                            await (videoRef.current as any).msRequestFullscreen();
                          }
                        } else {
                          // Salir de pantalla completa
                          if (document.exitFullscreen) {
                            await document.exitFullscreen();
                          } else if ((document as any).webkitExitFullscreen) {
                            await (document as any).webkitExitFullscreen();
                          } else if ((document as any).mozCancelFullScreen) {
                            await (document as any).mozCancelFullScreen();
                          } else if ((document as any).msExitFullscreen) {
                            await (document as any).msExitFullscreen();
                          }
                        }
                      } catch (error) {
                        console.error('Error al cambiar pantalla completa:', error);
                      }
                    }}
                    title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Salir
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Expandir
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Fila 2: Navegador (contenido del video/PDF) */}
            <div 
              ref={videoContainerRef}
              className="relative w-full video-no-download" 
              style={{ paddingBottom: '56.25%' }}
            >
              {(isYouTube || isGoogleDrive) ? (
                <>
                  <iframe
                    ref={iframeRef}
                    src={videoUrl}
                    title={isYouTube ? "Video de YouTube" : "Video de Google Drive"}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    style={{
                      border: 'none'
                    }}
                    key={videoUrl}
                  />
                  {isGoogleDrive && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-xs z-10">
                      <p className="mb-2">Si el video no se muestra, puede requerir permisos de acceso.</p>
                      <button
                        type="button"
                        className="text-orange-400 hover:text-orange-300 underline"
                        onClick={() => {
                          const originalUrl = videoUrl.replace('/preview', '/view');
                          window.open(originalUrl, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        Abrir en Google Drive
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  style={{
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
            
            {/* Fila 3: Botones de visto y cerrar - En mobile ocupa toda la fila */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2">
              {/* Controles de navegación para mobile - Solo visible en mobile */}
              {content.videos && content.videos.length > 1 && content.currentIndex !== undefined && (
                <div className="flex sm:hidden items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onPreviousVideo}
                    disabled={!onPreviousVideo || content.currentIndex === 0}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                    {content.currentIndex + 1} / {content.videos.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onNextVideo}
                    disabled={!onNextVideo || content.currentIndex === content.videos.length - 1}
                    className="cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Botones de acción */}
              <div className="flex items-center gap-2 justify-between w-full">
                {onMarkAsCompleted && (
                  <Button
                    type="button"
                    variant={isCompleted ? "default" : "default"}
                    className={`cursor-pointer text-base font-semibold px-6 py-3 shadow-lg transition-all ${
                      isCompleted 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl'
                    }`}
                    onClick={onMarkAsCompleted}
                  >
                    <CheckCircle2 className="h-5 w-5 sm:mr-2" />
                    <span className={isMobile ? 'hidden' : ''}>
                      {isCompleted ? 'Visto' : 'Marcar como visto'}
                    </span>
                    <span className={isMobile ? '' : 'hidden'}>
                      {isCompleted ? 'VISTO' : 'VISTO'}
                    </span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer ml-auto"
                  onClick={() => {
                    onClose();
                    setIsFullscreen(false);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
