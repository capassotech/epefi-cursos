import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si el usuario está deshabilitado, redirigir a la página principal
  // donde se mostrará el mensaje de advertencia
  if (user && user.activo === false) {
    // Si ya está en la página principal, permitir renderizar para mostrar el mensaje
    if (location.pathname === "/") {
      return <Outlet />;
    }
    // De lo contrario, redirigir a la página principal
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;


