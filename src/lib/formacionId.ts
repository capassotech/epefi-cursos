/** Resuelve el id de formación usado por el backend (colección examenes / idFormacion). */
export function resolveFormacionId(
  coursePayload: unknown,
  routeCourseId: string
): string {
  if (!coursePayload || typeof coursePayload !== "object") {
    return routeCourseId;
  }

  const c = coursePayload as Record<string, unknown>;
  const candidates = [
    c.idFormacion,
    c.id_formacion,
    c.formacionId,
    c.formacion_id,
    c.id,
    c._id,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return routeCourseId;
}
