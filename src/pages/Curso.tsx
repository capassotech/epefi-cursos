import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Play,
  School,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Course,
  Module,
  ModuleItem,
  Subject,
  courses,
  getCourseById,
} from "@/data/courses";

const CourseDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();

  const courseDetail: Course | undefined = useMemo(() => {
    if (courseId) {
      return getCourseById(courseId) ?? courses[0];
    }
    return courses[0];
  }, [courseId]);

  const materiaParam = searchParams.get("materia");
  const moduloParam = searchParams.get("modulo");

  useEffect(() => {
    if (!courseDetail) return;

    const subjectExists = materiaParam
      ? courseDetail.subjects.some((subject) => subject.id === materiaParam)
      : false;

    const fallbackSubject = courseDetail.subjects[0]?.id;
    setSelectedSubjectId(subjectExists ? (materiaParam as string) : fallbackSubject);

    if (moduloParam) {
      const moduleExists = courseDetail.subjects.some((subject) =>
        subject.modules.some((module) => module.id === moduloParam)
      );
      setExpandedModuleId(moduleExists ? moduloParam : null);
    } else {
      setExpandedModuleId(null);
    }
  }, [courseDetail, materiaParam, moduloParam]);
  const location = useLocation();
  const { courseId: courseIdParam } = useParams<{ courseId?: string }>();
  const [selectedSubjectId, setSelectedSubjectId] = useState(courseDetail.subjects[0]?.id);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const courseIdentifier = courseIdParam ?? courseDetail.id;
  const coursePath = courseIdParam ? `/curso/${courseIdentifier}` : "/curso";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const lastCourseAccess = {
      courseId: courseIdentifier,
      courseTitle: courseDetail.title,
      path: coursePath,
      updatedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(
        "lastCourseAccess",
        JSON.stringify(lastCourseAccess)
      );
      window.dispatchEvent(
        new CustomEvent("last-course-access-updated", {
          detail: lastCourseAccess,
        })
      );
    } catch (error) {
      console.error("Error storing last course access", error);
    }
  }, [courseIdentifier, coursePath]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(location.search);
    const moduleFromQuery = params.get("module");
    const itemFromQuery = params.get("item");

    if (!moduleFromQuery) {
      return;
    }

    const subjectWithModule = courseDetail.subjects.find((subject) =>
      subject.modules.some((module) => module.id === moduleFromQuery)
    );

    if (!subjectWithModule) {
      return;
    }

    setSelectedSubjectId(subjectWithModule.id);
    setExpandedModuleId(moduleFromQuery);

    if (itemFromQuery) {
      window.requestAnimationFrame(() => {
        const element = document.getElementById(`course-item-${itemFromQuery}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [location.search]);

  const initialCompletedItems = useMemo(() => {
    if (!courseDetail) return [] as string[];
    return courseDetail.subjects.flatMap((subject) =>
      subject.modules.flatMap((module) =>
        module.items.filter((item) => item.completed).map((item) => item.id)
      )
    );
  }, [courseDetail]);

  const [completedItems, setCompletedItems] = useState<string[]>(initialCompletedItems);

  useEffect(() => {
    setCompletedItems(initialCompletedItems);
  }, [initialCompletedItems]);

  const totalItems = useMemo(() => {
    if (!courseDetail) return 0;
    return courseDetail.subjects.reduce((count, subject) => {
      return (
        count +
        subject.modules.reduce(
          (moduleCount, module) => moduleCount + module.items.length,
          0
        )
      );
    }, 0);
  }, [courseDetail]);

  const completedCount = completedItems.length;
  const progressPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const selectedSubject = useMemo<Subject | undefined>(() => {
    if (!courseDetail) return undefined;
    return courseDetail.subjects.find((subject) => subject.id === selectedSubjectId);
  }, [courseDetail, selectedSubjectId]);

  const handleModuleToggle = (moduleId: string) => {
    setExpandedModuleId((current) => (current === moduleId ? null : moduleId));
  };

  const getItemIcon = (type: ModuleItem["type"]) => {
    if (type === "VIDEO") {
      return <Play className="h-4 w-4" />;
    }

    return <FileText className="h-4 w-4" />;
  };

  const getItemBadge = (item: ModuleItem) => {
    if (item.type === "VIDEO") {
      return item.duration;
    }

    return item.size;
  };

  const handleAccessContent = (
    subject: Subject,
    module: Module,
    item: ModuleItem
  ) => {
    if (typeof window === "undefined") {
      return;
    }

    const timestamp = new Date().toISOString();

    const lastViewedClass = {
      courseId: courseIdentifier,
      courseTitle: courseDetail.title,
      subjectId: subject.id,
      subjectName: subject.name,
      moduleId: module.id,
      moduleName: module.name,
      itemId: item.id,
      itemTitle: item.title,
      path: `${coursePath}?module=${module.id}&item=${item.id}`,
      updatedAt: timestamp,
    };

    try {
      window.localStorage.setItem(
        "lastViewedClass",
        JSON.stringify(lastViewedClass)
      );
      window.dispatchEvent(
        new CustomEvent("last-viewed-class-updated", {
          detail: lastViewedClass,
        })
      );

      const lastCourseAccess = {
        courseId: courseIdentifier,
        courseTitle: courseDetail.title,
        path: coursePath,
        updatedAt: timestamp,
      };

      window.localStorage.setItem(
        "lastCourseAccess",
        JSON.stringify(lastCourseAccess)
      );
      window.dispatchEvent(
        new CustomEvent("last-course-access-updated", {
          detail: lastCourseAccess,
        })
      );
    } catch (error) {
      console.error("Error storing last viewed class information", error);
    }
  };

  const toggleItemCompletion = (itemId: string) => {
    setCompletedItems((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  };

  const renderModule = (module: Module) => {
    const isExpanded = expandedModuleId === module.id;

    return (
      <Card key={module.id} className="border-slate-200 shadow-none dark:border-slate-800 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => handleModuleToggle(module.id)}
          className="w-full text-left"
        >
          <CardHeader className="space-y-1 px-4 py-3 sm:py-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {module.name}
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-300">{module.description}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <Video className="h-3.5 w-3.5" />
              <span>
                {module.items.filter((item) => item.type === "VIDEO").length} videos
              </span>
              <span aria-hidden="true">•</span>
              <FileText className="h-3.5 w-3.5" />
              <span>
                {module.items.filter((item) => item.type === "PDF").length} PDF
              </span>
            </div>
          </CardHeader>
        </button>

        {isExpanded && (
          <CardContent className="space-y-3 border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            {module.items.map((item) => {
              const isCompleted = completedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  id={`course-item-${item.id}`}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <span
                    className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${
                      item.type === "VIDEO"
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                    aria-hidden="true"
                  >
                    {getItemIcon(item.type)}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`border-0 text-[11px] font-medium uppercase tracking-wide ${
                          item.type === "VIDEO"
                            ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-200"
                            : "bg-slate-500/10 text-slate-600 dark:bg-slate-700/60 dark:text-slate-200"
                        }`}
                      >
                        {item.type}
                      </Badge>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{getItemBadge(item)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-pressed={isCompleted}
                      onClick={() => toggleItemCompletion(item.id)}
                      className={`h-8 w-8 rounded-full border ${
                        isCompleted
                          ? "border-green-200 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "border-slate-200 text-slate-400 hover:border-green-200 hover:text-green-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-green-600/70 dark:hover:text-green-300"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="sr-only">
                        {isCompleted
                          ? "Marcar contenido como pendiente"
                          : "Marcar contenido como completado"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 text-xs text-orange-600 dark:text-orange-300"
                      onClick={() =>
                        handleAccessContent(selectedSubject, module, item)
                      }
                    >
                      {item.type === "VIDEO" ? "Ver" : "Descargar"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>
    );
  };

  if (!courseDetail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Curso no encontrado
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-300"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-[13px] uppercase tracking-wider text-orange-500">Curso</p>
            <h1
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              data-testid="course-title"
            >
              {courseDetail.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-400">
                Progreso general
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {completedCount} de {totalItems} contenidos completados
              </p>
            </div>
            <span className="text-sm font-semibold text-orange-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="mt-3 h-2" />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Materias del programa
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {courseDetail.subjects.map((subject) => {
              const isActive = subject.id === selectedSubjectId;

              const completedInSubject = subject.modules.reduce(
                (acc, module) =>
                  acc +
                  module.items.filter((item) => completedItems.includes(item.id))
                    .length,
                0
              );
              const totalInSubject = subject.modules.reduce(
                (acc, module) => acc + module.items.length,
                0
              );

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(subject.id);
                    setExpandedModuleId(null);
                  }}
                  aria-pressed={isActive}
                  className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                    isActive
                      ? "border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:border-orange-500 dark:bg-orange-500/10 dark:text-orange-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/60 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-orange-300/60 dark:hover:bg-orange-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-snug text-inherit">{subject.name}</span>
                    <Badge
                      variant="outline"
                      className={`border-0 text-[11px] font-medium uppercase tracking-wide ${
                        isActive
                          ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-200"
                          : "bg-slate-500/10 text-slate-600 dark:bg-slate-700/60 dark:text-slate-200"
                      }`}
                    >
                      {completedInSubject}/{totalInSubject} contenidos
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {subject.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedSubject && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedSubject.description}</p>
              <div className="space-y-3">
                {selectedSubject.modules.map((module) => renderModule(module))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Cómo navegar el curso
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Elegí una materia para ver sus módulos y desplegá cada módulo para acceder a los videos o PDFs correspondientes.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CourseDetailPage;
