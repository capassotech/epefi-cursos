# epefi-cursos (app del alumno)

React 19 + Vite + TS, react-router-dom v6 (BrowserRouter, así que no hay `useBlocker`), TanStack Query, Tailwind v4, shadcn/Radix, sonner, lucide-react.

Las reglas generales de UI están en `../CLAUDE.md`.

## Comandos

- Verificar con `npx tsc -b` y `npx eslint <archivos>`.
- Hay errores de lint viejos. No arreglarlos salvo que se pida.

## Página del curso — `src/pages/Curso.tsx`
- Header de progreso con el porcentaje a la derecha. El título y las fechas se ocultan al hacer scroll.
- Card grande **"Continuar donde dejaste"**, que abre el visor en el último material visto. Usa `saveLastViewed`, `readLastViewed` y `pickResumeItem` de `src/lib/viewerPlaylist.ts`.
- Módulos:
  - La descripción va en un tooltip.
  - Un módulo con un solo ítem no es accordion: el ítem se muestra directo.
  - Las cards de ítem son clickeables enteras.
- Las secciones se llaman "Contenido" y "Documentos", sin "del curso". Los documentos del curso van sutiles, abajo de todo; en mobile son botones tipo pill.
- Al volver de un visor se restauran el scroll y las materias que estaban desplegadas (sessionStorage: `save/read/clearCourseViewState`).
- Flecha atrás: `navigate("/")`.

## Visor de material — `src/pages/Material.tsx`
- Ruta: `/curso/:courseId/material/:moduloId/:tipo/:index`. Está fuera del Layout y ocupa toda la pantalla.
- Barra superior mínima:
  - título del módulo y del ítem;
  - marcar como visto;
  - anterior / siguiente en todo el curso;
  - X grande para cerrar.
- Desktop: lista lateral (`src/components/ViewerPlaylist.tsx`) con los materiales anteriores y siguientes, el actual resaltado y "N de M vistos".
- Mobile:
  - El video va arriba (`aspect-video`) y la lista debajo, con ítems grandes para tocar.
  - Los documentos muestran una fila compacta con "Abrir".
  - Footer con Anterior / Marcar visto / Siguiente.
  - Al abrir un documento se navega al visor y además se abre en una pestaña nueva. Es a propósito: se mantiene aunque QA lo haya marcado como sugerencia.
- Desktop: el visor de PDF ocupa todo el espacio disponible y el archivo abre con zoom inicial del 75% (`#zoom=75`). No recortar el contenedor.
- Marca el material como visto automáticamente (actualiza la cache de TanStack Query y llama a `CoursesService.markContentAsCompleted`).
- Navegación del historial:
  - Entre ítems usa `replace`.
  - Cerrar usa `navigate(-1)` si se llegó desde el curso (`state.fromCourse`); si no, `replace` al curso.
- Player: `src/components/material/VideoPlayer.tsx`. Reproduce inline (`playsInline`). Tiene fullscreen (en iPhone: `webkitEnterFullscreen` para `<video>` y modo inmersivo por CSS para iframes) y protección contra descarga.
- Si el `<video>` falla (archivo propio, no YouTube/Drive): overlay "No se pudo cargar el video" con **Reintentar**, y un aviso por video y sesión a `POST /api/errores-video` (`CoursesService.reportVideoError`) con código de `MediaError`, user agent y conexión.
- Helpers de URLs: `src/lib/videoEmbed.ts`.
- `src/hooks/useCellularDataWarning.ts`:
  - Si un video se reproduce con datos móviles, muestra un toast que recomienda WiFi, una vez por sesión.
  - Solo funciona en navegadores Chrome-family de Android (Network Information API). En iPhone no está disponible.
- Videos con conexión lenta: no hay resolución adaptativa. Para tenerla habría que hostear en YouTube o Vimeo, o en Bunny, Cloudflare Stream o Mux.

## Evaluación — `src/pages/Evaluacion.tsx`
- Es una página aparte, fuera del Layout, con tres fases: intro, en curso y resultado.
- Antes de empezar, un AlertDialog en `CourseExamSection` muestra la duración y los intentos (`ExamStartSummary`).
- Defaults (`src/lib/examUtils.ts`): 1 intento y 90 minutos. `getExamBlockReason` dice por qué no se puede rendir.
- Las respuestas se guardan parcialmente en localStorage (`src/lib/examDraft.ts`).
- El timer se calcula contra el deadline y se congela mientras se envía.
- Si se pierde la conexión aparece un banner y se reenvía al volver la conexión.
- Con el reloj en 0 se bloquean las respuestas y Salir; el envío va como `tiempo` y sigue a corrección si corresponde.
- Solo hay un estado de confirmación, para que no se superpongan los diálogos.
- Solo se usa `beforeunload`; nada de pushState como guard, porque rompía el botón atrás.
- Volver al curso: `navigate(-1)` si vino del curso (`fromCourse`/`autoStart`).
- Resultado: tiles de Nota / Aciertos / Correctas (`src/components/exam/ExamParts.tsx`).
- La revisión del examen está en `VerExamenRealizadoModal.tsx`, a pantalla completa.

### Envío de la evaluación
- `idEnvio` se genera al empezar y se guarda en el borrador: reenviar nunca crea otro intento.
- `examService` tiene timeout y reintentos con espera al azar (`withRetry`). Al agotarse el tiempo, cada dispositivo espera hasta 30 s al azar antes de enviar, para repartir el pico, y el botón ya muestra "Enviando...". Si el envío falla, se sigue intentando solo cada 20-40 s.
- Si el servidor responde que el intento ya no se puede registrar (`EVALUACION_YA_APROBADA`, `EVALUACION_PENDIENTE_CORRECCION`, `INTENTOS_AGOTADOS`), se borra el borrador y se muestra el estado real.

## Ideas ofrecidas, no implementadas
- Guardado parcial de exámenes del lado del servidor. La tarea ya está redactada.
- Visor pdf.js para PDFs en mobile.
- Hosting de video adaptativo.
