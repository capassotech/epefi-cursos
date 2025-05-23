import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen, CheckCircle, PlayCircle } from "lucide-react";

const TheoryDetail = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();

  // Nuevo contenido basado en MODULO 1 ÓSEO.pdf
  const theoryData = {
    title: "Anatomía del Sistema Óseo",
    readTime: "30 min",
    completed: false,
    sections: [
      {
        id: "introduccion-biologia",
        title: "Introducción a la Biología Humana",
        content: `La biología estudia todo lo que está dotado de vida. En el caso del ser humano, se divide en ciencias morfológicas (anatomía) y fisiológicas (fisiología).\n\n- **Anatomía**: Estudia la forma, estructura, situación y relaciones de las partes del cuerpo.\n- **Fisiología**: Analiza cómo funcionan las células, tejidos, órganos y sistemas del organismo.`,
        image: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600 ",
        videoEmbed: null
      },
      {
        id: "aparato-locomotor",
        title: "Aparato Locomotor",
        content: `El aparato locomotor es el encargado del movimiento corporal y está compuesto por:\n\n- **Sistema Óseo**: Proporciona soporte y protección.\n- **Sistema Articular**: Permite movilidad entre huesos.\n- **Sistema Muscular**: Genera movimiento mediante contracciones.\n\nAdemás, otros sistemas reguladores como el nervioso y endocrino influyen directamente en su funcionamiento.`,
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600 ",
        videoEmbed: "https://www.youtube.com/embed/dQw4w9WgXcQ "
      },
      {
        id: "sistema-oseo",
        title: "Sistema Óseo",
        content: `El sistema óseo está formado por huesos, cartílagos y articulaciones. Cumple funciones esenciales como:\n\n- Protección de órganos internos (ej.: cerebro, corazón).\n- Sostén de músculos y órganos.\n- Facilitación del movimiento junto a los músculos.\n- Producción de células sanguíneas (hematopoyesis).\n\nLos huesos están compuestos por:\n\n- **Células óseas**:\n  - *Osteoblastos*: Forman tejido óseo.\n  - *Osteocitos*: Mantienen la matriz ósea.\n  - *Osteoclastos*: Destruyen tejido óseo viejo.\n\n- **Matriz orgánica**: Contiene colágeno (resistencia y flexibilidad).\n- **Sales inorgánicas**: Principalmente calcio y fósforo (dureza y rigidez).`,
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600 ",
        videoEmbed: null
      },
      {
        id: "clasificacion-huesos",
        title: "Clasificación de los Huesos",
        content: `Según su forma y dimensiones, los huesos se clasifican en:\n\n- **Huesos largos**: Predomina la longitud (ej.: fémur, húmero).\n- **Huesos cortos**: Tienen forma cúbica (ej.: carpo, tarso).\n- **Huesos planos**: Grandes superficies anchas (ej.: cráneo, escápula).\n- **Huesos irregulares**: No entran en categorías anteriores (ej.: vértebras, maxilar).\n\nTambién existen dos tipos de tejido óseo:\n\n- **Tejido compacto**: Denso y resistente (diáfisis de huesos largos).\n- **Tejido esponjoso**: Con cavidades llenas de médula ósea (epífisis y huesos planos).`,
        image: null,
        videoEmbed: null
      },
      {
        id: "desarrollo-huesos",
        title: "Desarrollo y Osificación",
        content: `El proceso de osificación transforma membranas o cartílagos en hueso. Este proceso comienza durante el desarrollo fetal y puede durar hasta los 30 años.\n\n- El crecimiento longitudinal ocurre en el **cartílago de crecimiento** de las epífisis.\n- Las hormonas principales son:\n  - Hormona del crecimiento (GH)\n  - Estrógenos (en mujeres)\n  - Testosterona (en hombres)\n\nEl ejercicio físico favorece el ancho, densidad y resistencia ósea, aunque tiene poco efecto sobre la longitud final del hueso.`,
        image: null,
        videoEmbed: null
      }
    ],
    quiz: {
      question: "¿Cuál de las siguientes NO es una función principal del sistema óseo?",
      options: [
        "Protección de órganos internos",
        "Producción de células sanguíneas",
        "Movimiento activo del cuerpo",
        "Soporte de tejidos blandos"
      ],
      correct: 2
    }
  };

  const markAsCompleted = () => {
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
                <p className="text-sm text-purple-100">{theoryData.sections.length} secciones por leer</p>
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