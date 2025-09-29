import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

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
  GraduationCap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
    subjects: [
      {
        id: "subject-1",
        name: "Anatomía aplicada",
        description:
          "Bases anatómicas imprescindibles para entender el movimiento humano y evitar lesiones.",
        modules: [
          {
            id: "modulo-1",
            title: "Estructura ósea y articular",
            summary: "Comprendé cómo se organiza el cuerpo para el movimiento.",
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
            id: "modulo-1b",
            title: "Fisiología del ejercicio",
            summary: "Procesos fisiológicos clave para planificar clases seguras.",
            contents: [
              {
                id: "content-6",
                title: "Sistemas energéticos",
                description: "Cómo responde el cuerpo durante el ejercicio grupal.",
                type: "VIDEO",
                url: "https://example.com/video4",
                duration: "45 min",
                order: 1,
                completed: false,
              },
              {
                id: "content-7",
                title: "Guía rápida de fisiología",
                description: "Resumen descargable para repasar antes de las clases.",
                type: "PDF",
                url: "https://example.com/pdf2",
                order: 2,
                completed: false,
              },
            ],
          },
        ],
      },
      {
        id: "subject-2",
        name: "Metodología y evaluación",
        description:
          "Herramientas prácticas para planificar, ejecutar y medir sesiones efectivas.",
        modules: [
          {
            id: "modulo-2",
            title: "Metodología del Entrenamiento",
            summary: "Diseñá rutinas dinámicas y progresivas.",
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
          {
            id: "modulo-3",
            title: "Planificación de clases",
            summary: "Organizá módulos listos para llevar al salón.",
            contents: [
              {
                id: "content-8",
                title: "Plantilla de clase",
                description: "Descargá un formato editable para planificar tus sesiones.",
                type: "PDF",
                url: "https://example.com/pdf3",
                order: 1,
                completed: false,
              },
              {
                id: "content-9",
                title: "Clase modelo guiada",
                description: "Video completo con indicaciones para replicar con tu grupo.",
                type: "VIDEO",
                url: "https://example.com/video5",
                duration: "35 min",
                order: 2,
                completed: false,
              },
            ],
          },
        ],
      },
    ],
  };

  // Estados
  const [activeSubject, setActiveSubject] = useState(
    courseData.subjects[0]?.id ?? ""
  );

  // Calcular progreso total
  const getInitialCompletedContents = () => {
    const completed = [];
    courseData.subjects.forEach((subject) => {
      subject.modules.forEach((module) => {
        module.contents.forEach((content) => {
          if (content.completed) {
            completed.push(content.id);
          }
        });
      });
    });
    return completed;
  };

  const [completedContents, setCompletedContents] = useState(
    getInitialCompletedContents()
  );

  const totalContents = courseData.subjects
    .flatMap((subject) => subject.modules)
    .reduce((acc, module) => acc + module.contents.length, 0);
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

  const subjectsProgress = useMemo(() => {
    return courseData.subjects.map((subject) => {
      const subjectContents = subject.modules.flatMap((module) => module.contents);
      const completed = subjectContents.filter((content) =>
        completedContents.includes(content.id)
      ).length;
      return {
        subjectId: subject.id,
        completed,
        total: subjectContents.length,
        percentage:
          subjectContents.length > 0
            ? Math.round((completed / subjectContents.length) * 100)
            : 0,
      };
    });
  }, [completedContents]);

  const getSubjectProgress = (subjectId) =>
    subjectsProgress.find((subject) => subject.subjectId === subjectId) ?? {
      completed: 0,
      total: 0,
      percentage: 0,
    };

  const renderContentItem = (content, showModule = false) => (
    <Card
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

  const activeSubjectData = courseData.subjects.find(
    (subject) => subject.id === activeSubject
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

      {/* Navegación por materias */}
      <div className="sticky top-0 z-40 -mx-4 px-4 pb-2 bg-white dark:bg-gray-950 sm:static sm:-mx-0">
        <ScrollArea className="w-full" type="scroll">
          <div className="flex gap-2 py-2">
            {courseData.subjects.map((subject) => {
              const subjectProgress = getSubjectProgress(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => setActiveSubject(subject.id)}
                  className={`flex min-w-[180px] flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 sm:min-w-[220px] ${
                    activeSubject === subject.id
                      ? "border-orange-400 bg-orange-50/70 text-orange-600 dark:border-orange-500/70 dark:bg-orange-500/10 dark:text-orange-200"
                      : "border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                  aria-pressed={activeSubject === subject.id}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <GraduationCap className="h-4 w-4" />
                      <span className="truncate">{subject.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        activeSubject === subject.id
                          ? "border-orange-400 text-orange-500 dark:border-orange-500/70 dark:text-orange-200"
                          : "border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {subjectProgress.percentage}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                    {subject.description}
                  </p>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      {/* Contenido por materia */}
      {activeSubjectData && (
        <div className="space-y-4">
          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {activeSubjectData.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activeSubjectData.description}
                  </p>
                </div>
                {(() => {
                  const progress = getSubjectProgress(activeSubjectData.id);
                  return (
                    <div className="flex items-center gap-3 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600 dark:bg-orange-500/10 dark:text-orange-200">
                      <Trophy className="h-4 w-4" />
                      {progress.completed}/{progress.total} completados
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Accordion
            key={activeSubjectData.id}
            type="multiple"
            defaultValue={activeSubjectData.modules.length ? [activeSubjectData.modules[0].id] : []}
            className="space-y-3"
          >
            {activeSubjectData.modules.map((module) => {
              const moduleCompleted = module.contents.filter((content) =>
                completedContents.includes(content.id)
              ).length;
              const moduleProgress = Math.round(
                (moduleCompleted / module.contents.length) * 100
              );

              return (
                <AccordionItem
                  value={module.id}
                  key={module.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900"
                >
                  <AccordionTrigger className="px-4 py-3 text-left text-base font-semibold text-gray-900 transition-all hover:bg-orange-50/60 hover:no-underline data-[state=open]:bg-orange-50/80 dark:text-gray-100 dark:hover:bg-orange-500/10">
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-orange-500 dark:text-orange-200">
                          Módulo
                        </p>
                        <h3 className="text-lg font-semibold">{module.title}</h3>
                        {module.summary && (
                          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            {module.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <Badge
                          variant="outline"
                          className="border-gray-200 text-xs uppercase tracking-wide dark:border-gray-700"
                        >
                          {moduleCompleted}/{module.contents.length} completados
                        </Badge>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                              style={{ width: `${moduleProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {moduleProgress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 bg-gray-50 px-4 pb-4 pt-2 dark:bg-gray-950/60">
                    {module.contents
                      .sort((a, b) => a.order - b.order)
                      .map((content) => renderContentItem(content))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default ModuleView;
