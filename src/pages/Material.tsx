import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ViewerPlaylist from "@/components/ViewerPlaylist";
import VideoPlayer from "@/components/material/VideoPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentCourseContent, type StudentCourseContent } from "@/hooks/useStudentCourseContent";
import { useCellularDataWarning } from "@/hooks/useCellularDataWarning";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  buildPlaylist,
  getDocumentUrl,
  isMobileViewport,
  materialPath,
  openDocumentInNewTab,
  parseTypeSegment,
  playlistKey,
  saveLastViewed,
  type PlaylistItem,
} from "@/lib/viewerPlaylist";
import CoursesService from "@/services/coursesService";
import type { Modulo } from "@/types/types";

const splitList = (value?: string) =>
  value ? (value.includes("|||") ? value.split("|||") : [value]) : [];

const getVideos = (modulo: Modulo): string[] => {
  if (!modulo.url_video) return [];
  return Array.isArray(modulo.url_video) ? modulo.url_video : [modulo.url_video];
};

const isGoogleDriveDocument = (url: string) => {
  const lower = url.toLowerCase();
  return (
    lower.includes("drive.google.com") ||
    lower.includes("docs.google.com") ||
    lower.includes("googleusercontent.com")
  );
};

/** PDF con zoom inicial del 75%, con barra de herramientas para zoom y sin panel lateral */
const formatPDFUrl = (url: string) => `${url.split("#")[0]}#zoom=75&toolbar=1&navpanes=0&scrollbar=1`;


