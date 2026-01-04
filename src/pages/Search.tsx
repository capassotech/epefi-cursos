import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search as SearchIcon,
  Play,
  BookOpen,
  Filter,
  School,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildCourseUrl } from "@/data/courses";
import CoursesService from "@/services/coursesService";
import { useAuth } from "@/contexts/AuthContext";
import { Curso, Materia, Modulo } from "@/types/types";

type FilterType = "all" | "course" | "materia" | "modulo";
type SearchResultType = Exclude<FilterType, "all">;

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  path: string;
  courseTitle?: string;
  subjectName?: string;
  meta: string[];
}

const TYPE_CONFIG = {
  course: {
    label: "Curso",
    icon: <School className="w-6 h-6" />,
    iconClass: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    badgeClass:
      "border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300",
  },
  materia: {
    label: "Materia",
    icon: <BookOpen className="w-6 h-6" />,
    iconClass: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    badgeClass:
      "border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300",
  },
  modulo: {
    label: "Módulo",
    icon: <Play className="w-6 h-6" />,
    iconClass:
      "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300",
    badgeClass:
      "border-orange-200 text-orange-700 dark:border-orange-700 dark:text-orange-300",
  },
} as const satisfies Record<SearchResultType, {
  label: string;
  icon: JSX.Element;
  iconClass: string;
  badgeClass: string;
}>;

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "course", label: "Cursos" },
  { value: "materia", label: "Materias" },
  { value: "modulo", label: "Módulos" },
];

const ITEMS_PER_PAGE = 5;

const Search = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Resetear página cuando cambia el filtro o la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, query]);

  // Cargar datos del backend
  useEffect(() => {
    const loadSearchData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Obtener cursos del usuario
        const coursesResponse = await CoursesService.getAllCoursesPerUser(user.uid);
        const courses: Curso[] = Array.isArray(coursesResponse.data) 
          ? coursesResponse.data.filter((c: Curso) => c.estado === "activo")
          : [];

        const results: SearchResult[] = [];

        // Para cada curso, obtener materias y módulos
        for (const course of courses) {
          // Agregar el curso a los resultados
          const courseResult: SearchResult = {
            id: `course-${course.id}`,
            type: "course",
            title: course.titulo,
            description: course.descripcion || "",
            path: buildCourseUrl(course.id),
            meta: [],
          };

          // Obtener materias del curso
          const materias: Materia[] = [];
          if (course.materias && course.materias.length > 0) {
            for (const materiaId of course.materias) {
              try {
                const materiaResponse = await CoursesService.getMateriasByCourseId(materiaId);
                const materiaData = materiaResponse.data;
                const materiasArray = Array.isArray(materiaData) ? materiaData : [materiaData];
                materias.push(...materiasArray);
              } catch (error) {
                console.error(`Error loading materia ${materiaId}:`, error);
              }
            }
          }

          courseResult.meta.push(`${materias.length} materias`);

          // Agregar materias y módulos a los resultados
          for (const materia of materias) {
            // Agregar la materia
            const materiaResult: SearchResult = {
              id: `materia-${course.id}-${materia.id}`,
              type: "materia",
              title: materia.nombre,
              description: "",
              courseTitle: course.titulo,
              path: buildCourseUrl(course.id, materia.id),
              meta: [],
            };

            // Obtener módulos de la materia
            const modulos: Modulo[] = [];
            if (materia.modulos && materia.modulos.length > 0) {
              for (const moduloId of materia.modulos) {
                try {
                  const moduloResponse = await CoursesService.getModulosByMateriaId(moduloId);
                  const moduloData = moduloResponse.data;
                  const modulosArray = Array.isArray(moduloData) ? moduloData : [moduloData];
                  modulos.push(...modulosArray);
                } catch (error) {
                  console.error(`Error loading modulo ${moduloId}:`, error);
                }
              }
            }

            materiaResult.meta.push(`${modulos.length} módulos`);

            // Agregar módulos
            for (const modulo of modulos) {
              const moduloResult: SearchResult = {
                id: `modulo-${course.id}-${materia.id}-${modulo.id}`,
                type: "modulo",
                title: modulo.titulo,
                description: modulo.descripcion || "",
                courseTitle: course.titulo,
                subjectName: materia.nombre,
                path: buildCourseUrl(course.id, materia.id, modulo.id),
                meta: [],
              };
              results.push(moduloResult);
            }

            results.push(materiaResult);
          }

          const totalModulos = materias.reduce((acc, m) => acc + (m.modulos?.length || 0), 0);
          courseResult.meta.push(`${totalModulos} módulos`);
          results.push(courseResult);
        }

        setSearchIndex(results);
      } catch (error) {
        console.error("Error loading search data:", error);
        setSearchIndex([]);
      } finally {
        setLoading(false);
      }
    };

    loadSearchData();
  }, [user]);

  // Función para normalizar texto (eliminar acentos y convertir a minúsculas)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Eliminar diacríticos (acentos)
  };

  const filteredResults = useMemo(() => {
    let results = searchIndex;

    if (filter !== "all") {
      results = results.filter((item) => item.type === filter);
    }

    if (query.trim()) {
      const searchTerm = normalizeText(query);
      results = results.filter((item) => {
        const haystack = normalizeText(
          [
            item.title,
            item.description,
            item.courseTitle,
            item.subjectName,
            ...item.meta,
          ]
            .filter(Boolean)
            .join(" ")
        );

        return haystack.includes(searchTerm);
      });
    }

    return results;
  }, [filter, query, searchIndex]);

  // Calcular resultados paginados
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Funciones de navegación
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    // Scroll al inicio de los resultados
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Buscar contenido
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Encontrá cursos, materias y módulos del campus
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="search"
          placeholder="Buscar por título, materia, módulo o descripción..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 h-12 text-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        />
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
            className="whitespace-nowrap"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-gray-600 dark:text-gray-400">Cargando contenido...</p>
            </div>
          </div>
        ) : filteredResults.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredResults.length} resultado{filteredResults.length !== 1 ? "s" : ""} encontrado{filteredResults.length !== 1 ? "s" : ""}
                {totalPages > 1 && (
                  <span className="ml-2">
                    (Página {currentPage} de {totalPages})
                  </span>
                )}
              </p>
            </div>
            {paginatedResults.map((item) => {
              const config = TYPE_CONFIG[item.type];
              const infoLine = [
                item.type !== "course" ? item.courseTitle : null,
                item.type === "modulo" ? item.subjectName : null,
                ...item.meta,
              ].filter(Boolean) as string[];

              return (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  onClick={() => navigate(item.path)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconClass}`}
                      >
                        {config.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                            {item.title}
                          </h3>
                          <Badge variant="outline" className={`ml-2 ${config.badgeClass}`}>
                            {config.label}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {infoLine.map((info, index) => (
                            <span key={`${item.id}-meta-${index}`} className="flex items-center gap-2">
                              {index > 0 && (
                                <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
                                  •
                                </span>
                              )}
                              <span>{info}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar solo algunas páginas alrededor de la actual
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      // Mostrar puntos suspensivos
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span
                            key={page}
                            className="px-2 text-gray-500 dark:text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="min-w-[2.5rem]"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
