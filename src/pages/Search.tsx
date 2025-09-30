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
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildCourseUrl, courses } from "@/data/courses";

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

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const searchIndex = useMemo<SearchResult[]>(() => {
    return courses.flatMap((course) => {
      const totalModules = course.subjects.reduce(
        (acc, subject) => acc + subject.modules.length,
        0
      );
      const totalItems = course.subjects.reduce(
        (acc, subject) =>
          acc + subject.modules.reduce((count, module) => count + module.items.length, 0),
        0
      );

      const courseResult: SearchResult = {
        id: `course-${course.id}`,
        type: "course",
        title: course.title,
        description: course.summary,
        path: buildCourseUrl(course.id),
        meta: [
          `${course.subjects.length} materias`,
          `${totalModules} módulos`,
          `${totalItems} contenidos`,
        ],
      };

      const subjectResults: SearchResult[] = course.subjects.flatMap((subject) => {
        const subjectModuleCount = subject.modules.length;
        const subjectItemCount = subject.modules.reduce(
          (acc, module) => acc + module.items.length,
          0
        );

        const baseSubject: SearchResult = {
          id: `materia-${course.id}-${subject.id}`,
          type: "materia",
          title: subject.name,
          description: subject.description,
          courseTitle: course.title,
          path: buildCourseUrl(course.id, subject.id),
          meta: [
            `${subjectModuleCount} módulos`,
            `${subjectItemCount} contenidos`,
          ],
        };

        const moduleResults: SearchResult[] = subject.modules.map((module) => {
          const moduleItemCount = module.items.length;
          const completedCount = module.items.filter((item) => item.completed).length;

          const moduleMeta = [
            `${moduleItemCount} contenidos`,
            `${completedCount} completados`,
          ];

          return {
            id: `modulo-${course.id}-${subject.id}-${module.id}`,
            type: "modulo",
            title: module.name,
            description: module.description,
            courseTitle: course.title,
            subjectName: subject.name,
            path: buildCourseUrl(course.id, subject.id, module.id),
            meta: moduleMeta,
          };
        });

        return [baseSubject, ...moduleResults];
      });

      return [courseResult, ...subjectResults];
    });
  }, []);

  const filteredResults = useMemo(() => {
    let results = searchIndex;

    if (filter !== "all") {
      results = results.filter((item) => item.type === filter);
    }

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter((item) => {
        const haystack = [
          item.title,
          item.description,
          item.courseTitle,
          item.subjectName,
          ...item.meta,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(searchTerm);
      });
    }

    return results;
  }, [filter, query, searchIndex]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Buscar Contenido
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
        {filteredResults.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredResults.length} resultado{filteredResults.length !== 1 ? "s" : ""} encontrado{filteredResults.length !== 1 ? "s" : ""}
            </p>
            {filteredResults.map((item) => {
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