/** Página donde el alumno ve un documento o un video, con el resto del material al costado. */
export default function Material() {
  const { courseId = "", moduloId = "", tipo, index: indexParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data, isPending, isError } = useStudentCourseContent(courseId, user?.uid);

  const type = parseTypeSegment(tipo);
  const index = Number(indexParam ?? 0);
  const courseUrl = `/curso/${courseId}`;

  // Mismo corte que la lista lateral (md): por debajo, la lista va debajo del material
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(isMobileViewport());
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const playlist = useMemo(
    () => (data ? buildPlaylist(data.materias ?? [], data.modulos ?? [], data.modulos_habilitados ?? {}) : []),
    [data]
  );
  const flatItems = useMemo(() => playlist.flatMap((group) => group.items), [playlist]);
  const currentKey = type ? playlistKey(moduloId, type, index) : null;
  const currentPos = flatItems.findIndex((item) => item.key === currentKey);
  const current = currentPos >= 0 ? flatItems[currentPos] : null;
  const modulo = data?.modulos?.find((m) => m.id === moduloId) ?? null;
  const progress = data?.progreso ?? {};

  const isCompleted = (item: PlaylistItem) => progress[item.moduloId]?.[item.key] === true;

  // Anterior y siguiente disponibles, saltando los módulos bloqueados
  const prevItem = currentPos > 0 ? [...flatItems.slice(0, currentPos)].reverse().find((i) => i.enabled) : undefined;
  const nextItem = currentPos >= 0 ? flatItems.slice(currentPos + 1).find((i) => i.enabled) : undefined;

  const url = useMemo(() => {
    if (!modulo || !type) return "";
    const list = type === "document" ? splitList(modulo.url_archivo).filter((u) => u.trim()) : getVideos(modulo);
    return list[index]?.trim() ?? "";
  }, [modulo, type, index]);

  useEffect(() => {
    setDocLoading(true);
  }, [url]);

  /** Guarda el visto en el progreso compartido con la página del curso */
  const setCompleted = async (item: PlaylistItem, value: boolean) => {
    if (!user?.uid) return;
    const key = queryKeys.courseContent(courseId, user.uid);
    const apply = (completed: boolean) =>
      queryClient.setQueryData(key, (old: StudentCourseContent | undefined) =>
        old
          ? {
              ...old,
              progreso: {
                ...old.progreso,
                [item.moduloId]: { ...old.progreso?.[item.moduloId], [item.key]: completed },
              },
            }
          : old
      );

    apply(value);
    try {
      await CoursesService.markContentAsCompleted(user.uid, item.moduloId, item.index, item.type, value);
      void queryClient.invalidateQueries({ queryKey: queryKeys.studentHome(user.uid) });
    } catch (error) {
      console.error("Error marking content as completed:", error);
      apply(!value);
      toast.error("No se pudo guardar el progreso", { description: "Intentá nuevamente." });
    }
  };

  // Abrir un material lo marca como visto (igual que antes en los visores)
  const autoMarkedRef = useRef(new Set<string>());
  useEffect(() => {
    if (!current || !current.enabled) return;
    // Recordar el último material abierto para el botón "Continuar" del curso
    if (user?.uid) {
      saveLastViewed(user.uid, courseId, { moduloId: current.moduloId, type: current.type, index: current.index });
    }
    if (autoMarkedRef.current.has(current.key)) return;
    autoMarkedRef.current.add(current.key);
    if (!isCompleted(current)) void setCompleted(current, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de material
  }, [current?.key]);

  /** Cambiar de material reemplaza la entrada del historial: "atrás" siempre vuelve al curso */
  const goTo = (item: PlaylistItem) => {
    // En celular el documento se abre también en otra pestaña, dentro del mismo toque
    if (item.type === "document" && isMobileViewport()) {
      const target = data?.modulos?.find((m) => m.id === item.moduloId);
      const docUrl = target ? getDocumentUrl(target, item.index) : "";
      if (docUrl) openDocumentInNewTab(docUrl);
    }
    navigate(materialPath(courseId, item.moduloId, item.type, item.index), {
      replace: true,
      state: location.state,
    });
  };

  const close = () => {
    if ((location.state as { fromCourse?: boolean } | null)?.fromCourse) {
      navigate(-1);
    } else {
      navigate(courseUrl, { replace: true });
    }
  };

  const playlistPanel = (className?: string) => (
    <ViewerPlaylist
      groups={playlist}
      currentKey={currentKey}
      isCompleted={isCompleted}
      onSelect={goTo}
      className={className}
    />
  );

  // Con datos móviles (Android) se recomienda WiFi al mirar videos
  useCellularDataWarning(current?.type === "video" && current.enabled);

  const completed = current ? isCompleted(current) : false;
  const showMobileList = isMobile && !isPending && !!current && playlist.length > 0;
  const markButton = current && current.enabled && (
    <Button
      size="sm"
      onClick={() => void setCompleted(current, !completed)}
      className={cn(
        "h-9 shrink-0 gap-1.5 px-3 text-sm font-semibold text-white",
        completed ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
      )}
    >
      <CheckCircle2 className="h-4 w-4" />
      {completed ? "Visto" : (
        <>
          <span className="sm:hidden">Marcar visto</span>
          <span className="hidden sm:inline">Marcar como visto</span>
        </>
      )}
    </Button>
  );

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          Cargando material...
        </div>
      );
    }
    if (isError || !current || !modulo || !url) {
      return (
        <Notice
          title="No encontramos este material"
          description="Puede que se haya movido o ya no esté disponible."
          action={<Button onClick={close}>Volver al curso</Button>}
        />
      );
    }
    if (!current.enabled) {
      return (
        <Notice
          title="Módulo no disponible"
          description="Este módulo aún no está disponible. Los módulos se habilitarán progresivamente según el plan de estudios."
          action={<Button onClick={close}>Volver al curso</Button>}
        />
      );
    }
    if (current.type === "video") {
      return (
        <VideoPlayer
          url={url}
          slotKey={modulo.id}
          errorContext={{ idCurso: courseId, idModulo: modulo.id, material: current.name }}
        />
      );
    }
    // Los celulares no muestran PDFs dentro de la página: fila compacta para dejar lugar a la lista
    if (isMobile) {
      return (
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
            <FileText className="h-5 w-5 text-orange-500" />
          </span>
          <p className="min-w-0 flex-1 text-xs leading-snug text-slate-500 dark:text-slate-400">
            El documento se abre en una pestaña nueva para leerlo cómodo.
          </p>
          <Button className="h-10 shrink-0 gap-1.5" onClick={() => openDocumentInNewTab(url)}>
            <ExternalLink className="h-4 w-4" />
            Abrir
          </Button>
        </div>
      );
    }
    // Drive no se puede embeber
    if (isGoogleDriveDocument(url)) {
      return (
        <Notice
          icon={<FileText className="h-8 w-8 text-orange-500" />}
          title={current.name}
          description="Este documento se abre en una pestaña nueva."
          action={
            <Button className="gap-2" onClick={() => openDocumentInNewTab(url)}>
              <ExternalLink className="h-4 w-4" />
              Abrir documento
            </Button>
          }
        />
      );
    }
    return (
      <div className="relative h-full">
        {docLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              <p className="text-sm text-slate-600 dark:text-slate-300">Cargando documento...</p>
            </div>
          </div>
        )}
        <iframe
          key={url}
          src={formatPDFUrl(url)}
          title={current.name}
          className="h-full w-full border-0"
          allow="fullscreen"
          onLoad={() => setDocLoading(false)}
        />
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      {/* Una sola barra compacta para dejar el máximo espacio al material */}
      <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-2 py-1.5 sm:px-4 dark:border-slate-800">
        <div className="min-w-0 flex-1 pl-1 sm:pl-0">
          {modulo && (
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">{modulo.titulo}</p>
          )}
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
            {current?.name ?? "Material"}
          </h1>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {markButton}
          <NavButtons prev={prevItem} next={nextItem} onGo={goTo} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          className="h-10 w-10 shrink-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Volver al curso"
          title="Volver al curso"
        >
          <X className="!h-7 !w-7" />
        </Button>
      </header>

      {/* Desktop: lista a la izquierda y material al lado. Mobile: video 16:9 arriba y la lista debajo */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {playlistPanel("hidden md:flex")}
        <main
          className={cn(
            "min-w-0 md:min-h-0 md:flex-1",
            showMobileList ? "shrink-0" : "min-h-0 flex-1",
            showMobileList && current?.type === "video" && "aspect-video md:aspect-auto"
          )}
        >
          {renderContent()}
        </main>
        {showMobileList &&
          playlistPanel("md:hidden w-full xl:w-full min-h-0 flex-1 border-r-0 border-t")}
      </div>

      {/* En celular: visto y anterior/siguiente abajo, con botones cómodos de tocar */}
      {current && (
        <footer className="flex shrink-0 items-center gap-2 border-t border-slate-200 px-2 py-1.5 sm:hidden dark:border-slate-800">
          <NavButtons prev={prevItem} next={nextItem} onGo={goTo} wide>
            <div className="flex flex-1 justify-center">{markButton}</div>
          </NavButtons>
        </footer>
      )}
    </div>
  );
}

