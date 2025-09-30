import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useNavigate } from "react-router-dom";
import { courses } from "@/data/courses";

const Index = () => {
  const navigate = useNavigate();

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const banners = ["/banner1.jpg", "/banner2.jpg", "/banner3.jpg"];

  const { theme } = useTheme();

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) =>
        prev === banners.length - 1 ? 0 : prev + 1
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const coursesWithProgress = useMemo(() => {
    return courses.map((course) => {
      const { totalItems, completedItems } = course.subjects.reduce(
        (acc, subject) => {
          subject.modules.forEach((module) => {
            acc.totalItems += module.items.length;
            acc.completedItems += module.items.filter(
              (item) => item.completed
            ).length;
          });
          return acc;
        },
        { totalItems: 0, completedItems: 0 }
      );

      const progress =
        totalItems > 0
          ? Math.round((completedItems / totalItems) * 100)
          : 0;

      const totalModules = course.subjects.reduce(
        (acc, subject) => acc + subject.modules.length,
        0
      );

      return {
        ...course,
        totalItems,
        completedItems,
        progress,
        totalModules,
      };
    });
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Carrusel de banners */}
      <div className="relative w-full overflow-hidden rounded-lg sm:rounded-xl shadow-lg mb-6 sm:mb-10">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <img
                src={banner}
                alt={`Banner ${index + 1}`}
                className="w-full h-40 sm:h-56 md:h-64 lg:h-72 object-cover"
              />
            </div>
          ))}
        </div>
        {/* Puntos de navegación - mantienen estilo original */}
        <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 flex justify-center space-x-1 sm:space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentBannerIndex ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setCurrentBannerIndex(index)}
              aria-label={`Ir a banner ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Logo adaptativo según tema */}
      <div className="text-center mt-4">
        <div className="rounded-lg flex items-center justify-center">
          <img
            src={isDarkMode ? "/logo.webp" : "/logoNegro.png"}
            alt="Logo EPEFI"
            className="w-24 sm:w-40 md:w-36 h-auto object-contain transition-opacity duration-300"
            onError={(e) => {
              // Fallback en caso de error al cargar la imagen
              (e.target as HTMLImageElement).src = "/logo.webp";
            }}
          />
        </div>
      </div>

      {/* Lista de Cursos */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 ml-1">
          Mis formaciones
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {coursesWithProgress.map((course) => {
            return (
              <Card
                key={course.id}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/curso/${course.id}`)}
              >
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  {/* Imagen del curso */}
                  <div className="w-full sm:w-1/3 h-40 sm:h-32 md:h-40 relative overflow-hidden flex-shrink-0">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="object-cover w-full h-full transition-transform hover:scale-105"
                    />
                  </div>
                  {/* Contenido del curso */}
                  <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                    <div className="mb-3 sm:mb-4">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 break-words">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 break-words">
                        {course.summary}
                      </p>
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full whitespace-nowrap border border-slate-200 dark:border-slate-600">
                            {course.level}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {course.subjects.length} materias
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {course.totalModules} módulos · {course.totalItems} contenidos
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 self-end sm:self-center" />
                      </div>
                      {/* Barra de progreso - naranja solo como detalle */}
                      <div className="flex items-center gap-2 mt-3 sm:mt-4">
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full">
                          <div
                            className="h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300 shadow-sm"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium min-w-[2.5rem] text-right">
                          {course.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Botón para adquirir más cursos - diseño elegante con naranja como detalle */}
      <a
        href="https://epefi.edu.ar/cursos"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Card className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-400 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center py-6 sm:py-8 px-4 relative overflow-hidden">
            {/* Detalle naranja sutil */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500"></div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
              Adquirir más formaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
              Explora nuestra plataforma de formaciones completas
            </p>

            {/* Ícono con detalle naranja */}
            <div className="mt-3 flex justify-center">
              <ChevronRight className="w-5 h-5 text-orange-500 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </Card>
      </a>
    </div>
  );
};

export default Index;
