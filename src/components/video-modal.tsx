import {
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ensureYouTubeEmbedParams } from "@/lib/youtubeEmbed";

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
    videoTitles?: string[];
    currentIndex?: number;
  } | null;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  onMarkAsCompleted?: () => void;
  isCompleted?: boolean;
}

function convertVideoUrlToEmbed(url: string): string {
  if (!url) return url;

  try {
    if (url.includes("drive.google.com")) {
      let fileId = "";

      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch?.[1]) {
        fileId = fileMatch[1];
      } else if (url.includes("id=")) {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch?.[1]) {
          fileId = idMatch[1];
        }
      } else if (url.includes("/folders/")) {
        return url;
      }

      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }

      return url;
    }

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      if (url.includes("youtube.com/embed/")) {
        return url;
      }

      const urlObj = new URL(url);
      let videoId = "";

      if (urlObj.hostname.includes("youtube.com") && urlObj.searchParams.has("v")) {
        videoId = urlObj.searchParams.get("v") || "";
      } else if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.replace("/", "").split("?")[0];
      } else if (urlObj.pathname.includes("/embed/")) {
        return url;
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return url;
  } catch {
    return url;
  }
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

  // Prevenir menú contextual y descarga en móvil
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'VIDEO' || target.closest('.video-no-download')) {
        e.preventDefault();
        return false;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'VIDEO' || target.closest('.video-no-download')) {
        // Prevenir el menú contextual en móvil cuando se mantiene presionado
        if (e.touches.length === 1) {
          // Permitir interacción normal con un solo toque
          return;
        }
        e.preventDefault();
      }
    };

    if (isOpen) {
      document.addEventListener('contextmenu', handleContextMenu, true);
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu, true);
        document.removeEventListener('touchstart', handleTouchStart);
      };
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

  const getFullscreenElement = useCallback((): HTMLElement | null => {
    const url = content?.url ?? "";
    const isYt = url.includes("youtube.com") || url.includes("youtu.be");
    const isGd = url.includes("drive.google.com");
    if (isYt || isGd) {
      return iframeRef.current;
    }
    return videoRef.current;
  }, [content?.url]);

  const toggleFullscreen = useCallback(async () => {
    const el = getFullscreenElement();
    if (!el) return;

    try {
      const fsDoc = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };
      const isFs =
        document.fullscreenElement ||
        fsDoc.webkitFullscreenElement ||
        fsDoc.mozFullScreenElement ||
        fsDoc.msFullscreenElement;

      if (!isFs) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if ((el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (el as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
        } else if ((el as HTMLElement & { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
          await (el as HTMLElement & { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
        } else if ((el as HTMLElement & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
          await (el as HTMLElement & { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as Document & { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        } else if ((document as Document & { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
          await (document as Document & { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
        } else if ((document as Document & { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
          await (document as Document & { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error al cambiar pantalla completa:", error);
    }
  }, [getFullscreenElement]);

  const videoUrl = content
    ? ensureYouTubeEmbedParams(convertVideoUrlToEmbed(content.url))
    : "";
  const isYouTube = !!(
    content?.url &&
    (content.url.includes("youtube.com") || content.url.includes("youtu.be"))
  );
  const isGoogleDrive = !!(content?.url && content.url.includes("drive.google.com"));

  if (!content) return null;

  // Un solo iframe por módulo: al cambiar de video con las flechas solo cambia `src` (más rápido
  // que remontar el iframe en cada índice, que obliga a YouTube a cargar el player desde cero).
  const iframeSlotKey = `embed-slot-${content.id}`;

  // Determinar el título del video (prioriza el título por índice)
  const getVideoTitle = (): string => {
    const idx = content.currentIndex;

    if (content.videoTitles && idx !== undefined) {
      const t = content.videoTitles[idx];
      if (t && t.trim()) return t.trim();
    }

    if (content.videos && content.videos.length > 1 && idx !== undefined) {
      return `Video ${idx + 1}`;
    }

    if (content.title && content.title.trim()) {
      return content.title.trim();
    }

    return 'Video';
  };

  const videoTitle = getVideoTitle();

  return (
    <DialogPrimitive.Root
      open={isOpen}
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        {/* Radix no pinta overlay con modal=false; hace falta para no bloquear pantalla completa del iframe (YouTube). */}
        <button
          type="button"
          aria-label="Cerrar reproductor"
          className={cn(
            "fixed inset-0 z-[49] cursor-default border-0 bg-black/80",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
          data-state={isOpen ? "open" : "closed"}
          onClick={() => onClose()}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[51] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
            "max-w-4xl flex max-h-[min(90vh,900px)] flex-col gap-0 overflow-y-auto p-3 sm:p-6",
            "max-sm:fixed max-sm:inset-0 max-sm:left-0 max-sm:top-0 max-sm:h-auto max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0",
            "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            "outline-none focus:outline-none"
          )}
        >
        <DialogTitle className="sr-only">
          {videoTitle}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Reproducción del video seleccionado
        </DialogDescription>
        <div className="w-full flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex w-full flex-col gap-2 sm:gap-4">
            {/* Fila 1: Título - En mobile el texto puede ocupar varias líneas; botón pantalla completa siempre accesible */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 min-w-0 shrink-0">
              <div className="flex items-start justify-between gap-2 w-full min-w-0 sm:flex-1 sm:items-center sm:min-w-0">
                <h3
                  className={cn(
                    "min-w-0 flex-1 text-left font-semibold text-gray-900 dark:text-gray-100",
                    "text-base leading-snug sm:text-lg",
                    "break-words [overflow-wrap:anywhere]",
                    "line-clamp-4 sm:line-clamp-2 sm:leading-tight"
                  )}
                  title={videoTitle}
                >
                  {videoTitle}
                </h3>
                {/* Pantalla completa en mobile: todos los tipos (YouTube/Drive antes no tenían botón) */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 cursor-pointer touch-manipulation sm:hidden"
                  onClick={() => void toggleFullscreen()}
                  title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                  aria-label={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {/* Controles de navegación - Solo visible en desktop */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
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
                    onClick={() => void toggleFullscreen()}
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
            
            {/* Fila 2: reproductor — ratio 16:9 estable (padding-bottom evita colapsos con flex en algunos navegadores) */}
            <div
              ref={videoContainerRef}
              className="relative w-full shrink-0 overflow-hidden rounded-lg video-no-download"
              style={{ paddingBottom: "56.25%" }}
            >
              {(isYouTube || isGoogleDrive) ? (
                <>
                  <iframe
                    ref={iframeRef}
                    key={iframeSlotKey}
                    src={videoUrl}
                    title={isYouTube ? "Video de YouTube" : "Video de Google Drive"}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{
                      border: 'none'
                    }}
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
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                  }}
                  onTouchStart={(e) => {
                    // Prevenir el menú contextual en móvil
                    if (e.touches.length > 1) {
                      e.preventDefault();
                    }
                  }}
                  onTouchMove={(e) => {
                    // Prevenir acciones no deseadas durante el movimiento
                    if (e.touches.length > 1) {
                      e.preventDefault();
                    }
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default VideoModal;
