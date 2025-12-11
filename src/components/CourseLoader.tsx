import React from "react";
import { BookOpen } from "lucide-react";

const CourseLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
      {/* Contenedor principal con animación de pulso suave */}
      <div className="relative mb-8">
        {/* Círculo exterior animado con ping */}
        <div className="absolute inset-0 rounded-full border-4 border-orange-200 dark:border-orange-900/30 animate-ping opacity-75"></div>
        
        {/* Círculo medio animado con pulse */}
        <div className="absolute inset-2 rounded-full border-4 border-orange-300 dark:border-orange-800/40 animate-pulse"></div>
        
        {/* Contenedor del ícono central con rotación y bounce */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 rounded-full shadow-xl">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" style={{ animationDuration: "1.5s" }} />
        </div>
      </div>

      {/* Mensaje con animación de puntos */}
      <div className="text-center mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 animate-fade-in">
          Cargando cursos disponibles
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
          <span>Por favor aguarde</span>
          <span className="flex gap-1 ml-1">
            <span 
              className="inline-block animate-bounce" 
              style={{ animationDelay: "0ms", animationDuration: "1.4s" }}
            >
              .
            </span>
            <span 
              className="inline-block animate-bounce" 
              style={{ animationDelay: "200ms", animationDuration: "1.4s" }}
            >
              .
            </span>
            <span 
              className="inline-block animate-bounce" 
              style={{ animationDelay: "400ms", animationDuration: "1.4s" }}
            >
              .
            </span>
          </span>
        </p>
      </div>

      {/* Barra de progreso animada con efecto de onda */}
      <div className="w-full max-w-xs mt-4">
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full relative"
            style={{
              animation: "progress 2s ease-in-out infinite",
            }}
          >
            {/* Efecto de brillo que se mueve */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: "shimmer 2s ease-in-out infinite",
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Estilos CSS para las animaciones */}
      <style>{`
        @keyframes progress {
          0% {
            width: 0%;
            transform: translateX(0);
          }
          50% {
            width: 100%;
            transform: translateX(0);
          }
          100% {
            width: 100%;
            transform: translateX(100%);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CourseLoader;

