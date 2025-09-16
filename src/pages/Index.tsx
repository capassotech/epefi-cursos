import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  BookOpen,
  Search,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  // Mock data - luego conectarás con tus servicios reales
  const stats = {
    progresoGeneral: 42,
    modulosCompletados: 8,
    totalModulos: 19,
    cursosActivos: 2,
    tiempoEstimado: "2.5h",
  };

  const contenidoReciente = [
    {
      id: "1",
      titulo: "Sistema Óseo",
      materia: "Anatomía y Fisiología",
      tipo: "video",
      duracion: "35 min",
      completado: true,
    },
    {
      id: "2",
      titulo: "Sistema Muscular",
      materia: "Anatomía y Fisiología",
      tipo: "pdf",
      duracion: "45 min",
      completado: false,
    },
    {
      id: "3",
      titulo: "Principios del Entrenamiento",
      materia: "Metodología del Entrenamiento",
      tipo: "video",
      duracion: "50 min",
      completado: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30 dark:from-gray-900 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-3xl"></div>
          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/50 p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 px-4 py-2">
                    <Zap className="w-4 h-4 mr-2" />
                    EPEFI Campus
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    Continúa tu{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                      formación profesional
                    </span>
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    Accede a contenido especializado en educación física,
                    organizado para maximizar tu aprendizaje y desarrollo
                    profesional.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => navigate("/classes")}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Continuar Aprendiendo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/search")}
                    className="border-2 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 px-6 py-3 rounded-xl transition-all duration-300"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Explorar Contenido
                  </Button>
                </div>
              </div>

              <div className="hidden md:block relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-800 dark:to-indigo-900 rounded-2xl rotate-3 opacity-20"></div>
                <img
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center"
                  alt="Educación Física"
                  className="relative rounded-2xl shadow-xl w-full h-72 object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              titulo: "Progreso",
              valor: `${stats.progresoGeneral}%`,
              descripcion: "Completado",
              icono: <TrendingUp className="w-5 h-5" />,
              color: "from-green-500 to-green-600",
              progreso: stats.progresoGeneral,
            },
            {
              titulo: "Módulos",
              valor: `${stats.modulosCompletados}/${stats.totalModulos}`,
              descripcion: "Finalizados",
              icono: <Target className="w-5 h-5" />,
              color: "from-orange-500 to-amber-500",
              progreso: (stats.modulosCompletados / stats.totalModulos) * 100,
            },
            {
              titulo: "Cursos",
              valor: stats.cursosActivos,
              descripcion: "Activos",
              icono: <Award className="w-5 h-5" />,
              color: "from-slate-500 to-slate-600",
              progreso: 100,
            },
            {
              titulo: "Tiempo",
              valor: stats.tiempoEstimado,
              descripcion: "Restante",
              icono: <Clock className="w-5 h-5" />,
              color: "from-gray-500 to-gray-600",
              progreso: 65,
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.icono}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {stat.valor}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {stat.titulo}
                  </p>
                  <Progress
                    value={stat.progreso}
                    className="h-1.5 bg-gray-100 dark:bg-gray-700"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card
            className="bg-gradient-to-br from-orange-500 to-amber-500 text-white border-0 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-2xl"
            onClick={() => navigate("/classes")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Ver Materias</h3>
                  <p className="text-orange-100 text-sm">
                    Contenido por módulos
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Play className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-slate-600 to-slate-700 text-white border-0 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-2xl"
            onClick={() => navigate("/theory")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Material Teórico</h3>
                  <p className="text-slate-200 text-sm">PDFs y documentos</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-gray-600 to-gray-700 text-white border-0 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-2xl"
            onClick={() => navigate("/search")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Buscar</h3>
                  <p className="text-gray-200 text-sm">Encuentra contenido</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Search className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Content */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Contenido Reciente
              </h2>
              <Button
                variant="ghost"
                onClick={() => navigate("/classes")}
                className="text-orange-600 hover:text-orange-700"
              >
                Ver todo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-4">
              {contenidoReciente.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.tipo === "video"
                          ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.tipo === "video" ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <BookOpen className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {item.titulo}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.materia}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.duracion}
                    </span>
                    {item.completado && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
