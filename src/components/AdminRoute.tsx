import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

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

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;

