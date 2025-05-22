
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Play, BookOpen, Filter } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState<'all' | 'classes' | 'theory'>('all');

  // Mock data - en una app real esto vendría de una API o base de datos
  const searchData = [
    {
      id: 'clase-1-1',
      type: 'class',
      title: 'Introducción al Fitness Grupal',
      description: 'Fundamentos básicos del entrenamiento grupal',
      module: 'Módulo 1',
      duration: '35 min',
      path: '/classes/modulo-1/clase-1-1'
    },
    {
      id: 'clase-2-1',
      type: 'class', 
      title: 'Entrenamiento de Fuerza',
      description: 'Técnicas y metodología para el desarrollo de la fuerza',
      module: 'Módulo 2',
      duration: '48 min',
      path: '/classes/modulo-2/clase-2-1'
    },
    {
      id: 'unidad-1',
      type: 'theory',
      title: 'Anatomía y Fisiología del Ejercicio',
      description: 'Sistema muscular, cardiovascular y metabolismo energético',
      readTime: '25 min',
      path: '/theory/unidad-1'
    },
    {
      id: 'unidad-3',
      type: 'theory',
      title: 'Biomecánica del Movimiento',
      description: 'Análisis técnico de ejercicios y planos de movimiento',
      readTime: '35 min',
      path: '/theory/unidad-3'
    },
    {
      id: 'clase-3-1',
      type: 'class',
      title: 'HIIT y Entrenamiento Funcional',
      description: 'Técnicas de alta intensidad y ejercicios funcionales',
      module: 'Módulo 3',
      duration: '45 min',
      path: '/classes/modulo-3/clase-3-1'
    },
    {
      id: 'unidad-4',
      type: 'theory',
      title: 'Nutrición Deportiva',
      description: 'Macronutrientes, hidratación y suplementación',
      readTime: '28 min',
      path: '/theory/unidad-4'
    }
  ];

  const filteredResults = useMemo(() => {
    let results = searchData;

    // Aplicar filtro por tipo
    if (filter !== 'all') {
      results = results.filter(item => item.type === filter);
    }

    // Aplicar búsqueda por texto
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        (item.type === 'class' && item.module?.toLowerCase().includes(searchTerm))
      );
    }

    return results;
  }, [query, filter]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Buscar Contenido
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Encuentra clases y material teórico
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="search"
          placeholder="Buscar por título, descripción o módulo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 h-12 text-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="whitespace-nowrap"
        >
          Todo
        </Button>
        <Button
          variant={filter === 'classes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('classes')}
          className="whitespace-nowrap"
        >
          Clases
        </Button>
        <Button
          variant={filter === 'theory' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('theory')}
          className="whitespace-nowrap"
        >
          Teoría
        </Button>
      </div>

      {/* Resultados */}
      <div className="space-y-3">
        {filteredResults.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''} encontrado{filteredResults.length !== 1 ? 's' : ''}
            </p>
            {filteredResults.map((item) => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === 'class'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                    }`}>
                      {item.type === 'class' ? (
                        <Play className="w-6 h-6" />
                      ) : (
                        <BookOpen className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {item.title}
                        </h3>
                        <Badge 
                          variant="outline"
                          className={`ml-2 ${
                            item.type === 'class'
                              ? 'border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300'
                              : 'border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {item.type === 'class' ? 'Clase' : 'Teoría'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {item.type === 'class' ? (
                          <>
                            <span>{item.module}</span>
                            <span>•</span>
                            <span>{item.duration}</span>
                          </>
                        ) : (
                          <span>Tiempo de lectura: {item.readTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
