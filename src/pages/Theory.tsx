
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Theory = () => {
  const navigate = useNavigate();

  const theoryUnits = [
    {
      id: "unidad-1",
      title: "El esqueleto humano",
      description: "Definición, concepto. Los huesos. Tejidos. Ubicación anatómica de todos los huesos.",
      readTime: "30 min",
      completed: true,
      topics: ["Definición", "Concepto", "Los huesos", "Tejidos", "Ubicación"]
    },
    {
      id: "",
      title: "Articulaciones",
      description: "Tipos y clasificación. Movimientos articulares.",
      readTime: "30 min",
      completed: false,
      topics: ["Tipos y clasificación", "Movimientos articulares"]
    },
    {
      id: "",
      title: "Planos y ejes corporales",
      description: "Centro de gravedad, planos y ejes corporales. Palancas del cuerpo. Clasificación, tipos.",
      readTime: "35 min",
      completed: false,
      topics: ["Centro de gravedad", "Planos y ejes corporales", "Palancas del cuerpo", "Clasificación", "Tipos"]
    },
    {
      id: "",
      title: "Músculos",
      description: "Tipos. Ubicación anatómica. Clasificación según su función.",
      readTime: "30 min",
      completed: false,
      topics: ["Tipos", "Ubicación anatómica", "Clasificación según su función"]
    },
    {
      id: "",
      title: "Fisiología muscular",
      description: "La fibra muscular. Miofibrilla. Contracción muscular. Acción muscular conjunta.",
      readTime: "30 min",
      completed: false,
      topics: ["La fibra muscular", "Miofibrilla", "Contracción muscular", "Acción muscular conjunta"]
    },
    {
      id: "",
      title: "Análisis del Movimiento",
      description: "Definición. Tipos de movimiento.",
      readTime: "20 min",
      completed: false,
      topics: ["Definición", "Tipos de movimiento"]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Material Teórico
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Acá vas a encontrar el material teórico para estudiar a tu ritmo. Cada unidad incluye un resumen de los temas tratados y un tiempo estimado de lectura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {theoryUnits.map((unit, index) => (
          <Card
            key={unit.id || index} // por si unit.id está vacío
            className="cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            onClick={() => {
              if (unit.id) {
                navigate(`/theory/${unit.id}`);
              }
            }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${unit.completed
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                      : 'bg-primary/10 dark:bg-primary/20 text-primary'
                    }`}>
                    {unit.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight">{unit.title}</CardTitle>
                  </div>
                </div>

                {unit.completed ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Completado
                  </Badge>
                ) : !unit.id ? (
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                    Próximamente
                  </Badge>
                ) : null}
              </div>

              <CardDescription className="mt-2">{unit.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Tiempo de lectura: {unit.readTime}</span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Temas incluidos:</p>
                <div className="flex flex-wrap gap-2">
                  {unit.topics.map((topic, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        ))}
      </div>

      {/* Progress Summary */}
      <Card className="bg-primary text-white border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Progreso de Estudio</CardTitle>
          <CardDescription className="text-white/80">
            Has completado 1 de 6 unidades teóricas
          </CardDescription>
          <div className="mt-4">
            <div className="w-full bg-white/30 rounded-full h-3">
              <div className="bg-white h-3 rounded-full" style={{ width: '33%' }}></div>
            </div>
            <p className="text-sm mt-2 text-white/80">16% completado</p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Theory;
