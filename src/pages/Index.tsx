
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, BookOpen, Clock, Trophy, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "Clases Completadas", value: "12/24", progress: 50 },
    { label: "Unidades de Teoría", value: "8/15", progress: 53 },
    { label: "Tiempo de Estudio", value: "24h", progress: 75 },
  ];

  const recentActivity = [
    { type: "class", title: "Técnicas de Cardio HIIT", module: "Módulo 3", duration: "45 min" },
    { type: "theory", title: "Anatomía del Ejercicio", unit: "Unidad 2", readTime: "15 min" },
    { type: "class", title: "Flexibilidad y Movilidad", module: "Módulo 2", duration: "30 min" },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Instructorado de Fitness
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Tu plataforma personal para dominar el arte del fitness grupal. Organiza, estudia y progresa.
        </p>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={stat.progress} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => navigate("/classes")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Clases Grabadas
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Videos organizados por módulo
                </CardDescription>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => navigate("/theory")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Material Teórico
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Contenido enriquecido y multimedia
                </CardDescription>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivity.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.type === 'class' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                }`}>
                  {item.type === 'class' ? <Play className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.type === 'class' ? item.module : item.unit}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {item.type === 'class' ? item.duration : item.readTime}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-orange-400 to-pink-500 text-white border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">¿Listo para continuar aprendiendo?</CardTitle>
          <CardDescription className="text-orange-100">
            Accede a todo tu contenido educativo organizado y optimizado para mobile
          </CardDescription>
          <div className="pt-4 space-x-4">
            <Button 
              variant="secondary" 
              onClick={() => navigate("/classes")}
              className="bg-white text-orange-500 hover:bg-gray-100"
            >
              Ver Clases
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/theory")}
              className="border-white text-white hover:bg-white/10"
            >
              Estudiar Teoría
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Index;
