import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, FileText } from "lucide-react";
import { formatNota, formatPorcentaje } from "@/lib/examUtils";
import type { ExamRealizadoDetalle } from "@/types/exam";

interface VerExamenRealizadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detalle: ExamRealizadoDetalle | null;
  loading: boolean;
}

export default function VerExamenRealizadoModal({
  open,
  onOpenChange,
  detalle,
  loading,
}: VerExamenRealizadoModalProps) {
  const preguntas = detalle?.detallePreguntas ?? detalle?.preguntas ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Examen realizado
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : !detalle ? (
          <p className="text-sm text-muted-foreground py-4">
            No se pudo cargar el examen realizado.
          </p>
        ) : (
          <div className="overflow-y-auto pr-2 space-y-4 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground mb-2">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Nota:{" "}
                  <strong className="text-foreground">{formatNota(detalle.nota)}</strong>
                </span>
                <span>
                  Aciertos:{" "}
                  <strong className="text-foreground">
                    {formatPorcentaje(detalle.porcentajeAciertos)}
                  </strong>
                </span>
                <Badge variant={detalle.aprobado ? "default" : "destructive"}>
                  {detalle.aprobado ? "Aprobado" : "No aprobado"}
                </Badge>
              </div>
              {detalle.intentoNumero != null && (
                <span>Intento {detalle.intentoNumero}</span>
              )}
            </div>

            {preguntas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No se encontraron preguntas para este intento.
              </p>
            ) : (
              preguntas.map((pregunta, index) => (
                <Card
                  key={pregunta.id}
                  className="border-slate-200 dark:border-slate-700"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-medium leading-snug">
                        Pregunta {pregunta.orden || index + 1}: {pregunta.texto}
                      </CardTitle>
                      <Badge
                        variant={pregunta.acertada ? "default" : "destructive"}
                        className="flex-shrink-0"
                      >
                        {pregunta.acertada ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Correcta
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            Incorrecta
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Opciones
                      </p>
                      {pregunta.opciones.map((opcion) => (
                        <div
                          key={opcion.id}
                          className={`p-3 rounded-lg border text-sm ${
                            opcion.esCorrecta
                              ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20"
                              : opcion.seleccionadaPorAlumno
                                ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20"
                                : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5">
                              {opcion.esCorrecta ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : opcion.seleccionadaPorAlumno ? (
                                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                              ) : (
                                <span className="w-4 h-4 block" />
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span
                                className={
                                  opcion.esCorrecta
                                    ? "font-medium text-green-800 dark:text-green-200"
                                    : opcion.seleccionadaPorAlumno
                                      ? "font-medium text-red-800 dark:text-red-200"
                                      : "text-slate-700 dark:text-slate-300"
                                }
                              >
                                {opcion.texto}
                              </span>
                              {opcion.esCorrecta && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                  (Respuesta correcta)
                                </span>
                              )}
                              {opcion.seleccionadaPorAlumno && (
                                <span
                                  className={`ml-2 text-xs ${
                                    opcion.esCorrecta
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  (Tu elección)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
