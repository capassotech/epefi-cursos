
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Classes = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: "anatomia",
      title: "Anatomía y Fisiología",
      description: "",
      classes: [
        {
          id: "clase-1",
          title: "Anatomía del esqueleto humano",
          duration: "70 min",
          thumbnail: "https://images.pexels.com/photos/5428151/pexels-photo-5428151.jpeg?auto=compress&cs=tinysrgb&w=400",
          completed: true
        },
        {
          id: "",
          title: "Articulaciones",
          duration: "60 min",
          thumbnail: "https://images.pexels.com/photos/5723885/pexels-photo-5723885.jpeg?auto=compress&cs=tinysrgb&w=400",
          completed: false
        },
        {
          id: "",
          title: "Planos y ejes corporales",
          duration: "60 min",
          thumbnail: "https://mundoentrenamiento.com/wp-content/uploads/2022/05/posicion-anatomica.png?w=400",
          completed: false
        },
        {
          id: "",
          title: "Músculos",
          duration: "60 min",
          thumbnail: "https://namastezaragoza.com/wp-content/uploads/freshizer/5f0d84353d66c3b41782797dd3a0e622_musculos-800-c-90.jpg?w=400",
          completed: false
        },
        {
          id: "",
          title: "Fisiología muscular",
          duration: "60 min",
          thumbnail: "https://blogs.ugto.mx/rea/wp-content/uploads/sites/71/2021/11/duehkshvxuq-1.jpg?w=400",
          completed: false
        },
        {
          id: "",
          title: "Análisis del Movimiento",
          duration: "60 min",
          thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=400",
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
                key={classItem.id || crypto.randomUUID()}
                className="cursor-pointer hover:shadow-md transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 relative"
                onClick={() => {
                  if (classItem.id) {
                    navigate(`/classes/${module.id}/${classItem.id}`);
                  }
                }}
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
                      {!classItem.id && (
                        <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                          Próximamente
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
