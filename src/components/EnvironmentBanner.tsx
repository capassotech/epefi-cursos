import { AlertTriangle } from "lucide-react";

const EnvironmentBanner = () => {
  // Detectar si estamos en QA
  const isQA = import.meta.env.VITE_FIREBASE_PROJECT_ID === "epefi-admin-qa";

  // No mostrar si es producción
  if (!isQA) {
    return null;
  }

  // Franja fina dentro del flujo (no flotante): empuja el contenido en lugar de taparlo
  return (
    <div
      role="status"
      className="flex h-6 w-full items-center justify-center gap-1.5 bg-amber-400 text-[11px] font-semibold tracking-wide text-amber-950"
    >
      <AlertTriangle className="w-3 h-3" />
      <span>ENTORNO PARA PRUEBAS</span>
    </div>
  );
};

export default EnvironmentBanner;
