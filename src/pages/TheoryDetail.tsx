
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen, CheckCircle, PlayCircle } from "lucide-react";

const TheoryDetail = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();

  // Mock data - en una app real esto vendría de una API
  const theoryData = {
    title: "Anatomía y Fisiología del Ejercicio",
    readTime: "25 min",
    completed: false,
    sections: [
      {
        id: "sistema-muscular",
        title: "Sistema Muscular",
        content: `El sistema muscular está compuesto por más de 600 músculos que trabajan en conjunto para permitir el movimiento corporal. En el contexto del fitness grupal, es fundamental comprender cómo funcionan los diferentes tipos de fibras musculares.

Los músculos se clasifican en tres tipos principales:
- **Músculos esqueléticos**: Los que utilizamos para el movimiento voluntario
- **Músculos cardíacos**: El músculo del corazón
- **Músculos lisos**: Encontrados en órganos internos

Para el entrenamiento de fitness grupal, nos enfocamos principalmente en los músculos esqueléticos, que se pueden entrenar y fortalecer a través del ejercicio dirigido.`,
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600",
        videoEmbed: null
      },
      {
        id: "sistema-cardiovascular", 
        title: "Sistema Cardiovascular",
        content: `El sistema cardiovascular es el motor que impulsa nuestro rendimiento durante el ejercicio. Está compuesto por el corazón, los vasos sanguíneos y la sangre.

Durante el ejercicio aeróbico, el corazón aumenta su frecuencia para bombear más sangre oxigenada a los músculos que trabajan. Este proceso es fundamental para entender cómo diseñar entrenamientos efectivos.

**Adaptaciones cardiovasculares al ejercicio:**
- Aumento del volumen sistólico
- Mejora de la eficiencia cardíaca
- Reducción de la frecuencia cardíaca en reposo
- Mayor capacidad de transporte de oxígeno`,
        image: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600",
        videoEmbed: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "metabolismo-energetico",
        title: "Metabolismo Energético", 
        content: `El cuerpo humano utiliza tres sistemas energéticos principales para producir ATP (adenosín trifosfato), la "moneda energética" celular:

**1. Sistema Fosfagénico (ATP-PC)**
- Duración: 0-10 segundos
- Intensidad: Muy alta
- Ejemplo: Sprint corto, levantamiento de pesas

**2. Sistema Glucolítico**
- Duración: 10 segundos - 2 minutos  
- Intensidad: Alta
- Ejemplo: Ejercicios de HIIT

**3. Sistema Oxidativo**
- Duración: Más de 2 minutos
- Intensidad: Moderada a baja
- Ejemplo: Ejercicio aeróbico sostenido

Entender estos sistemas nos permite diseñar entrenamientos específicos según los objetivos de cada participante.`,
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
        videoEmbed: null
      }
    ],
    quiz: {
      question: "¿Cuál es el sistema energético principal utilizado durante un ejercicio de HIIT de 30 segundos?",
      options: [
        "Sistema Fosfagénico",
        "Sistema Glucolítico", 
        "Sistema Oxidativo",
        "Todos por igual"
      ],
      correct: 1
    }
  };

  const markAsCompleted = () => {
    // Aquí implementarías la lógica para marcar como completada
    console.log("Unidad marcada como completada");
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/theory')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="outline">Unidad Teórica</Badge>
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{theoryData.readTime}</span>
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {theoryData.title}
          </h1>
        </div>
      </div>

      {/* Progress */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6" />
              <div>
                <h3 className="font-medium">Progreso de Lectura</h3>
                <p className="text-sm text-purple-100">3 secciones por leer</p>
              </div>
            </div>
            {!theoryData.completed && (
              <Button 
                variant="secondary"
                onClick={markAsCompleted}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar Completada
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Sections */}
      <div className="space-y-8">
        {theoryData.sections.map((section, index) => (
          <Card key={section.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {section.title}
                </h2>
              </div>

              {section.image && (
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={section.image}
                    alt={section.title}
                    className="w-full h-48 md:h-64 object-cover"
                  />
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none">
                {section.content.split('\n').map((paragraph, pIndex) => {
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <h3 key={pIndex} className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">
                        {paragraph.slice(2, -2)}
                      </h3>
                    );
                  } else if (paragraph.startsWith('- **')) {
                    return (
                      <li key={pIndex} className="text-gray-600 dark:text-gray-300 ml-4">
                        <strong>{paragraph.slice(4, paragraph.indexOf('**', 4))}:</strong>
                        {paragraph.slice(paragraph.indexOf('**', 4) + 2)}
                      </li>
                    );
                  } else if (paragraph.startsWith('- ')) {
                    return (
                      <li key={pIndex} className="text-gray-600 dark:text-gray-300 ml-4">
                        {paragraph.slice(2)}
                      </li>
                    );
                  } else if (paragraph.trim()) {
                    return (
                      <p key={pIndex} className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {paragraph.split('**').map((part, partIndex) => 
                          partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
                        )}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>

              {section.videoEmbed && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Video Complementario</h3>
                  </div>
                  <div className="aspect-video bg-gray-900 rounded-lg">
                    <iframe
                      src={section.videoEmbed}
                      title={`Video: ${section.title}`}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz Section */}
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-700">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Pregunta de Autoevaluación
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {theoryData.quiz.question}
          </p>
          <div className="space-y-2">
            {theoryData.quiz.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto p-3 hover:bg-orange-100 dark:hover:bg-orange-900/30"
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Unidad Anterior
        </Button>
        <Button>
          Próxima Unidad
          <BookOpen className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default TheoryDetail;
