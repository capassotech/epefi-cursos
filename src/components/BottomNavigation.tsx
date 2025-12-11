
import { useCallback, useEffect, useState } from "react";
import { Home, Play, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type ContinueTarget = {
  path: string;
  courseTitle?: string;
  itemTitle?: string;
};

const DEFAULT_CONTINUE_TARGET: ContinueTarget = {
  path: "/curso",
};

const buildCoursePath = (
  courseId?: string,
  moduleId?: string,
  itemId?: string,
  fallback = "/curso"
) => {
  const hasCourseId = typeof courseId === "string" && courseId.length > 0;
  const hasModuleId = typeof moduleId === "string" && moduleId.length > 0;
  const hasItemId = typeof itemId === "string" && itemId.length > 0;

  const basePath = hasCourseId ? `/curso/${courseId}` : fallback;

  if (!hasModuleId) {
    return basePath;
  }

  const params = new URLSearchParams();
  params.set("module", moduleId!);

  if (hasItemId) {
    params.set("item", itemId!);
  }

  return `${basePath}?${params.toString()}`;
};

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [continueTarget, setContinueTarget] = useState<ContinueTarget>(
    DEFAULT_CONTINUE_TARGET
  );

  const updateContinueTarget = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const fallbackPath = "/curso";
    let nextTarget: ContinueTarget = { ...DEFAULT_CONTINUE_TARGET };

    try {
      const storedClassRaw = window.localStorage.getItem("lastViewedClass");

      if (storedClassRaw) {
        const storedClass = JSON.parse(storedClassRaw);

        if (storedClass && typeof storedClass === "object") {
          const computedPath = buildCoursePath(
            typeof storedClass.courseId === "string"
              ? storedClass.courseId
              : undefined,
            typeof storedClass.moduleId === "string"
              ? storedClass.moduleId
              : undefined,
            typeof storedClass.itemId === "string"
              ? storedClass.itemId
              : undefined,
            fallbackPath
          );

          const pathFromStorage =
            typeof storedClass.path === "string" && storedClass.path.length > 0
              ? storedClass.path
              : computedPath;

          nextTarget = {
            path: pathFromStorage,
            courseTitle:
              typeof storedClass.courseTitle === "string"
                ? storedClass.courseTitle
                : undefined,
            itemTitle:
              typeof storedClass.itemTitle === "string"
                ? storedClass.itemTitle
                : undefined,
          };

          setContinueTarget(nextTarget);
          return;
        }
      }
    } catch (error) {
      console.error("Error parsing lastViewedClass from localStorage", error);
    }

    try {
      const storedCourseRaw = window.localStorage.getItem("lastCourseAccess");

      if (storedCourseRaw) {
        const storedCourse = JSON.parse(storedCourseRaw);

        if (storedCourse && typeof storedCourse === "object") {
          const computedPath = buildCoursePath(
            typeof storedCourse.courseId === "string"
              ? storedCourse.courseId
              : undefined,
            undefined,
            undefined,
            fallbackPath
          );

          const pathFromStorage =
            typeof storedCourse.path === "string" && storedCourse.path.length > 0
              ? storedCourse.path
              : computedPath;

          nextTarget = {
            path: pathFromStorage,
            courseTitle:
              typeof storedCourse.courseTitle === "string"
                ? storedCourse.courseTitle
                : undefined,
          };
        }
      }
    } catch (error) {
      console.error("Error parsing lastCourseAccess from localStorage", error);
    }

    setContinueTarget(nextTarget);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (
        !event.key ||
        event.key === "lastViewedClass" ||
        event.key === "lastCourseAccess"
      ) {
        updateContinueTarget();
      }
    };

    const handleCustomUpdate = () => {
      updateContinueTarget();
    };

    updateContinueTarget();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("last-viewed-class-updated", handleCustomUpdate);
    window.addEventListener("last-course-access-updated", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "last-viewed-class-updated",
        handleCustomUpdate
      );
      window.removeEventListener(
        "last-course-access-updated",
        handleCustomUpdate
      );
    };
  }, [location.pathname, location.search, updateContinueTarget]);

  const continueAriaLabel = continueTarget.itemTitle
    ? `Continuar ${continueTarget.itemTitle}`
    : continueTarget.courseTitle
      ? `Continuar curso ${continueTarget.courseTitle}`
      : "Continuar con tus clases";

  const handleContinueClick = () => {
    // Si el path es solo "/curso" sin ID, redirigir a inicio
    if (continueTarget.path === "/curso") {
      navigate("/");
    } else {
      navigate(continueTarget.path);
    }
  };

  // Verificar si hay un curso válido guardado
  const hasValidCourse = continueTarget.path !== "/curso" && continueTarget.path !== "/";

  const navItems = [
    { icon: Home, label: "Inicio", path: "/", activePath: "/", id: "home" },
    // Solo mostrar el botón Continuar si hay un curso válido guardado
    ...(hasValidCourse
      ? [
          {
            icon: Play,
            label: "Continuar",
            path: continueTarget.path,
            activePath: "/curso",
            ariaLabel: continueAriaLabel,
            onClick: handleContinueClick,
            id: "continue",
          },
        ]
      : []),
    {
      icon: Search,
      label: "Buscar",
      path: "/search",
      activePath: "/search",
      ariaLabel: "Buscar clases o teoría",
      id: "search",
    },
  ].filter((item, index, self) => 
    // Filtrar duplicados por path
    index === self.findIndex((t) => t.path === item.path)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path, activePath, ariaLabel, onClick, id }) => {
          const basePath = activePath ?? path;
          const isActive =
            basePath === "/"
              ? location.pathname === "/"
              : location.pathname === basePath ||
                location.pathname.startsWith(basePath);

          return (
            <button
              key={id || label}
              onClick={onClick || (() => navigate(path))}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              )}
              aria-label={ariaLabel ?? label}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive && "scale-110")} />
              <span className="text-xs font-medium">{label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
