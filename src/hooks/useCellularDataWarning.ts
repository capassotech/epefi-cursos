import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Network Information API: solo Chrome/Edge/Samsung Internet/Opera en Android informan el tipo
 * de conexión. Safari (y todo navegador en iPhone) no lo expone, así que ahí no se avisa.
 */
type NetworkConnection = EventTarget & {
  type?: "wifi" | "cellular" | "ethernet" | "bluetooth" | "wimax" | "other" | "none" | "unknown";
};

const getConnection = (): NetworkConnection | undefined =>
  (navigator as Navigator & { connection?: NetworkConnection }).connection;

const SHOWN_KEY = "epefi-cellular-warning-shown";

const alreadyShown = () => {
  try {
    return window.sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
};

const markShown = () => {
  try {
    window.sessionStorage.setItem(SHOWN_KEY, "1");
  } catch {
    // Sin almacenamiento: el aviso podría repetirse, no es grave
  }
};

/** Recomienda conectarse a WiFi cuando se mira un video con datos móviles (una vez por sesión). */
export function useCellularDataWarning(active: boolean) {
  useEffect(() => {
    const connection = getConnection();
    if (!active || !connection) return;

    const check = () => {
      if (connection.type !== "cellular" || alreadyShown()) return;
      markShown();
      toast.info("Estás usando datos móviles", {
        description: "Los videos consumen muchos datos. Te recomendamos conectarte a una red WiFi.",
        duration: 8000,
      });
    };

    check();
    // También avisa si pasa de WiFi a datos mientras mira
    connection.addEventListener("change", check);
    return () => connection.removeEventListener("change", check);
  }, [active]);
}
