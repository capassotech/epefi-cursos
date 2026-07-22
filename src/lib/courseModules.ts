import type { Materia, Modulo } from "@/types/types";

/** Lista ordenada según materia.modulos; incluye módulos con id_materia correcto. */
export function getModulesForMateria(materia: Materia, modulos: Modulo[]): Modulo[] {
  const byId = new Map(modulos.map((m) => [m.id, m]));
  const ordered: Modulo[] = [];
  const seen = new Set<string>();

  for (const moduleId of materia.modulos ?? []) {
    const modulo = byId.get(moduleId);
    if (modulo) {
      ordered.push(modulo);
      seen.add(moduleId);
    }
  }

  for (const modulo of modulos) {
    if (modulo.id_materia === materia.id && !seen.has(modulo.id)) {
      ordered.push(modulo);
      seen.add(modulo.id);
    }
  }

  return ordered;
}

export function getMissingModuleIds(materia: Materia, modulos: Modulo[]): string[] {
  const loaded = new Set(modulos.map((m) => m.id));
  return (materia.modulos ?? []).filter((id) => !loaded.has(id));
}

