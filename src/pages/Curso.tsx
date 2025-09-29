import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

  // Estructura de datos como en tu implementación real
  const courseData = {
    id: "fitness-grupal",
    title: "Instructorado de fitness grupal",
    description:
      "Formación completa en fitness grupal con metodología actualizada y base científica aplicada.",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=300&fit=crop",
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

  // Estados
  const [activeTab, setActiveTab] = useState("overview");
  const [moduleSheetOpen, setModuleSheetOpen] = useState(false);

  // Calcular progreso total
  const getInitialCompletedContents = () => {
    const completed = [];
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

  // Helper functions
  const toggleContentComplete = (contentId) => {
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

  const getIcon = (type) => {
    switch (type) {
      case "VIDEO":
        return <Play className="w-4 h-4" />;
      case "PDF":
        return <FileText className="w-4 h-4" />;
      case "EVALUATION":
        return <HelpCircle className="w-4 h-4" />;
      case "IMAGE":
        return <FileImage className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  const getAllContents = () => {
    return courseData.modules.flatMap((module) =>
      module.contents.map((content) => ({
        ...content,
        moduleName: module.title,
      }))
    );
  };

  const getNextPendingContent = () => {
    for (const module of courseData.modules) {
      const pendingContent = module.contents.find(
        (content) => !completedContents.includes(content.id)
      );

      if (pendingContent) {
        return {
          ...pendingContent,
          moduleId: module.id,
          moduleName: module.title,
        };
      }
    }

    return null;
  };

  const nextPendingContent = getNextPendingContent();

  const scrollToContent = (contentId: string) => {
    setTimeout(() => {
      const element = document.getElementById(`content-${contentId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 250);
  };

  const handleSelectModule = (moduleId: string) => {
    setActiveTab(moduleId);
    setModuleSheetOpen(false);
  };

  const handleSelectContent = (moduleId: string, contentId: string) => {
    setActiveTab(moduleId);
    setModuleSheetOpen(false);
    scrollToContent(contentId);
  };

  const handleContinueLearning = () => {
    if (nextPendingContent) {
      setActiveTab(nextPendingContent.moduleId);
      scrollToContent(nextPendingContent.id);
    } else {
      setActiveTab("overview");
    }
  };

  const isModuleView = courseData.modules.some(
    (module) => module.id === activeTab
  );

  const renderContentItem = (content, showModule = false) => (
    <Card
      id={`content-${content.id}`}
      key={content.id}
      className="hover:shadow-sm transition-all duration-200 border-gray-100 dark:border-gray-800 cursor-pointer"
      onClick={() => handleContentClick(content)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleContentComplete(content.id);
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
              completedContents.includes(content.id)
                ? "bg-orange-500 border-orange-500 text-white"
                : "border-gray-300 hover:border-orange-400"
            }`}
          >
            {completedContents.includes(content.id) && (
              <CheckCircle2 className="w-3 h-3" />
            )}
          </button>

          {content.thumbnail && content.type === "VIDEO" ? (
            <div className="relative flex-shrink-0">
              <img
                src={content.thumbnail}
                alt={content.title}
                className="w-14 h-10 object-cover rounded-md"
              />
              <div className="absolute inset-0 bg-black/30 rounded-md flex items-center justify-center">
                <Play className="w-3 h-3 text-white" />
              </div>
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(
                content.type
              )}`}
            >
              {getIcon(content.type)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {content.title}
              </h4>
              <Badge
                variant="outline"
                className="text-xs border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              >
                {content.type}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
              {content.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {showModule && (
                <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                  {content.moduleName}
                </span>
              )}
              {content.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{content.duration}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleContentClick(content);
            }}
            className="text-gray-600 hover:text-orange-600"
          >
            {content.type === "VIDEO" ? (
              <Play className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header minimalista */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {courseData.title}
          </h1>
          {/* Descripción solo visible en desktop */}
          <p className="text-gray-500 dark:text-gray-400 mt-1 hidden sm:block line-clamp-1">
            {courseData.description}
          </p>
        </div>
      </div>

      {/* Progress Card simplificada */}
      <Card className="border-gray-100 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Progreso del Curso
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {completedCount} de {totalContents} elementos
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {progressPercentage}%
              </div>
              <Trophy className="w-6 h-6 mx-auto mt-1 text-orange-500" />
            </div>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full">
            <div
              className="h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Tabs - más minimalistas */}
      <div className="hidden sm:block">
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Home className="w-4 h-4" />
            Inicio
          </button>
          <button
            onClick={() => setActiveTab("all-content")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "all-content"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Contenido
          </button>
          {courseData.modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveTab(module.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === module.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-32">{module.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courseData.modules.map((module) => {
              const moduleCompleted = module.contents.filter((c) =>
                completedContents.includes(c.id)
              ).length;
              const moduleProgress = Math.round(
                (moduleCompleted / module.contents.length) * 100
              );

              return (
                <Card
                  key={module.id}
                  className="cursor-pointer hover:shadow-sm transition-all duration-200 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  onClick={() => setActiveTab(module.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
                        {module.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                      >
                        {moduleCompleted}/{module.contents.length}
                      </Badge>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                      <div
                        className="h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${moduleProgress}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span>
                        {
                          module.contents.filter((c) => c.type === "VIDEO")
                            .length
                        }{" "}
                        videos
                      </span>
                      <span>
                        {module.contents.filter((c) => c.type === "PDF").length}{" "}
                        PDFs
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* All Content Tab */}
        {activeTab === "all-content" && (
          <div className="space-y-3">
            {getAllContents().map((content) =>
              renderContentItem(content, true)
            )}
          </div>
        )}

        {/* Individual Module Tabs */}
        {courseData.modules.map(
          (module) =>
            activeTab === module.id && (
              <div key={module.id} className="space-y-3">
                <Card className="border-gray-100 dark:border-gray-800">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {module.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {
                          module.contents.filter((c) =>
                            completedContents.includes(c.id)
                          ).length
                        }{" "}
                        / {module.contents.length} completados
                      </span>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(
                              (module.contents.filter((c) =>
                                completedContents.includes(c.id)
                              ).length /
                                module.contents.length) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {module.contents
                    .sort((a, b) => a.order - b.order)
                    .map((content) => renderContentItem(content))}
                </div>
              </div>
            )
        )}
      </div>

      {/* Mobile Fixed Bottom Tabs - minimalistas */}
      <Sheet open={moduleSheetOpen} onOpenChange={setModuleSheetOpen}>
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 sm:hidden z-50">
          <div className="flex items-center justify-around py-2 px-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex flex-col items-center justify-center gap-1 rounded-md py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === "overview" ? "text-orange-500" : "text-gray-500"
              }`}
              aria-label="Ir al inicio del curso"
            >
              <Home className="h-5 w-5" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setActiveTab("all-content")}
              className={`flex flex-col items-center justify-center gap-1 rounded-md py-2 px-3 text-xs font-medium transition-colors ${
                activeTab === "all-content" ? "text-orange-500" : "text-gray-500"
              }`}
              aria-label="Ver todo el contenido"
            >
              <BookOpen className="h-5 w-5" />
              <span>Contenido</span>
            </button>

            <SheetTrigger asChild>
              <button
                className={`flex flex-col items-center justify-center gap-1 rounded-md py-2 px-3 text-xs font-medium transition-colors ${
                  moduleSheetOpen || isModuleView
                    ? "text-orange-500"
                    : "text-gray-500"
                }`}
                aria-label="Abrir navegación de módulos"
              >
                <GraduationCap className="h-5 w-5" />
                <span>Módulos</span>
              </button>
            </SheetTrigger>

            <button
              onClick={handleContinueLearning}
              disabled={!nextPendingContent}
              className={`flex flex-col items-center justify-center gap-1 rounded-md py-2 px-3 text-xs font-medium transition-colors ${
                nextPendingContent
                  ? "text-orange-500"
                  : "text-gray-400 dark:text-gray-600"
              } ${
                nextPendingContent
                  ? ""
                  : "cursor-not-allowed"
              }`}
              aria-label="Continuar con el siguiente contenido"
            >
              <Play className="h-5 w-5" />
              <span>Continuar</span>
            </button>
          </div>
        </nav>

        <SheetContent
          side="bottom"
          className="sm:hidden max-h-[80vh] overflow-hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-0 pb-6"
        >
          <SheetHeader className="px-4 pt-4 pb-3 text-left">
            <SheetTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Navegación del curso
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-500 dark:text-gray-400">
              Selecciona un módulo o un contenido específico para continuar dentro del curso.
            </SheetDescription>
          </SheetHeader>

          <div className="max-h-[65vh] overflow-y-auto px-4 space-y-5">
            {courseData.modules.map((module, index) => {
              const moduleCompleted = module.contents.filter((content) =>
                completedContents.includes(content.id)
              ).length;
              const moduleProgress = Math.round(
                (moduleCompleted / module.contents.length) * 100
              );

              return (
                <div
                  key={module.id}
                  className="rounded-xl border border-gray-100 bg-white/95 p-4 shadow-[0_0_20px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900/95"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-500">
                        Módulo {index + 1}
                      </p>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {module.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {module.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                      >
                        {moduleCompleted}/{module.contents.length}
                      </Badge>
                      <Progress value={moduleProgress} className="mt-2 h-1.5 w-20" />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 w-full text-xs"
                    onClick={() => handleSelectModule(module.id)}
                  >
                    Ver módulo completo
                  </Button>

                  <div className="mt-4 space-y-2">
                    {module.contents.map((content) => {
                      const isCompleted = completedContents.includes(content.id);
                      const icon = React.cloneElement(getIcon(content.type), {
                        className: "h-4 w-4",
                      });

                      return (
                        <button
                          key={content.id}
                          onClick={() => handleSelectContent(module.id, content.id)}
                          className="w-full rounded-lg border border-gray-100 bg-white/80 px-3 py-2 text-left transition-colors hover:border-orange-200 hover:bg-orange-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-orange-400/60 dark:hover:bg-orange-500/10"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 dark:bg-orange-500/15">
                              {icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                {content.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {content.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              {content.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{content.duration}</span>
                                </div>
                              )}
                              {isCompleted && (
                                <CheckCircle2 className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ModuleView;
