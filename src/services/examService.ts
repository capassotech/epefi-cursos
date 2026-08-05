import axios from "axios";
import { getAuth } from "firebase/auth";
import type {
  CourseExam,
  ExamEstado,
  ExamRealizadoDetalle,
  ExamResultSummary,
  ExamUltimoIntento,
  SubmitExamPayload,
  SubmitExamResult,
} from "@/types/exam";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

function mapPreguntas(preguntasRaw: Record<string, unknown>[]): CourseExam["preguntas"] {
  return preguntasRaw.map((p, index) => {
    const opcionesRaw = p.respuestas ?? p.opciones ?? p.options ?? [];

    const opciones = Array.isArray(opcionesRaw)
      ? opcionesRaw.map((o: Record<string, unknown>, oi: number) => ({
          id: String(o.id ?? o._id ?? `opt-${index}-${oi}`),
          texto: String(o.texto ?? o.text ?? o.label ?? o.descripcion ?? ""),
        }))
      : [];

    const tipoInput = p.tipoInput ?? p.tipo ?? p.inputType;

    return {
      id: String(p.id ?? p._id ?? `q-${index}`),
      texto: String(p.texto ?? p.text ?? p.pregunta ?? p.enunciado ?? ""),
      orden: typeof p.orden === "number" ? p.orden : index,
      tipoInput: typeof tipoInput === "string" ? tipoInput : undefined,
      tipo:
        typeof tipoInput === "string"
          ? tipoInput.toLowerCase().includes("checkbox") ||
            tipoInput.toLowerCase().includes("multi")
            ? "checkbox"
            : "radio"
          : undefined,
      opciones,
    };
  });
}

function normalizeExamResult(raw: Record<string, unknown>): ExamResultSummary | undefined {
  const nota = Number(raw.nota ?? raw.score);
  if (Number.isNaN(nota)) return undefined;

  let porcentajeAciertos = Number(raw.porcentajeAciertos ?? raw.porcentaje_aciertos);
  if (Number.isNaN(porcentajeAciertos)) {
    porcentajeAciertos = nota * 10;
  }

  const respuestasCorrectas = Number(
    raw.respuestasCorrectas ??
      raw.respuestas_correctas ??
      raw.preguntasCorrectas ??
      raw.preguntas_correctas
  );
  const totalPreguntas = Number(raw.totalPreguntas ?? raw.total_preguntas);

  return {
    nota,
    aprobado: toBool(raw.aprobado ?? raw.approved),
    porcentajeAciertos,
    ...(Number.isNaN(respuestasCorrectas) ? {} : { respuestasCorrectas }),
    ...(Number.isNaN(totalPreguntas) ? {} : { totalPreguntas }),
  };
}

function normalizeUltimoIntento(
  raw: Record<string, unknown>
): ExamUltimoIntento | undefined {
  const summary = normalizeExamResult(raw);
  if (!summary) return undefined;

  const id = raw.id ?? raw._id;
  const intentoNumero = Number(raw.intentoNumero ?? raw.intento_numero ?? raw.intento);
  const fechaRaw = raw.fechaRealizacion ?? raw.fecha_realizacion ?? raw.fecha;

  return {
    ...summary,
    ...(typeof id === "string" && id.length > 0 ? { id } : {}),
    ...(Number.isNaN(intentoNumero) ? {} : { intentoNumero }),
    ...(typeof fechaRaw === "string" ? { fechaRealizacion: fechaRaw } : {}),
  };
}

function normalizeExamEstado(data: unknown): ExamEstado {
  const raw =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const ultimo = raw.ultimoIntento ?? raw.ultimo_intento;
  const ultimoIntento =
    ultimo && typeof ultimo === "object"
      ? normalizeUltimoIntento(ultimo as Record<string, unknown>)
      : undefined;

  const progresoRaw = raw.progresoFormacion ?? raw.progreso_formacion;
  let progresoFormacion: ExamEstado["progresoFormacion"];
  if (progresoRaw && typeof progresoRaw === "object") {
    const p = progresoRaw as Record<string, unknown>;
    progresoFormacion = {
      totalModulos: Number(p.totalModulos ?? p.total_modulos ?? 0),
      modulosCompletados: Number(p.modulosCompletados ?? p.modulos_completados ?? 0),
      modulosPendientes: Number(p.modulosPendientes ?? p.modulos_pendientes ?? 0),
    };
  }

  const idExamen = raw.idExamen ?? raw.id_examen;
  const titulo = raw.tituloExamen ?? raw.titulo ?? raw.title;
  const duracionRaw = Number(raw.duracionMinutos ?? raw.duracion_minutos);

  return {
    examenDisponible: toBool(raw.examenDisponible ?? raw.examen_disponible),
    puedeRealizar: toBool(raw.puedeRealizar ?? raw.puede_realizar),
    formacionCompleta: toBool(raw.formacionCompleta ?? raw.formacion_completa),
    idExamen: typeof idExamen === "string" && idExamen.length > 0 ? idExamen : undefined,
    titulo: typeof titulo === "string" ? titulo : undefined,
    duracionMinutos:
      !Number.isNaN(duracionRaw) && duracionRaw > 0 ? duracionRaw : 90,
    notaMinima: 7,
    progresoFormacion,
    ultimoIntento,
  };
}

