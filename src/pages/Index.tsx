
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Dumbbell, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const courses = [
    {
      id: "fitness-grupal",
      title: "Instructorado de Fitness Grupal",
      description: "Domina el arte de las clases grupales de fitness con teoría y práctica estructurada",
      level: "Intermedio",
      modules: 8,
      progress: 45,
      image: <Dumbbell className="w-12 h-12 text-white" />
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Fitness Edu
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Tu plataforma personal de educación y formación fitness
        </p>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 ml-1">
          Mis Cursos
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course) => (
            <Card 
              key={course.id}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              onClick={() => navigate("/curso")}
            >
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="bg-primary w-24 h-full p-6 flex items-center justify-center">
                    {course.image}
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{course.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{course.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {course.level}
                        </span>
                        <span className="text-xs">
                          {course.modules} módulos
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-1 w-full bg-gray-100 dark:bg-gray-700">
                  <div 
                    className="h-1 bg-primary" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty state for future courses */}
      <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border-dashed border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-gray-500 dark:text-gray-400">
            Próximamente más cursos
          </CardTitle>
          <CardDescription>
            Estamos preparando más contenido educativo
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Index;
