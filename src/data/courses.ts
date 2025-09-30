export type ContentType = "VIDEO" | "PDF" | "EVALUACION" | "EXTRA";

export interface ModuleItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  duration?: string;
  size?: string;
  completed?: boolean;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  items: ModuleItem[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  modules: Module[];
}

export interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  image: string;
  level: string;
  status: "activo" | "inactivo";
  subjects: Subject[];
}

export const courses: Course[] = [
  {
    id: "fitness-grupal",
    title: "Instructorado de fitness grupal",
    summary:
      "Formación completa en fitness grupal con metodología actualizada y base científica aplicada.",
    description:
      "Formación completa en fitness grupal con metodología actualizada y base científica aplicada.",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop",
    level: "Intermedio",
    status: "activo",
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
                type: "VIDEO",
                duration: "18 min",
                completed: true,
              },
              {
                id: "pdf-articulaciones",
                title: "Guía de articulaciones",
                description: "Clasificación y cuidados básicos.",
                type: "PDF",
                size: "2.5 MB",
                completed: true,
              },
              {
                id: "video-musculos",
                title: "Músculos en acción",
                description: "Principales grupos musculares y funciones.",
                type: "VIDEO",
                duration: "22 min",
                completed: false,
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
                type: "VIDEO",
                duration: "15 min",
                completed: false,
              },
              {
                id: "pdf-mapas",
                title: "Mapas metabólicos",
                description: "Material de apoyo descargable.",
                type: "PDF",
                size: "1.8 MB",
                completed: false,
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
                type: "VIDEO",
                duration: "20 min",
                completed: false,
              },
              {
                id: "pdf-hojas",
                title: "Plantillas de planificación",
                description: "Descargá y adaptá a tus clases.",
                type: "PDF",
                size: "800 KB",
                completed: false,
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
                type: "VIDEO",
                duration: "12 min",
                completed: false,
              },
              {
                id: "pdf-checklist",
                title: "Checklist descargable",
                description: "Formato imprimible para llevar a clase.",
                type: "PDF",
                size: "600 KB",
                completed: false,
              },
            ],
          },
        ],
      },
    ],
  },
];

export const getCourseById = (courseId: string) =>
  courses.find((course) => course.id === courseId);
