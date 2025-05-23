
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, BookOpen, Clock, Trophy, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Curso = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "Clases presenciales completadas", value: "3/17", progress: 18 },
    { label: "Tiempo de cursado", value: "10.5h", progress: 18 },
    { label: "Unidades de teoría", value: "1/6", progress: 16 },
  ];

  const recentActivity = [
    { type: "class", title: "Anatomía del esqueleto humano", module: "Módulo 1", duration: "70 min" },
    { type: "theory", title: "Anatomía del esqueleto humano", unit: "Módulo 1", readTime: "30 min" },
    // { type: "class", title: "Articulaciones", module: "Módulo 2", duration: "60 min" },
    // { type: "theory", title: "Articulaciones", unit: "Módulo 2", readTime: "30 min" },
    // { type: "class", title: "Planos y ejes corporales", module: "Módulo 3", duration: "30 min" },
    // { type: "theory", title: "Planos y ejes corporales", unit: "Módulo 3", readTime: "30 min" },
    // { type: "class", title: "Músculos", module: "Módulo 4", duration: "30 min" },
    // { type: "theory", title: "Músculos", unit: "Módulo 4", readTime: "30 min" },
    // { type: "class", title: "Fisiología muscular", module: "Módulo 5", duration: "30 min" },
    // { type: "theory", title: "Fisiología muscular", unit: "Módulo 5", readTime: "30 min" },
    // { type: "class", title: "Análisis del Movimiento", module: "Módulo 6", duration: "30 min" },
    // { type: "theory", title: "Análisis del Movimiento", unit: "Módulo 6", readTime: "30 min" },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Instructorado de fitness grupal
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Clases grabadas y material teórico para que puedas estudiar a tu ritmo
        </p>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-background border-border shadow-lg">
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
          className="bg-primary text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => navigate("/classes")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Clases Grabadas
                </CardTitle>
                <CardDescription className="text-white/80">
                  Videos organizados por módulo
                </CardDescription>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="bg-black text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => navigate("/theory")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Material Teórico
                </CardTitle>
                <CardDescription className="text-white/80">
                  Todo lo que necesitas para estudiar
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
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                    : 'bg-black/10 dark:bg-white/10 text-black dark:text-white'
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
      <Card className="bg-primary text-white border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">¿Listo para continuar aprendiendo?</CardTitle>
          <CardDescription className="text-white/80">
            Accede a todo tu contenido educativo organizado y optimizado para mobile
          </CardDescription>
          <div className="pt-4 space-x-4">
            <Button 
              variant="secondary" 
              onClick={() => navigate("/classes")}
              className="bg-white text-primary hover:bg-gray-100"
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

export default Curso;
