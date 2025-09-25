import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Trophy,
  Award,
  Play,
  BookOpen,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileImage,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ModuleView = () => {
  const navigate = (path) => {
    console.log(`Navigating to: ${path}`);
  };

  // Mock data siguiendo tu estructura: Curso → Materias → Módulos
  const courseData = {
    id: "fitness-grupal",
    titulo: "Instructorado de fitness grupal",
    descripcion:
      "Formación completa en fitness grupal con metodología actualizada y base científica aplicada.",
    imagen:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=300&fit=crop",
    estado: "activo",
    precio: 299,
    materias: [
      {
        id: "materia-1",
        nombre: "Anatomía y Fisiología",
        modulos: [
          {
            id: "modulo-1",
            titulo: "Anatomía del esqueleto humano",
            descripcion:
              "Introducción clara al esqueleto humano, clasificación y funciones de los huesos",
            tipo_contenido: "video",
            url_contenido: "https://example.com/video1",
            url_miniatura:
              "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
            duracion: "70 min",
            completado: true,
            topics: [
              "Definición y concepto",
              "Los huesos",
              "Tejidos",
              "Ubicación anatómica",
            ],
            orden: 1,
          },
          {
            id: "modulo-2",
            titulo: "Aparato locomotor",
            descripcion: "Documento complementario sobre el sistema locomotor",
            tipo_contenido: "pdf",
            url_contenido: "https://example.com/pdf1",
            completado: true,
            orden: 2,
          },
          {
            id: "modulo-3",
            titulo: "Articulaciones",
            descripcion:
              "Tipos de articulaciones y su función en el movimiento",
            tipo_contenido: "video",
            url_contenido: "https://example.com/video2",
            url_miniatura:
              "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop",
            duracion: "60 min",
            completado: false,
            topics: ["Tipos de articulaciones", "Movimientos articulares"],
            orden: 3,
          },
        ],
      },
      {
        id: "materia-2",
        nombre: "Metodología del Entrenamiento",
        modulos: [
          {
            id: "modulo-4",
            titulo: "Principios del Entrenamiento",
            descripcion: "Fundamentos científicos del entrenamiento deportivo",
            tipo_contenido: "video",
            url_contenido: "https://example.com/video3",
            duracion: "50 min",
            completado: false,
            orden: 1,
          },
        ],
      },
    ],
  };

  const [openMaterias, setOpenMaterias] = useState(["materia-1"]);
  const [completedContents, setCompletedContents] = useState([
    "modulo-1",
    "modulo-2",
  ]);

  const totalModulos = courseData.materias.reduce(
    (acc, materia) => acc + materia.modulos.length,
    0
  );
  const completedCount = completedContents.length;
  const progressPercentage = Math.round((completedCount / totalModulos) * 100);

  const toggleMateria = (materiaId) => {
    setOpenMaterias((prev) =>
      prev.includes(materiaId)
        ? prev.filter((id) => id !== materiaId)
        : [...prev, materiaId]
    );
  };

  const toggleContentComplete = (moduloId) => {
    setCompletedContents((prev) =>
      prev.includes(moduloId)
        ? prev.filter((id) => id !== moduloId)
        : [...prev, moduloId]
    );
  };

  const getIcon = (tipo) => {
    switch (tipo) {
      case "video":
        return <Play className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "pdf":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "evaluacion":
        return <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      case "imagen":
        return <FileImage className="w-4 h-4 sm:w-5 sm:h-5" />;
      default:
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getTypeColor = (tipo) => {
    switch (tipo) {
      case "video":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200";
      case "pdf":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
      case "evaluacion":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200";
      case "imagen":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200";
    }
  };

  const handleActionClick = (modulo) => {
    if (modulo.tipo_contenido === "video") {
      console.log("Opening video:", modulo.titulo);
    } else {
      window.open(modulo.url_contenido, "_blank");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="self-start sm:mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {courseData.titulo}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
            {courseData.descripcion}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {courseData.estado}
            </Badge>
            <span className="text-xs sm:text-sm text-gray-500">
              {courseData.materias.length} materias
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {totalModulos} módulos
            </span>
          </div>
        </div>
      </div>

      {/* Course Image */}
      <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 rounded-lg overflow-hidden">
        <img
          src={courseData.imagen}
          alt={courseData.titulo}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
              {courseData.titulo}
            </h2>
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm">
              ${courseData.precio}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="bg-orange-500 text-white border-0">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl">
                Progreso del Curso
              </CardTitle>
              <p className="text-orange-100 mt-1 text-sm sm:text-base">
                {completedCount} de {totalModulos} módulos completados
              </p>
            </div>
            <div className="text-center sm:text-right flex-shrink-0">
              <div className="text-2xl sm:text-3xl font-bold">
                {progressPercentage}%
              </div>
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mt-2" />
            </div>
          </div>
          <Progress
            value={progressPercentage}
            className="mt-4 bg-orange-600 h-2 sm:h-3"
          />
        </CardHeader>
      </Card>

      {/* Certificate Button */}
      {progressPercentage > 0 && (
        <Card className="border-2 border-dashed border-orange-300 dark:border-orange-700">
          <CardContent className="p-4 sm:p-6 text-center">
            <Award className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-orange-500" />
            <h3 className="font-semibold mb-2 text-sm sm:text-base">
              Certificado de Finalización
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
              {progressPercentage === 100
                ? "¡Felicitaciones! Has completado el curso."
                : `Completa el ${
                    100 - progressPercentage
                  }% restante para obtener tu certificado.`}
            </p>
            <Button
              onClick={() => console.log("Certificate action")}
              variant={progressPercentage === 100 ? "default" : "outline"}
              disabled={progressPercentage < 100}
              className={
                progressPercentage === 100
                  ? "bg-orange-500 hover:bg-orange-600"
                  : ""
              }
            >
              {progressPercentage === 100
                ? "Descargar Certificado"
                : "Certificado Bloqueado"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Materias (siguiendo patrón de INEE) */}
      <div className="space-y-3 sm:space-y-4">
        {courseData.materias.map((materia) => {
          const materiaCompletedCount = materia.modulos.filter((modulo) =>
            completedContents.includes(modulo.id)
          ).length;
          const materiaProgress = Math.round(
            (materiaCompletedCount / materia.modulos.length) * 100
          );
          const isOpen = openMaterias.includes(materia.id);

          return (
            <Card
              key={materia.id}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <Collapsible
                open={isOpen}
                onOpenChange={() => toggleMateria(materia.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <CardTitle className="text-base sm:text-lg">
                            {materia.nombre}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className="self-start text-xs sm:text-sm"
                          >
                            {materiaCompletedCount}/{materia.modulos.length}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <Progress
                            value={materiaProgress}
                            className="flex-1 h-2"
                          />
                          <span className="text-xs sm:text-sm text-gray-500 self-start sm:self-center">
                            {materiaProgress}%
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 p-4 sm:p-6 sm:pt-0 space-y-2 sm:space-y-3">
                    {materia.modulos
                      .sort((a, b) => a.orden - b.orden)
                      .map((modulo) => (
                        <div
                          key={modulo.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleContentComplete(modulo.id)}
                              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                                completedContents.includes(modulo.id)
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                              }`}
                            >
                              {completedContents.includes(modulo.id) && (
                                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </button>

                            {/* Thumbnail or Icon */}
                            <div className="flex-shrink-0">
                              {modulo.tipo_contenido === "video" &&
                              modulo.url_miniatura ? (
                                <div
                                  className="relative cursor-pointer"
                                  onClick={() => handleActionClick(modulo)}
                                >
                                  <img
                                    src={modulo.url_miniatura}
                                    alt={modulo.titulo}
                                    className="w-12 h-9 sm:w-16 sm:h-12 object-cover rounded"
                                  />
                                  <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center">
                                    <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${getTypeColor(
                                    modulo.tipo_contenido
                                  )}`}
                                >
                                  {getIcon(modulo.tipo_contenido)}
                                </div>
                              )}
                            </div>

                            {/* Content Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
                                  {modulo.titulo}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`${getTypeColor(
                                    modulo.tipo_contenido
                                  )} text-xs self-start sm:self-center flex-shrink-0`}
                                >
                                  {modulo.tipo_contenido.toUpperCase()}
                                </Badge>
                              </div>
                              {modulo.descripcion && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                                  {modulo.descripcion}
                                </p>
                              )}
                              {modulo.topics && modulo.topics.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {modulo.topics
                                    .slice(0, 2)
                                    .map((topic, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {topic}
                                      </Badge>
                                    ))}
                                  {modulo.topics.length > 2 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      +{modulo.topics.length - 2} más
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {modulo.duracion && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{modulo.duracion}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex justify-end sm:justify-start">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActionClick(modulo)}
                              className="text-xs sm:text-sm bg-transparent"
                            >
                              {modulo.tipo_contenido === "video" ? (
                                <>
                                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Ver
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Abrir
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleView;
