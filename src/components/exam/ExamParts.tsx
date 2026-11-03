import { Badge } from "@/components/ui/badge";
import { Award, Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNota, formatPorcentaje } from "@/lib/examUtils";
import type { ExamRules } from "@/lib/examUtils";
import type { ExamResultSummary } from "@/types/exam";

export function ExamResultDisplay({
  result,
  prominent = false,
  showStatus = false,
}: {
  result: ExamResultSummary;
  prominent?: boolean;
  showStatus?: boolean;
}) {
  return (
    <div className={cn("space-y-1", prominent ? "text-center" : "text-left")}>
      {showStatus && (
        <Badge
          variant={result.aprobado ? "default" : "destructive"}
          className={cn(prominent ? "mx-auto" : "")}
        >
          {result.aprobado ? "Aprobado" : "No aprobado"}
        </Badge>
      )}
      <p
        className={cn(
          "font-bold text-slate-900 dark:text-slate-100",
          prominent ? "text-3xl" : "text-base"
        )}
      >
        Aciertos: {formatPorcentaje(result.porcentajeAciertos)}
      </p>
      <p
        className={cn(
          "text-slate-700 dark:text-slate-300",
          prominent ? "text-xl" : "text-sm"
        )}
      >
        Nota: {formatNota(result.nota)}
      </p>
      {result.respuestasCorrectas != null && result.totalPreguntas != null && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Respuestas correctas: {result.respuestasCorrectas} de {result.totalPreguntas}
        </p>
      )}
    </div>
  );
}

/** Resumen de las condiciones que el alumno ve antes de comenzar */
export function ExamStartSummary({ rules }: { rules: ExamRules }) {
  const items = [
    {
      icon: Clock,
      label: "Tiempo disponible",
      value: `${rules.duracionMinutos} min`,
    },
    {
      icon: RotateCcw,
      label: "Intentos restantes",
      value: `${rules.intentosRestantes} de ${rules.intentosMaximos}`,
    },
    {
      icon: Award,
      label: "Nota mínima",
      value: String(rules.notaMinima),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center dark:border-slate-700 dark:bg-slate-800/50"
          >
            <Icon className="mx-auto mb-1.5 h-4 w-4 text-orange-500" />
            <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {value}
            </p>
            <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>
      <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
        <li>• El tiempo empieza a correr apenas comenzás y, al llegar a cero, la evaluación se envía sola.</li>
        <li>
          • Este será tu intento {rules.intentosUsados + 1} de {rules.intentosMaximos}. Si salís antes
          de finalizar, el intento se registra igual.
        </li>
      </ul>
    </div>
  );
}
