import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Download, Play, Trophy } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CourseContent = {
  id: string;
  title: string;
  description: string;
  type: "VIDEO" | "PDF" | "EVALUATION";
  url: string;
  order: number;
  duration?: string;
  thumbnail?: string;
  completed?: boolean;
};

type CourseModule = {
  id: string;
  title: string;
  summary?: string;
  contents: CourseContent[];
};

type CourseSubject = {
  id: string;
  name: string;
  description: string;
  modules: CourseModule[];
};

const courseData: {
  id: string;
  title: string;
  description: string;
  subjects: CourseSubject[];
} = {
  id: "fitness-grupal",
  title: "Instructorado de fitness grupal",
  description:
    "Formación completa en fitness grupal con metodología actualizada y base científica aplicada.",
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
              description: "Tipos de articulaciones y su función en el movimiento",
              type: "VIDEO",
              url: "https://example.com/video2",
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

const ModuleView = () => {
  const navigate = useNavigate();
  const [activeSubject, setActiveSubject] = useState<string>(
    courseData.subjects[0]?.id ?? ""
  );

  const [completedContents, setCompletedContents] = useState<string[]>(() => {
    const completed: string[] = [];

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
  });

  const totalContents = courseData.subjects
    .flatMap((subject) => subject.modules)
    .reduce((acc, module) => acc + module.contents.length, 0);
  const completedCount = completedContents.length;
  const progressPercentage =
    totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

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

  const getSubjectProgress = (subjectId: string) =>
    subjectsProgress.find((subject) => subject.subjectId === subjectId) ?? {
      completed: 0,
      total: 0,
      percentage: 0,
    };

  const toggleContentComplete = (contentId: string) => {
    setCompletedContents((prev) =>
      prev.includes(contentId)
        ? prev.filter((id) => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleContentClick = (content: CourseContent) => {
    if (content.type === "VIDEO") {
      console.log("Abrir video", content.title);
      return;
    }

    window.open(content.url, "_blank", "noopener,noreferrer");
  };

  const renderContentItem = (content: CourseContent) => {
    const isCompleted = completedContents.includes(content.id);

    return (
      <Card
        key={content.id}
        role="listitem"
        className="border-slate-200 bg-white shadow-none transition hover:border-orange-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <CardContent className="flex items-start gap-3 p-3 sm:p-4">
          <button
            onClick={() => toggleContentComplete(content.id)}
            className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs transition ${
              isCompleted
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-slate-300 text-transparent"
            }`}
            aria-label={
              isCompleted
                ? `Marcar ${content.title} como pendiente`
                : `Marcar ${content.title} como completado`
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {content.title}
              </h4>
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
              >
                {content.type}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {content.description}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              {content.duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {content.duration}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-orange-500"
            onClick={() => handleContentClick(content)}
          >
            {content.type === "VIDEO" ? (
              <Play className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-slate-200 bg-white shadow-sm hover:border-orange-200 hover:bg-orange-50 dark:border-slate-800 dark:bg-slate-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
            {courseData.title}
          </h1>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {courseData.description}
          </p>
        </div>
      </header>

      <Card className="border-slate-200 bg-orange-50/60 shadow-none dark:border-slate-800 dark:bg-orange-500/5">
        <CardHeader className="space-y-1 pb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-600 dark:text-orange-300">
            Tu progreso general
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {completedCount} de {totalContents} contenidos completados
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Actualizado automáticamente al marcar cada recurso
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-orange-600 shadow-sm dark:bg-orange-500/10 dark:text-orange-200">
              <Trophy className="h-4 w-4" /> {progressPercentage}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full rounded-full bg-orange-100 dark:bg-orange-500/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeSubject} onValueChange={setActiveSubject} className="flex flex-1 flex-col gap-4">
        <div className="sticky top-0 z-10 -mx-4 -mt-2 bg-gradient-to-b from-white via-white to-transparent px-4 pb-2 dark:from-slate-950 dark:via-slate-950 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <TabsList className="flex w-full items-stretch gap-2 overflow-x-auto rounded-2xl bg-transparent p-0">
            {courseData.subjects.map((subject) => {
              const progress = getSubjectProgress(subject.id);

              return (
                <TabsTrigger
                  key={subject.id}
                  value={subject.id}
                  className="flex min-w-[180px] flex-1 flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-600 shadow-sm transition data-[state=active]:border-orange-400 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:data-[state=active]:border-orange-500/70 dark:data-[state=active]:bg-orange-500/10 dark:data-[state=active]:text-orange-200"
                >
                  <span className="truncate text-xs font-medium uppercase tracking-wide text-orange-500/80 dark:text-orange-300/80">
                    Materia
                  </span>
                  <span className="truncate text-sm font-semibold">
                    {subject.name}
                  </span>
                  <span className="line-clamp-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                    {subject.description}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-orange-100/70 px-2 py-1 text-[10px] font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-200">
                    {progress.percentage}% completado
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {courseData.subjects.map((subject) => {
          const subjectProgress = getSubjectProgress(subject.id);

          return (
            <TabsContent key={subject.id} value={subject.id} className="m-0 flex flex-col gap-4">
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-orange-500 dark:text-orange-300">
                        {subject.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {subject.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-200">
                      <Trophy className="h-4 w-4" />
                      {subjectProgress.completed}/{subjectProgress.total}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Accordion
                type="single"
                collapsible
                className="flex flex-col gap-3"
                defaultValue={subject.modules[0]?.id}
              >
                {subject.modules.map((module) => {
                  const moduleCompleted = module.contents.filter((content) =>
                    completedContents.includes(content.id)
                  ).length;
                  const moduleProgress = Math.round(
                    (moduleCompleted / module.contents.length) * 100
                  );

                  return (
                    <AccordionItem
                      key={module.id}
                      value={module.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <AccordionTrigger className="flex flex-col gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-50 data-[state=open]:bg-orange-50 dark:text-slate-200 dark:hover:bg-orange-500/10 dark:data-[state=open]:bg-orange-500/10">
                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-orange-500 dark:text-orange-200">
                              Módulo
                            </span>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                              {module.title}
                            </h3>
                            {module.summary && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {module.summary}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-white text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
                            >
                              {moduleCompleted}/{module.contents.length} completados
                            </Badge>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                                  style={{ width: `${moduleProgress}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-300">
                                {moduleProgress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 bg-orange-50/60 px-4 pb-4 pt-2 dark:bg-slate-950">
                        <div className="space-y-3" role="list">
                          {module.contents
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map((content) => renderContentItem(content))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ModuleView;
