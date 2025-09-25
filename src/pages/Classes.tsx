import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Classes = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: "anatomia",
      title: "Anatomía y Fisiología",
      description: "Fundamentos del cuerpo humano y su funcionamiento",
      classes: [
        {
          id: "clase-1",
          title: "Anatomía del esqueleto humano",
          duration: "70 min",
          thumbnail:
            "https://images.pexels.com/photos/5428151/pexels-photo-5428151.jpeg?auto=compress&cs=tinysrgb&w=400",
          completed: true,
        },
        {
          id: "clase-2",
          title: "Articulaciones",
          duration: "60 min",
          thumbnail:
            "https://images.pexels.com/photos/5723885/pexels-photo-5723885.jpeg?auto=compress&cs=tinysrgb&w=400",
          completed: false,
        },
        {
          id: "",
          title: "Planos y ejes corporales",
          duration: "60 min",
          thumbnail:
            "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=400",
          completed: false,
        },
        {
          id: "",
          title: "Músculos",
          duration: "60 min",
          thumbnail:
            "https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=400",
          completed: false,
        },
        {
          id: "",
          title: "Fisiología muscular",
          duration: "60 min",
          thumbnail:
            "https://images.pexels.com/photos/3761020/pexels-photo-3761020.jpeg?auto=compress&cs=tinysrgb&w=400",
          completed: false,
        },
        {
          id: "",
          title: "Análisis del Movimiento",
          duration: "60 min",
          thumbnail:
            "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=400",
          completed: false,
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Clases Grabadas
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Videos organizados por módulo temático
        </p>
      </div>

      {/* Modules */}
      <div className="space-y-6">
        {modules.map((module) => (
          <Card
            key={module.id}
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {module.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {module.description}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                >
                  {module.classes.length} clases
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              {module.classes.map((classItem, index) => (
                <Card
                  key={classItem.id || `class-${index}`}
                  className={`cursor-pointer hover:shadow-md transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 relative ${
                    !classItem.id ? "opacity-75" : ""
                  }`}
                  onClick={() => {
                    if (classItem.id) {
                      navigate(`/classes/${module.id}/${classItem.id}`);
                    }
                  }}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={classItem.thumbnail}
                          alt={classItem.title}
                          className="w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-18 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                          <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        </div>
                        {classItem.completed && (
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                        )}
                        {!classItem.id && (
                          <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                            Próximamente
                          </div>
                        )}
                      </div>

                      {/* Class Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-2 break-words">
                          {classItem.title}
                        </h3>
                        <div className="flex items-center space-x-3 sm:space-x-4 mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{classItem.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
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
    </div>
  );
};

export default Classes;