function normalizeStudentExam(data: unknown, idExamen: string): CourseExam | null {
  if (!data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  const preguntasRaw = raw.preguntas ?? raw.questions;
  if (!Array.isArray(preguntasRaw) || preguntasRaw.length === 0) return null;

  const titulo = raw.titulo ?? raw.title;
  const duracionRaw = Number(raw.duracionMinutos ?? raw.duracion_minutos);

  return {
    id: String(raw.id ?? idExamen),
    idFormacion:
      typeof raw.idFormacion === "string"
        ? raw.idFormacion
        : typeof raw.id_formacion === "string"
          ? raw.id_formacion
          : undefined,
    titulo: typeof titulo === "string" ? titulo : undefined,
    duracionMinutos:
      !Number.isNaN(duracionRaw) && duracionRaw > 0 ? duracionRaw : 90,
    preguntas: mapPreguntas(preguntasRaw as Record<string, unknown>[]),
  };
}

function normalizeSubmitResult(data: unknown): SubmitExamResult {
  const raw =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const resultado = (raw.resultado ?? raw.examenRealizado ?? raw) as Record<
    string,
    unknown
  >;

  const summary =
    normalizeExamResult(resultado) ??
    normalizeExamResult(raw) ?? {
      nota: 0,
      aprobado: false,
      porcentajeAciertos: 0,
    };

  return {
    ...summary,
    mensaje: typeof raw.message === "string" ? raw.message : undefined,
    puedeReintentar: toBool(resultado.puedeReintentar ?? raw.puedeReintentar),
    examenRealizado: {
      id: String(resultado.id ?? ""),
      ...summary,
    },
  };
}

function normalizeExamenRealizadoDetalle(data: unknown): ExamRealizadoDetalle {
  const raw =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const summary =
    normalizeUltimoIntento(raw) ??
    normalizeExamResult(raw) ?? {
      nota: 0,
      aprobado: false,
      porcentajeAciertos: 0,
    };

  const preguntasRaw = raw.detallePreguntas ?? raw.preguntas;
  const preguntas = Array.isArray(preguntasRaw)
    ? preguntasRaw.map((item, index) => {
        const p = item as Record<string, unknown>;
        const opcionesRaw = p.opciones ?? p.respuestas;
        const opciones = Array.isArray(opcionesRaw)
          ? opcionesRaw.map((o) => {
              const opt = o as Record<string, unknown>;
              return {
                id: String(opt.id ?? ""),
                texto: String(opt.texto ?? opt.text ?? ""),
                esCorrecta: toBool(opt.esCorrecta ?? opt.correcta),
                seleccionadaPorAlumno: toBool(
                  opt.seleccionadaPorAlumno ?? opt.seleccionada ?? opt.selected
                ),
              };
            })
          : [];

        return {
          orden: typeof p.orden === "number" ? p.orden : index + 1,
          id: String(p.id ?? p.idPregunta ?? `q-${index}`),
          texto: String(p.texto ?? p.pregunta ?? ""),
          tipoInput: typeof p.tipoInput === "string" ? p.tipoInput : undefined,
          esCorrecta: toBool(p.esCorrecta ?? p.acertada),
          acertada: toBool(p.acertada ?? p.esCorrecta),
          respuestasSeleccionadas: Array.isArray(p.respuestasSeleccionadas)
            ? (p.respuestasSeleccionadas as Record<string, unknown>[]).map((r) => ({
                id: String(r.id ?? ""),
                texto: String(r.texto ?? ""),
                esCorrecta: toBool(r.esCorrecta),
              }))
            : [],
          respuestasCorrectas: Array.isArray(p.respuestasCorrectas)
            ? (p.respuestasCorrectas as Record<string, unknown>[]).map((r) => ({
                id: String(r.id ?? ""),
                texto: String(r.texto ?? ""),
              }))
            : [],
          opciones,
        };
      })
    : undefined;

  return {
    ...summary,
    id: String(raw.id ?? summary.id ?? ""),
    idExamen: String(raw.idExamen ?? raw.id_examen ?? ""),
    idFormacion: String(raw.idFormacion ?? raw.id_formacion ?? ""),
    tituloExamen:
      typeof raw.tituloExamen === "string" ? raw.tituloExamen : undefined,
    tituloFormacion:
      typeof raw.tituloFormacion === "string" ? raw.tituloFormacion : undefined,
    estado: typeof raw.estado === "string" ? raw.estado : undefined,
    ...(preguntas ? { preguntas, detallePreguntas: preguntas } : {}),
  };
}

class ExamService {
  /** Paso 1: estado al entrar a la formación. */
  async getExamEstado(idFormacion: string): Promise<ExamEstado> {
    const response = await api.get(
      `/examenes/alumno/formacion/${encodeURIComponent(idFormacion)}/estado`
    );
    return normalizeExamEstado(response.data);
  }

  /** Paso 3: preguntas para el alumno (aleatorio automático en reintentos). */
  async getExamForStudent(idExamen: string): Promise<CourseExam | null> {
    const response = await api.get(`/examenes/alumno/${encodeURIComponent(idExamen)}`);
    return normalizeStudentExam(response.data, idExamen);
  }

  /** Paso 4: enviar respuestas. */
  async submitExam(payload: SubmitExamPayload): Promise<SubmitExamResult> {
    const response = await api.post("/examenes-realizados", payload);
    return normalizeSubmitResult(response.data);
  }

  /** Detalle del intento (preguntas, respuestas del alumno y correctas). */
  async getExamenRealizadoDetalle(id: string): Promise<ExamRealizadoDetalle> {
    const response = await api.get(
      `/examenes-realizados/alumno/intento/${encodeURIComponent(id)}`
    );
    return normalizeExamenRealizadoDetalle(response.data);
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (typeof data === "object" && data !== null && "error" in data) {
      return String((data as Record<string, unknown>).error);
    }
    if (typeof data === "string") return data;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default new ExamService();
