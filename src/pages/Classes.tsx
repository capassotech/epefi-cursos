
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Classes = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: "modulo-1",
      title: "Fundamentos del Fitness",
      description: "Bases teóricas y prácticas del entrenamiento",
      classes: [
        {
          id: "clase-1-1",
          title: "Introducción al Fitness Grupal",
          duration: "35 min",
          thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          completed: true
        },
        {
          id: "clase-1-2", 
          title: "Planificación de Sesiones",
          duration: "42 min",
          thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
          completed: true
        },
        {
          id: "clase-1-3",
          title: "Calentamiento y Enfriamiento",
          duration: "28 min",
          thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
          completed: false
        }
      ]
    },
    {
      id: "modulo-2",
      title: "Técnicas de Entrenamiento",
      description: "Metodologías específicas y ejercicios",
      classes: [
        {
          id: "clase-2-1",
          title: "Entrenamiento de Fuerza",
          duration: "48 min",
          thumbnail: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400",
          completed: false
        },
        {
          id: "clase-2-2",
          title: "Cardio y Resistencia",
          duration: "38 min", 
          thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
          completed: false
        }
      ]
    },
    {
      id: "modulo-3",
      title: "Especialización",
      description: "Técnicas avanzadas y poblaciones especiales",
      classes: [
        {
          id: "clase-3-1",
          title: "HIIT y Entrenamiento Funcional",
          duration: "45 min",
          thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
          completed: false
        },
        {
          id: "clase-3-2",
          title: "Adaptaciones para Diferentes Edades",
          duration: "52 min",
          thumbnail: "https://images.unsplash.com/photo-1506629905963-b674cd1d7e0d?w=400",
          completed: false
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Clases Grabadas
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Videos organizados por módulo temático
        </p>
      </div>

      {modules.map((module) => (
        <Card key={module.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {module.classes.length} clases
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {module.classes.map((classItem) => (
              <Card 
                key={classItem.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                onClick={() => navigate(`/classes/${module.id}/${classItem.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={classItem.thumbnail}
                        alt={classItem.title}
                        className="w-20 h-16 md:w-24 md:h-18 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                      {classItem.completed && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                        {classItem.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{classItem.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>Fitness Grupal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Classes;
