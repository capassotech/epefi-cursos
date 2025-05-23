
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Clock, Users, Download, Share } from "lucide-react";
import { url } from "inspector";

const ClassDetail = () => {
  const { moduleId, classId } = useParams();
  const navigate = useNavigate();

  // Mock data - en una app real esto vendría de una API
  const classData = {
    title: "Anatomía del esqueleto humano",
    description: "En esta clase se desarrolla una introducción clara al esqueleto humano abordando cuatro ejes fundamentales: su definición y concepto general, la clasificación y funciones de los huesos, los tejidos que lo componen, y la ubicación anatómica de todos los huesos del cuerpo. Un repaso esencial para comprender la base estructural del cuerpo humano y su importancia en el movimiento y la práctica segura del fitness grupal.",
    duration: "70 min",
    instructor: "Prof. Laura Martino",
    module: "Módulo 1: Anatomía y Fisiología",
    videoUrl: "https://drive.google.com/file/d/11t1DmY5OsDrakooS2RFsNNfUQTALOkh8/preview", // Placeholder
    objectives: [
      "Definición, concepto",
      "Los huesos",
      "Tejidos",
      "Ubicación anatómica de todos los huesos"
    ],
    resources: [
      { name: "Aparato locomotor", type: "PDF", url: "https://drive.google.com/file/d/1ch4A3_KQTMm3MK5HkgttW61lZE8bp4aZ/view?usp=sharing" },
    ]
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/classes')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <Badge variant="outline" className="mb-2">
            {classData.module}
          </Badge>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {classData.title}
          </h1>
        </div>
      </div>

      {/* Video Player */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-900 rounded-t-lg relative">
            <iframe
              src={classData.videoUrl}
              title={classData.title}
              className="w-full h-full rounded-t-lg"
              allowFullScreen
            />
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{classData.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{classData.instructor}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description and Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Descripción
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {classData.description}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Objetivos de Aprendizaje
            </h2>
            <ul className="space-y-2">
              {classData.objectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-300">{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Resources */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Material Complementario
          </h2>
          <div className="space-y-3">
            {classData.resources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{resource.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{resource.type}</p>
                  </div>
                </div>
                <a
                  href={resource.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    Descargar
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Clase Anterior
        </Button>
        <Button>
          Próxima Clase
          <Play className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ClassDetail;