import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Play,
  School,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const courseDetail = {
  id: "fitness-grupal",
  title: "Instructorado de fitness grupal",
  summary:
    "Formación completa en fitness grupal con metodología actualizada y base científica aplicada.",
  subjects: [
    {
      id: "fundamentos",
      name: "Fundamentos Anatómicos",
      description:
        "Comprendé cómo funciona el cuerpo y cómo impacta en la actividad física.",
      modules: [
        {
          id: "fundamentos-anatomia",
          name: "Anatomía y Fisiología",
          description: "Base estructural del movimiento humano.",
          items: [
            {
              id: "video-esqueleto",
              title: "Anatomía del esqueleto humano",
              description:
                "Recorrido visual por las principales estructuras óseas.",
              type: "VIDEO" as const,
              duration: "18 min",
            },
            {
              id: "pdf-articulaciones",
              title: "Guía de articulaciones",
              description: "Clasificación y cuidados básicos.",
              type: "PDF" as const,
              size: "2.5 MB",
            },
            {
              id: "video-musculos",
              title: "Músculos en acción",
              description: "Principales grupos musculares y funciones.",
              type: "VIDEO" as const,
              duration: "22 min",
            },
          ],
        },
        {
          id: "fundamentos-sistemas",
          name: "Sistemas Energéticos",
          description: "Cómo el cuerpo obtiene y usa la energía.",
          items: [
            {
              id: "video-sistemas",
              title: "Introducción a los sistemas energéticos",
              description: "Fases y características clave.",
              type: "VIDEO" as const,
              duration: "15 min",
            },
            {
              id: "pdf-mapas",
              title: "Mapas metabólicos",
              description: "Material de apoyo descargable.",
              type: "PDF" as const,
              size: "1.8 MB",
            },
          ],
        },
      ],
    },
    {
      id: "planificacion",
      name: "Planificación y Metodología",
      description:
        "Herramientas prácticas para diseñar clases seguras y dinámicas.",
      modules: [
        {
          id: "planificacion-bases",
          name: "Principios del Entrenamiento",
          description: "Planificá sesiones con foco en resultados.",
          items: [
            {
              id: "video-principios",
              title: "Variables clave del entrenamiento",
              description: "Frecuencia, intensidad y volumen explicados.",
              type: "VIDEO" as const,
              duration: "20 min",
            },
            {
              id: "pdf-hojas",
              title: "Plantillas de planificación",
              description: "Descargá y adaptá a tus clases.",
              type: "PDF" as const,
              size: "800 KB",
            },
          ],
        },
        {
          id: "planificacion-seguridad",
          name: "Seguridad y Adaptaciones",
          description: "Cuidados esenciales para distintos perfiles.",
          items: [
            {
              id: "video-seguridad",
              title: "Chequeos previos y adaptaciones",
              description: "Checklist previo a cada clase.",
              type: "VIDEO" as const,
              duration: "12 min",
            },
            {
              id: "pdf-checklist",
              title: "Checklist descargable",
              description: "Formato imprimible para llevar a clase.",
              type: "PDF" as const,
              size: "600 KB",
            },
          ],
        },
      ],
    },
  ],
};

type ModuleItem = (typeof courseDetail.subjects)[number]["modules"][number]["items"][number];

type Subject = (typeof courseDetail.subjects)[number];

type Module = Subject["modules"][number];

const CourseDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSubjectId, setSelectedSubjectId] = useState(courseDetail.subjects[0]?.id);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const selectedSubject = useMemo<Subject | undefined>(() => {
    return courseDetail.subjects.find((subject) => subject.id === selectedSubjectId);
  }, [selectedSubjectId]);

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

  const renderModule = (module: Module) => {
    const isExpanded = expandedModuleId === module.id;

    return (
      <Card key={module.id} className="border-slate-200 shadow-none">
        <button
          type="button"
          onClick={() => handleModuleToggle(module.id)}
          className="w-full text-left"
        >
          <CardHeader className="space-y-1 px-4 py-3 sm:py-4">
            <CardTitle className="text-base font-semibold text-slate-900">
              {module.name}
            </CardTitle>
            <p className="text-sm text-slate-500">{module.description}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
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
          <CardContent className="space-y-3 border-t border-slate-100 bg-white px-4 py-3">
            {module.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3"
              >
                <span
                  className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${
                    item.type === "VIDEO"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-slate-200 text-slate-600"
                  }`}
                  aria-hidden="true"
                >
                  {getItemIcon(item.type)}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`border-0 text-[11px] font-medium uppercase tracking-wide ${
                        item.type === "VIDEO"
                          ? "bg-orange-500/10 text-orange-600"
                          : "bg-slate-500/10 text-slate-600"
                      }`}
                    >
                      {item.type}
                    </Badge>
                    <span className="text-xs text-slate-400">{getItemBadge(item)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 text-xs text-orange-600"
                >
                  {item.type === "VIDEO" ? "Ver" : "Descargar"}
                </Button>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-slate-600"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-[13px] uppercase tracking-wider text-orange-500">Curso</p>
            <h1 className="text-lg font-semibold text-slate-900">{courseDetail.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Acerca del curso</h2>
          <p className="text-sm leading-relaxed text-slate-600">{courseDetail.summary}</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Materias del programa
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {courseDetail.subjects.map((subject) => {
              const isActive = subject.id === selectedSubjectId;

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(subject.id);
                    setExpandedModuleId(null);
                  }}
                  aria-pressed={isActive}
                  className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                    isActive
                      ? "border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-snug">{subject.name}</span>
                    <Badge
                      variant="outline"
                      className={`border-0 text-[11px] font-medium uppercase tracking-wide ${
                        isActive ? "bg-orange-500/10 text-orange-600" : "bg-slate-500/10 text-slate-600"
                      }`}
                    >
                      {subject.modules.length} módulos
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {subject.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedSubject && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">{selectedSubject.description}</p>
              <div className="space-y-3">
                {selectedSubject.modules.map((module) => renderModule(module))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-orange-500" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900">
                Cómo navegar el curso
              </h2>
              <p className="text-sm text-slate-600">
                Elegí una materia para ver sus módulos y desplegá cada módulo para acceder a
                los videos o PDFs correspondientes.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CourseDetailPage;