function NavButtons({
  prev,
  next,
  onGo,
  wide = false,
  children,
}: {
  prev?: PlaylistItem;
  next?: PlaylistItem;
  onGo: (item: PlaylistItem) => void;
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <>
      <Button
        variant="ghost"
        size={wide ? "default" : "icon"}
        className={cn("shrink-0", wide ? "h-10 gap-1 px-2" : "h-9 w-9")}
        disabled={!prev}
        onClick={() => prev && onGo(prev)}
        title={prev ? `Anterior: ${prev.name}` : undefined}
        aria-label="Material anterior"
      >
        <ChevronLeft className="h-5 w-5" />
        {wide && "Anterior"}
      </Button>
      {children}
      <Button
        variant="ghost"
        size={wide ? "default" : "icon"}
        className={cn("shrink-0", wide ? "h-10 gap-1 px-2" : "h-9 w-9")}
        disabled={!next}
        onClick={() => next && onGo(next)}
        title={next ? `Siguiente: ${next.name}` : undefined}
        aria-label="Material siguiente"
      >
        {wide && "Siguiente"}
        <ChevronRight className="h-5 w-5" />
      </Button>
    </>
  );
}

function Notice({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-sm space-y-4 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-50 dark:bg-orange-950/40">
          {icon ?? <AlertTriangle className="h-7 w-7 text-amber-500" />}
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
