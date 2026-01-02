import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Maximize2, Minimize2 } from "lucide-react";
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
  } | null;
}

const VideoModal = ({ isOpen, onClose, content }: VideoModalProps) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSOverlay, setShowIOSOverlay] = useState(true);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
      setShowIOSOverlay(true);
    }
  }, [isOpen]);

  const handleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!isFullscreen) {
        // Entrar en pantalla completa
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen();
        } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
          // Safari
          await (videoContainerRef.current as any).webkitRequestFullscreen();
        } else if ((videoContainerRef.current as any).webkitEnterFullscreen) {
          // iOS Safari
          await (videoContainerRef.current as any).webkitEnterFullscreen();
        } else if ((videoContainerRef.current as any).mozRequestFullScreen) {
          await (videoContainerRef.current as any).mozRequestFullScreen();
        } else if ((videoContainerRef.current as any).msRequestFullscreen) {
          await (videoContainerRef.current as any).msRequestFullscreen();
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
      console.error("Error al cambiar pantalla completa:", error);
    }
  };

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

  // Para iOS, usar un enfoque diferente
  const handleIOSVideo = () => {
    if (isIOS) {
      // En iOS, abrir el video directamente en una nueva ventana/pestaña
      // Esto permite que el usuario use los controles nativos de pantalla completa
      window.open(content.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[100vw] !max-h-[100vh] !w-screen !h-screen !m-0 !p-0 !rounded-none !left-0 !top-0 !translate-x-0 !translate-y-0 !transform-none flex flex-col sm:!max-w-4xl sm:!max-h-[90vh] sm:!w-auto sm:!h-auto sm:!m-auto sm:!p-6 sm:!rounded-lg sm:!left-[50%] sm:!top-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:!transform">
        <DialogHeader className="p-4 sm:p-0 border-b border-slate-200 dark:border-slate-700 sm:border-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-xl font-semibold pr-8 sm:pr-0">
              {content.title}
            </DialogTitle>
            {!isIOS && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="absolute top-4 right-4 z-10"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
          <DialogDescription className="sr-only">
            Reproductor de video
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-0 space-y-4 min-h-0">
          {/* Video Player */}
          <div
            ref={videoContainerRef}
            className="aspect-video bg-black rounded-lg sm:rounded-lg overflow-hidden w-full relative"
          >
            <iframe
              ref={iframeRef}
              src={content.url}
              title={content.title}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              style={{
                WebkitAllowFullScreen: true,
                MozAllowFullScreen: true,
                msAllowFullScreen: true,
              } as React.CSSProperties}
              onLoad={() => {
                // En iOS, ocultar el overlay después de que el iframe cargue
                // para permitir interacción con los controles del video
                if (isIOS) {
                  setTimeout(() => setShowIOSOverlay(false), 3000);
                }
              }}
            />
            {isIOS && showIOSOverlay && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10"
                onClick={() => setShowIOSOverlay(false)}
              >
                <div className="text-center space-y-4 p-4">
                  <p className="text-white text-sm mb-4">
                    Toca el video para usar los controles de pantalla completa
                  </p>
                  <Button
                    onClick={handleIOSVideo}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    size="lg"
                  >
                    <Maximize2 className="h-5 w-5 mr-2" />
                    Abrir en nueva ventana
                  </Button>
                  <Button
                    onClick={() => setShowIOSOverlay(false)}
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                    size="sm"
                  >
                    Usar controles del reproductor
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Video Info - Oculto en mobile para dar más espacio al video */}
          <div className="hidden sm:block space-y-3">
            {content.duration && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span>Duración: {content.duration}</span>
              </div>
            )}

            {content.description && (
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {content.description}
                </p>
              </div>
            )}

            {content.topics && content.topics.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Temas tratados</h3>
                <div className="flex flex-wrap gap-2">
                  {content.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
