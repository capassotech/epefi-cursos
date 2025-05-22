
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Theory = () => {
  const navigate = useNavigate();

  const theoryUnits = [
    {
      id: "unidad-1",
      title: "Anatomía y Fisiología del Ejercicio",
      description: "Fundamentos científicos del movimiento humano",
      readTime: "25 min",
      completed: true,
      topics: ["Sistema muscular", "Sistema cardiovascular", "Metabolismo energético"]
    },
    {
      id: "unidad-2", 
      title: "Principios del Entrenamiento",
      description: "Bases metodológicas para la planificación",
      readTime: "30 min",
      completed: true,
      topics: ["Principio de sobrecarga", "Especificidad", "Progresión"]
    },
    {
      id: "unidad-3",
      title: "Biomecánica del Movimiento",
      description: "Análisis técnico de los ejercicios",
      readTime: "35 min",
      completed: false,
      topics: ["Planos de movimiento", "Palancas", "Análisis gestual"]
    },
    {
      id: "unidad-4",
      title: "Nutrición Deportiva",
      description: "Alimentación para el rendimiento",
      readTime: "28 min", 
      completed: false,
      topics: ["Macronutrientes", "Hidratación", "Suplementación"]
    },
    {
      id: "unidad-5",
      title: "Psicología del Ejercicio",
      description: "Aspectos mentales del entrenamiento",
      readTime: "22 min",
      completed: false,
      topics: ["Motivación", "Adherencia", "Manejo del estrés"]
    },
    {
      id: "unidad-6",
      title: "Lesiones y Prevención",
      description: "Seguridad en el entrenamiento grupal",
      readTime: "40 min",
      completed: false,
      topics: ["Lesiones comunes", "Protocolos de seguridad", "Primeros auxilios"]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Material Teórico
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Contenido enriquecido con texto, imágenes y videos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {theoryUnits.map((unit) => (
          <Card 
            key={unit.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            onClick={() => navigate(`/theory/${unit.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    unit.completed 
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                      : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                  }`}>
                    {unit.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ):(
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight">{unit.title}</CardTitle>
                  </div>
                </div>
                {unit.completed && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Completado
                  </Badge>
                )}
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
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Progreso de Estudio</CardTitle>
          <CardDescription className="text-purple-100">
            Has completado 2 de 6 unidades teóricas
          </CardDescription>
          <div className="mt-4">
            <div className="w-full bg-purple-200/30 rounded-full h-3">
              <div className="bg-white h-3 rounded-full" style={{ width: '33%' }}></div>
            </div>
            <p className="text-sm mt-2 text-purple-100">33% completado</p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Theory;
