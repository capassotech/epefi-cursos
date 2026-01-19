import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Calendar,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CoursesService from "@/services/coursesService";
import { Curso } from "@/types/types";

const Admin = () => {
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  const [courses, setCourses] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Curso | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"planDeEstudios" | "fechasDeExamenes" | null>(null);

  // Verificar si el usuario es administrador
  const isAdmin = () => {
    if (!user) return false;
    if (typeof user.role === "string") {
      return user.role === "admin";
    }
    if (typeof user.role === "object" && user.role !== null) {
      return (user.role as any).admin === true;
    }
    return false;
  };

  useEffect(() => {
    if (!isAdmin()) {
      toast.error("Acceso denegado", {
        description: "Solo los administradores pueden acceder a esta sección.",
      });
      navigate("/");
      return;
    }

    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const response = await CoursesService.getAllCourses(token);
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast.error("Error al cargar cursos", {
        description: error.message || "No se pudieron cargar los cursos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (course: Curso, type: "planDeEstudios" | "fechasDeExamenes", file: File | null) => {
    if (!file || !firebaseUser) return;

    // Validar que el usuario sea administrador
    if (!isAdmin()) {
      toast.error("Acceso denegado", {
        description: "Solo los administradores pueden subir archivos.",
      });
      return;
    }

    // Validar tipo de archivo
    if (file.type !== "application/pdf") {
      toast.error("Formato inválido", {
        description: "Solo se permiten archivos PDF.",
      });
      return;
    }

    // Validar tamaño (10 MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Archivo demasiado grande", {
        description: "El archivo no debe superar los 10 MB.",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadType(type);
      const token = await firebaseUser.getIdToken();
      await CoursesService.uploadPDF(file, course.id, type, token);
      
      toast.success("Archivo subido exitosamente", {
        description: `${type === "planDeEstudios" ? "Plan de estudios" : "Fechas de exámenes"} actualizado correctamente.`,
      });

      // Actualizar la lista de cursos
      await fetchCourses();
      setSelectedCourse(null);
      setUploadType(null);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error("Error al subir archivo", {
        description: error.response?.data?.error || error.message || "No se pudo subir el archivo.",
      });
    } finally {
      setUploading(false);
      setUploadType(null);
    }
  };

  const formatDate = (date: string | Date | any | undefined): string => {
    if (!date) return "N/A";
    
    try {
      let dateObj: Date;
      
      if (typeof date === "string") {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (date && typeof date.toDate === "function") {
        dateObj = date.toDate();
      } else if (date && typeof date.getTime === "function") {
        dateObj = date;
      } else if (date && typeof date.seconds === "number") {
        dateObj = new Date(date.seconds * 1000);
      } else if (date && typeof date._seconds === "number") {
        dateObj = new Date(date._seconds * 1000);
      } else {
        dateObj = new Date(date);
      }
      
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return "N/A";
      }
      
      return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-300"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-[13px] uppercase tracking-wider text-orange-500">Administración</p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Gestión de Cursos
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No hay cursos disponibles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.titulo}</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {course.descripcion}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedCourse(selectedCourse?.id === course.id ? null : course)
                      }
                    >
                      {selectedCourse?.id === course.id ? "Ocultar" : "Gestionar"}
                    </Button>
                  </div>
                </CardHeader>

                {selectedCourse?.id === course.id && (
                  <CardContent className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {/* Plan de Estudios */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`plan-${course.id}`} className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-orange-500" />
                          Plan de Estudios
                        </Label>
                        {course.planDeEstudiosUrl && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Actualizado: {formatDate(course.planDeEstudiosFechaActualizacion)}
                            </span>
                          </div>
                        )}
                      </div>
                      {course.planDeEstudiosUrl && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(course.planDeEstudiosUrl!, "_blank")}
                          >
                            Ver PDF
                          </Button>
                        </div>
                      )}
                      {isAdmin() ? (
                        <>
                          <div className="flex gap-2">
                            <Input
                              id={`plan-${course.id}`}
                              type="file"
                              accept="application/pdf"
                              disabled={uploading && uploadType === "planDeEstudios"}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  handleFileSelect(course, "planDeEstudios", file);
                                }
                              }}
                              className="flex-1"
                            />
                            {uploading && uploadType === "planDeEstudios" && (
                              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Solo PDF, máximo 10 MB
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          Solo los administradores pueden subir archivos
                        </p>
                      )}
                    </div>

                    {/* Fechas de Exámenes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`fechas-${course.id}`} className="text-sm font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          Fechas de Exámenes
                        </Label>
                        {course.fechasDeExamenesUrl && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Actualizado: {formatDate(course.fechasDeExamenesFechaActualizacion)}
                            </span>
                          </div>
                        )}
                      </div>
                      {course.fechasDeExamenesUrl && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(course.fechasDeExamenesUrl!, "_blank")}
                          >
                            Ver PDF
                          </Button>
                        </div>
                      )}
                      {isAdmin() ? (
                        <>
                          <div className="flex gap-2">
                            <Input
                              id={`fechas-${course.id}`}
                              type="file"
                              accept="application/pdf"
                              disabled={uploading && uploadType === "fechasDeExamenes"}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  handleFileSelect(course, "fechasDeExamenes", file);
                                }
                              }}
                              className="flex-1"
                            />
                            {uploading && uploadType === "fechasDeExamenes" && (
                              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Solo PDF, máximo 10 MB
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          Solo los administradores pueden subir archivos
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
