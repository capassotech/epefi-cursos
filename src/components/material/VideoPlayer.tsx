import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, RotateCw, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CoursesService from "@/services/coursesService";
import {
  isAppleTouchDevice,
  isGoogleDriveVideoUrl,
  isYouTubeUrl,
  toPlayableVideoUrl,
} from "@/lib/videoEmbed";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
};

/** En iPhone el único fullscreen real es el del propio `<video>`; solo funciona con los metadatos cargados. */
type AppleVideoElement = HTMLVideoElement & {
  webkitSupportsFullscreen?: boolean;
  webkitEnterFullscreen?: () => void;
};

const getFullscreenNode = () => {
  const doc = document as FullscreenDocument;
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
};

/** Datos del material para el registro de errores. */
export interface VideoErrorContext {
  idCurso?: string;
  idModulo?: string;
  material?: string;
}

interface VideoPlayerProps {
  /** Enlace original del video (YouTube, Google Drive o archivo propio) */
  url: string;
  /** Mientras no cambie, se reutiliza el iframe y solo cambia su `src` (YouTube carga más rápido) */
  slotKey: string;
  errorContext?: VideoErrorContext;
  className?: string;
}

/** Tipo de conexión (solo Chrome Android) para el registro de errores. */
const getConnectionType = () => {
  const nav = navigator as Navigator & { connection?: { effectiveType?: string; type?: string; saveData?: boolean } };
  const c = nav.connection;
  if (!c) return undefined;
  return [c.type, c.effectiveType, c.saveData ? "ahorro-datos" : null].filter(Boolean).join(" ") || undefined;
};

/** Un aviso por video y por sesión, para no inundar el registro con reintentos. */
const reportedVideoErrors = new Set<string>();

/** Reproductor que ocupa todo su contenedor; el video se ajusta sin recortarse. */
export default function VideoPlayer({ url, slotKey, errorContext, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** WebKit iOS no aplica requestFullscreen a los iframes; simulamos “pantalla completa” con CSS. */
  const [immersive, setImmersive] = useState(false);
  /**
   * Código de `MediaError` si el `<video>` no se pudo reproducir (0 = sin código):
   * 2 red, 3 no se pudo decodificar, 4 formato o URL no soportados.
   */
  const [loadError, setLoadError] = useState<number | null>(null);
  /** Cambia en cada "Reintentar" para volver a montar el `<video>`. */
  const [attempt, setAttempt] = useState(0);

  const isYouTube = isYouTubeUrl(url);
  const isGoogleDrive = isGoogleDriveVideoUrl(url);
  const isEmbed = isYouTube || isGoogleDrive;
  const videoUrl = toPlayableVideoUrl(url);

  // Bloquear el menú contextual (descargar / guardar) sobre el video
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "VIDEO" || target.closest(".video-no-download")) {
        e.preventDefault();
      }
    };
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if ((target.tagName === "VIDEO" || target.closest(".video-no-download")) && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!getFullscreenNode());
    const events = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
    events.forEach((name) => document.addEventListener(name, handleFullscreenChange));
    return () => events.forEach((name) => document.removeEventListener(name, handleFullscreenChange));
  }, []);

  // Al cambiar de video se sale del modo inmersivo y se olvida el error anterior
  useEffect(() => {
    setImmersive(false);
    setLoadError(null);
    setAttempt(0);
  }, [url]);

  const handleVideoError = useCallback(() => {
    const error = videoRef.current?.error;
    // Código 1: lo canceló el usuario o el navegador (p. ej. al cambiar de video); no es una falla
    if (error?.code === 1) return;
    setLoadError(error?.code ?? 0);

    if (reportedVideoErrors.has(videoUrl)) return;
    reportedVideoErrors.add(videoUrl);
    CoursesService.reportVideoError({
      url: videoUrl,
      codigo: error?.code ?? null,
      mensaje: error?.message?.slice(0, 500) || undefined,
      ...errorContext,
      dispositivo: navigator.userAgent.slice(0, 500),
      conexion: getConnectionType(),
    }).catch(() => {
      // El registro es solo para diagnóstico: si falla, no molestamos al alumno
    });
  }, [videoUrl, errorContext]);

  const retry = () => {
    setLoadError(null);
    setAttempt((n) => n + 1);
  };

  const toggleFullscreen = useCallback(async () => {
    if (immersive) {
      setImmersive(false);
      return;
    }
    if (isAppleTouchDevice()) {
      const video = videoRef.current as AppleVideoElement | null;
      if (video?.webkitSupportsFullscreen && video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else {
        setImmersive(true);
      }
      return;
    }

    const el = (isEmbed ? iframeRef.current : videoRef.current) as FullscreenElement | null;
    if (!el) return;

    try {
      const doc = document as FullscreenDocument;
      if (!getFullscreenNode()) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      } else if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
      else if (doc.msExitFullscreen) await doc.msExitFullscreen();
    } catch (error) {
      console.error("Error al cambiar pantalla completa:", error);
    }
  }, [immersive, isEmbed]);

  const expanded = immersive || isFullscreen;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-black video-no-download",
        immersive
          ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]"
          : "h-full",
        className
      )}
    >
      {/* Pantalla completa: en mobile para todos los tipos; en desktop YouTube/Drive ya traen el suyo */}
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          "absolute right-3 top-3 z-20 h-9 w-9 touch-manipulation bg-black/50 text-white shadow-md hover:bg-black/70",
          isEmbed && !immersive && "sm:hidden"
        )}
        onClick={() => void toggleFullscreen()}
        title={expanded ? "Salir de pantalla completa" : "Pantalla completa"}
        aria-label={expanded ? "Salir de pantalla completa" : "Ver en pantalla completa"}
      >
        {expanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </Button>

      {isEmbed ? (
        <div
          className={cn(
            immersive ? "relative aspect-video w-full max-h-[min(100dvh,100svh)]" : "absolute inset-0"
          )}
        >
          <iframe
            ref={iframeRef}
            key={`embed-slot-${slotKey}`}
            src={videoUrl}
            title={isYouTube ? "Video de YouTube" : "Video de Google Drive"}
            className="absolute left-0 top-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ border: "none" }}
          />
          {isGoogleDrive && (
            <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-black/70 p-3 text-xs text-white">
              <p className="mb-2">Si el video no se muestra, puede requerir permisos de acceso.</p>
              <button
                type="button"
                className="text-orange-400 underline hover:text-orange-300"
                onClick={() => {
                  window.open(videoUrl.replace("/preview", "/view"), "_blank", "noopener,noreferrer");
                }}
              >
                Abrir en Google Drive
              </button>
            </div>
          )}
        </div>
      ) : (
        <video
          ref={videoRef}
          key={`${videoUrl}#${attempt}`}
          src={videoUrl}
          preload="metadata"
          onError={handleVideoError}
          controls
          playsInline
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          className="absolute left-0 top-0 h-full w-full"
          style={{
            objectFit: "contain",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            if (e.touches.length > 1) e.preventDefault();
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 1) e.preventDefault();
          }}
        />
      )}

      {!isEmbed && loadError !== null && (
        <div
          role="alert"
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center text-white"
        >
          <VideoOff className="h-8 w-8 text-white/70" aria-hidden />
          <div>
            <p className="font-medium">No se pudo cargar el video</p>
            <p className="mt-1 text-sm text-white/70">
              {loadError === 2 ? "Revisá tu conexión e intentá de nuevo." : "Intentá de nuevo o probá desde otro navegador."}
            </p>
          </div>
          <Button
            type="button"
            onClick={retry}
            className="h-12 min-w-40 touch-manipulation bg-orange-500 text-white hover:bg-orange-600"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
