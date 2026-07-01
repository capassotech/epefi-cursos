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

/** iPhone / iPod / iPad (incl. Chrome “CriOS”, que usa WebKit; sin fullscreen API útil en iframes). */
function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iP(hone|od|ad)/i.test(ua)) return true;
  if (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1) return true;
  return false;
}

const VideoModal = ({ isOpen, onClose, content, onNextVideo, onPreviousVideo, onMarkAsCompleted, isCompleted = false }: VideoModalProps) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  /** WebKit iOS no aplica requestFullscreen al iframe de YouTube/Drive; simulamos “pantalla completa” con CSS. */
  const [immersiveEmbed, setImmersiveEmbed] = useState(false);

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
      setImmersiveEmbed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isMobile) setImmersiveEmbed(false);
  }, [isMobile]);

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
    if (immersiveEmbed) {
      setImmersiveEmbed(false);
      return;
    }

    const url = content?.url ?? "";
    const isEmbed =
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("drive.google.com");

    if (isEmbed && isAppleTouchDevice()) {
      setImmersiveEmbed(true);
      return;
    }

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
  }, [getFullscreenElement, immersiveEmbed, content?.url]);

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
            "fixed left-[50%] top-[50%] z-[51] flex w-[calc(100vw-1.5rem)] max-w-4xl translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden border bg-background p-3 shadow-lg duration-200 sm:w-full sm:p-6",
            "max-h-[min(90dvh,900px)] rounded-xl sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "outline-none focus:outline-none"
          )}
        >
        <DialogTitle className="sr-only">
          {videoTitle}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Reproducción del video seleccionado
        </DialogDescription>
        <div className="flex min-h-0 w-full flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex w-full min-h-0 flex-col gap-2 sm:gap-4">
            {/* Encabezado compacto: título largo con scroll interno sin expandir el modal */}
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="flex min-w-0 items-start justify-between gap-2 sm:flex-1">
                <div
                  className="max-h-[4.5rem] min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-[3.25rem]"
                  title={videoTitle}
                >
                  <h3 className="text-left text-sm font-semibold leading-snug text-gray-900 break-words [overflow-wrap:anywhere] dark:text-gray-100 sm:text-base sm:leading-tight">
                    {videoTitle}
                  </h3>
                </div>
                {/* Pantalla completa en mobile: todos los tipos (YouTube/Drive antes no tenían botón) */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 cursor-pointer touch-manipulation sm:hidden"
                  onClick={() => void toggleFullscreen()}
                  title={immersiveEmbed || isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                  aria-label={immersiveEmbed || isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                >
                  {immersiveEmbed || isFullscreen ? (
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
            
            {/* Reproductor 16:9 */}
            <div
              ref={videoContainerRef}
              className={cn(
                "relative w-full shrink-0 overflow-hidden rounded-lg video-no-download",
                immersiveEmbed
                  ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]"
                  : undefined
              )}
              style={immersiveEmbed ? undefined : { paddingBottom: "56.25%" }}
            >
              {(isYouTube || isGoogleDrive) ? (
                <>
                  {immersiveEmbed && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute right-3 top-[max(0.5rem,env(safe-area-inset-top))] z-20 touch-manipulation shadow-md sm:hidden"
                      onClick={() => setImmersiveEmbed(false)}
                    >
                      Salir
                    </Button>
                  )}
                  <div
                    className={cn(
                      immersiveEmbed
                        ? "relative aspect-video w-full max-h-[min(100dvh,100svh)]"
                        : "absolute inset-0"
                    )}
                  >
                    <iframe
                      ref={iframeRef}
                      key={iframeSlotKey}
                      src={videoUrl}
                      title={isYouTube ? "Video de YouTube" : "Video de Google Drive"}
                      className={cn(
                        "absolute left-0 top-0 h-full w-full rounded-lg",
                        immersiveEmbed && "rounded-md sm:rounded-lg"
                      )}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      style={{
                        border: "none",
                      }}
                    />
                    {isGoogleDrive && (
                      <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-black/70 p-3 text-xs text-white">
                        <p className="mb-2">Si el video no se muestra, puede requerir permisos de acceso.</p>
                        <button
                          type="button"
                          className="text-orange-400 underline hover:text-orange-300"
                          onClick={() => {
                            const originalUrl = videoUrl.replace("/preview", "/view");
                            window.open(originalUrl, "_blank", "noopener,noreferrer");
                          }}
                        >
                          Abrir en Google Drive
                        </button>
                      </div>
                    )}
                  </div>
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
            
            {/* Acciones */}
            <div className="flex shrink-0 flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center sm:gap-2">
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
              
              <div className="flex items-center gap-2">
                {onMarkAsCompleted && (
                  <Button
                    type="button"
                    variant={isCompleted ? "default" : "default"}
                    className={`cursor-pointer px-4 py-2 text-sm font-semibold shadow-md transition-all sm:px-6 sm:py-3 sm:text-base sm:shadow-lg ${
                      isCompleted
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-500 text-white hover:bg-red-600 hover:shadow-xl"
                    }`}
                    onClick={onMarkAsCompleted}
                  >
                    <CheckCircle2 className="h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                    {isCompleted ? "Visto" : "Marcar como visto"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
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
