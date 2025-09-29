import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Trophy,
  Play,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileImage,
  BookOpen,
  GraduationCap,
  Video,
  Home,
} from "lucide-react";

const ModuleView = () => {
  const navigate = useNavigate();

  const courseData = {
    id: "fitness-grupal",
    title: "Instructorado de fitness grupal",
    description:
      "Formación completa en fitness grupal con metodología actualizada y base científica aplicada.",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    level: "Intermedio",
    modules: [
      {
        id: "modulo-1",
        title: "Anatomía y Fisiología",
        description: "Fundamentos del cuerpo humano y su funcionamiento",
        contents: [
          {
            id: "content-1",
            title: "Anatomía del esqueleto humano",
            description:
              "Introducción clara al esqueleto humano, clasificación y funciones de los huesos",
            type: "VIDEO",
            url: "https://example.com/video1",
            thumbnail:
              "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
            duration: "70 min",
            order: 1,
            completed: true,
          },
          {
            id: "content-2",
            title: "Aparato locomotor",
            description: "Material teórico complementario",
            type: "PDF",
            url: "https://example.com/pdf1",
            order: 2,
            completed: true,
          },
          {
            id: "content-3",
            title: "Articulaciones",
            description:
              "Tipos de articulaciones y su función en el movimiento",
            type: "VIDEO",
            url: "https://example.com/video2",
            thumbnail:
              "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop",
            duration: "60 min",
            order: 3,
            completed: false,
          },
        ],
      },
      {
        id: "modulo-2",
        title: "Metodología del Entrenamiento",
        description: "Fundamentos científicos del entrenamiento deportivo",
        contents: [
          {
            id: "content-4",
            title: "Principios del Entrenamiento",
            description: "Fundamentos científicos del entrenamiento deportivo",
            type: "VIDEO",
            url: "https://example.com/video3",
            duration: "50 min",
            order: 1,
            completed: false,
          },
          {
            id: "content-5",
            title: "Evaluación Diagnóstica",
            description: "Test de conocimientos iniciales",
            type: "EVALUATION",
            url: "https://example.com/test1",
            order: 2,
            completed: false,
          },
        ],
      },
    ],
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const [activeSection, setActiveSection] = useState("overview");

  const getInitialCompletedContents = () => {
    const completed: string[] = [];
    courseData.modules.forEach((module) => {
      module.contents.forEach((content) => {
        if (content.completed) {
          completed.push(content.id);
        }
      });
    });
    return completed;
  };

  const [completedContents, setCompletedContents] = useState(
    getInitialCompletedContents()
  );

  const totalContents = courseData.modules.reduce(
    (acc, module) => acc + module.contents.length,
    0
  );

  const completedCount = completedContents.length;

  const progressPercentage =
    totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  const toggleContentComplete = (contentId: string) => {
    setCompletedContents((prev) =>
      prev.includes(contentId)
        ? prev.filter((id) => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleContentClick = (content) => {
    if (content.type === "VIDEO") {
      console.log("Opening video:", content.title);
    } else {
      window.open(content.url, "_blank");
    }
  };

  const sections = [
    { id: "overview", label: "Resumen", icon: Home },
    { id: "modules", label: "Temas", icon: FileText },
    { id: "all", label: "Todo", icon: BookOpen },
  ];

  const typeLabels = {
    VIDEO: "Video",
    PDF: "Material",
    EVALUATION: "Evaluación",
    IMAGE: "Imagen",
  } as Record<string, string>;

  const typeStyles = {
    VIDEO: "bg-orange-500/10 text-orange-500",
    PDF: "bg-blue-500/10 text-blue-500",
    EVALUATION: "bg-violet-500/10 text-violet-500",
    IMAGE: "bg-emerald-500/10 text-emerald-500",
    DEFAULT: "bg-slate-500/10 text-slate-500",
  } as Record<string, string>;

  const getAllContents = () => {
    return courseData.modules.flatMap((module) =>
      module.contents.map((content) => ({
        ...content,
        moduleName: module.title,
      }))
    );
  };

  const totals = useMemo(() => {
    let videos = 0;
    let pdfs = 0;
    let evaluations = 0;

    courseData.modules.forEach((module) => {
      module.contents.forEach((content) => {
        if (content.type === "VIDEO") videos += 1;
        if (content.type === "PDF") pdfs += 1;
        if (content.type === "EVALUATION") evaluations += 1;
      });
    });

    return { videos, pdfs, evaluations };
  }, [courseData.modules]);

  const nextContent = useMemo(() => {
    for (const module of courseData.modules) {
      const pending = module.contents
        .sort((a, b) => a.order - b.order)
        .find((content) => !completedContents.includes(content.id));

      if (pending) {
        return {
          ...pending,
          moduleName: module.title,
        };
      }
    }
    return null;
  }, [completedContents, courseData.modules]);

  const renderContentItem = (content, showModule = false, highlight = false) => {
    const isCompleted = completedContents.includes(content.id);
    const IconContainer = () => {
      if (content.thumbnail && content.type === "VIDEO") {
        return (
          <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-900 sm:h-24 sm:w-32">
            <img
              src={content.thumbnail}
              alt={content.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-4 w-4 text-white" />
            </div>
          </div>
        );
      }

      const style = typeStyles[content.type] || typeStyles.DEFAULT;

      return (
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${style} sm:h-14 sm:w-14`}
        >
          {content.type === "VIDEO" && <Play className="h-5 w-5" />}
          {content.type === "PDF" && <FileText className="h-5 w-5" />}
          {content.type === "EVALUATION" && <HelpCircle className="h-5 w-5" />}
          {content.type === "IMAGE" && <FileImage className="h-5 w-5" />}
          {!["VIDEO", "PDF", "EVALUATION", "IMAGE"].includes(content.type) && (
            <FileText className="h-5 w-5" />
          )}
        </div>
      );
    };

    return (
      <Card
        key={content.id}
        className={`cursor-pointer border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
          highlight
            ? "border-orange-300/70 bg-orange-50/70 dark:border-orange-500/30 dark:bg-orange-500/10"
            : "border-gray-200 dark:border-gray-800"
        }`}
        onClick={() => handleContentClick(content)}
      >
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3 sm:flex-col sm:items-start">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleContentComplete(content.id);
              }}
              aria-pressed={isCompleted}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all sm:order-2 ${
                isCompleted
                  ? "border-orange-500 bg-orange-500 text-white shadow"
                  : "border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-gray-400" />
              )}
              <span className="sr-only">
                {isCompleted ? "Marcar como pendiente" : "Marcar como completado"}
              </span>
            </button>

            <IconContainer />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {content.title}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {typeLabels[content.type] || content.type}
                  </Badge>
                  {showModule && content.moduleName && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {content.moduleName}
                    </span>
                  )}
                </div>
                {content.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {content.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContentClick(content);
                  }}
                  className="bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  {content.type === "VIDEO" ? (
                    <>
                      <Play className="h-4 w-4" />
                      Ver video
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Abrir recurso
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {content.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{content.duration}</span>
                </div>
              )}
              {showModule && content.moduleName && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{content.moduleName}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="-ml-2 flex items-center gap-2 px-2"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-900 text-white shadow-lg dark:border-gray-700">
        <img
          src={courseData.image}
          alt={courseData.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-transparent" />
        <div className="relative flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
            <GraduationCap className="h-4 w-4" />
            {courseData.level}
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {courseData.title}
            </h1>
            <p className="text-sm text-white/80 sm:text-base">
              {courseData.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>{totals.videos} videos</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{totals.pdfs} materiales</span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>{totals.evaluations} evaluaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{courseData.modules.length} módulos</span>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Progreso general</span>
              <span>
                {completedCount}/{totalContents} · {progressPercentage}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 overflow-hidden rounded-full bg-white/30" />
            <div className="flex items-center gap-3 text-sm text-white/80">
              <Trophy className="h-4 w-4" />
              <span>
                Sigue avanzando para completar el curso y desbloquear tu certificado
              </span>
            </div>
          </div>

          {nextContent && (
            <Button
              onClick={() => handleContentClick(nextContent)}
              className="self-start rounded-full bg-white px-6 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100"
            >
              <Play className="h-4 w-4" />
              Continuar: {nextContent.title}
            </Button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Tiempo invertido
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-2 pb-4">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ~{Math.max(1, Math.round((completedCount / Math.max(1, totalContents)) * 6))}h
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              estimadas
            </span>
          </CardContent>
        </Card>
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Contenido completado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-2 pb-4">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {completedCount}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              de {totalContents}
            </span>
          </CardContent>
        </Card>
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Siguiente objetivo
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {nextContent ? (
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {nextContent.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {nextContent.moduleName}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ¡Felicitaciones! Ya completaste todo el contenido disponible.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="-mx-2 flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-orange-500 bg-orange-500 text-white shadow"
                  : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {activeSection === "overview" && (
        <section className="space-y-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Avance por módulos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseData.modules.map((module) => {
                const moduleCompleted = module.contents.filter((c) =>
                  completedContents.includes(c.id)
                ).length;
                const moduleProgress = Math.round(
                  (moduleCompleted / module.contents.length) * 100
                );
                const videos = module.contents.filter((c) => c.type === "VIDEO").length;
                const pdfs = module.contents.filter((c) => c.type === "PDF").length;

                return (
                  <div
                    key={module.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {module.description}
                        </p>
                      </div>
                      <Badge className="self-start bg-white text-xs font-semibold text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200">
                        {moduleCompleted}/{module.contents.length} completados
                      </Badge>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                        style={{ width: `${moduleProgress}%` }}
                      ></div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Video className="h-4 w-4" /> {videos} videos
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" /> {pdfs} PDFs
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {nextContent && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tu próximo paso
              </h2>
              {renderContentItem(nextContent, true, true)}
            </div>
          )}
        </section>
      )}

      {activeSection === "modules" && (
        <section className="space-y-3">
          <Accordion type="single" collapsible className="space-y-3">
            {courseData.modules.map((module) => {
              const moduleCompleted = module.contents.filter((c) =>
                completedContents.includes(c.id)
              ).length;
              const moduleProgress = Math.round(
                (moduleCompleted / module.contents.length) * 100
              );

              return (
                <AccordionItem
                  key={module.id}
                  value={module.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                >
                  <AccordionTrigger className="px-4 text-left text-base font-semibold text-gray-900 hover:no-underline dark:text-gray-100 sm:px-6">
                    <div className="flex w-full flex-col gap-2 text-left">
                      <span>{module.title}</span>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span>
                          {moduleCompleted}/{module.contents.length} completados
                        </span>
                        <span>·</span>
                        <span>{moduleProgress}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 sm:px-6">
                    <div className="space-y-3">
                      {module.contents
                        .sort((a, b) => a.order - b.order)
                        .map((content) =>
                          renderContentItem(
                            {
                              ...content,
                              moduleName: module.title,
                            },
                            true
                          )
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      )}

      {activeSection === "all" && (
        <section className="space-y-3">
          {getAllContents().map((content) => renderContentItem(content, true))}
        </section>
      )}
    </div>
  );
};

export default ModuleView;
