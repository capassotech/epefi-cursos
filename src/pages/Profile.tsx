import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const getUserInitials = () => {
    if (user?.nombre && user?.apellido) {
      return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getRoleDisplayName = (role: any) => {
    if (!role) return "Usuario";
    if (typeof role === "string") {
      if (role === "admin") return "Administrador";
      if (role === "student" || role === "alumno") return "Estudiante";
      return "Usuario";
    }
    if (typeof role === "object") {
      if (role.admin) return "Administrador";
      if (role.student) return "Estudiante";
      return "Usuario";
    }
    return "Usuario";
  };

  const getRoleBadgeColor = (role: any) => {
    if (!role) return "secondary" as const;
    if (typeof role === "string") {
      if (role === "admin") return "destructive" as const;
      if (role === "student" || role === "alumno") return "default" as const;
      return "secondary" as const;
    }
    if (typeof role === "object") {
      if (role.admin) return "destructive" as const;
      if (role.student) return "default" as const;
      return "secondary" as const;
    }
    return "secondary" as const;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mi Perfil
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Información personal de la cuenta
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Card ocupando todo el ancho */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar y datos principales */}
            <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {getUserInitials()}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {user.nombre} {user.apellido}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg mt-1">
                  {user.email}
                </p>
                <Badge variant={getRoleBadgeColor(user.role)} className="mt-2">
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
            </div>

            {/* Campos de información */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  disabled
                  value={user.nombre || ""}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  disabled
                  value={user.apellido || ""}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DNI
                </label>
                <input
                  type="text"
                  disabled
                  value={user.dni || "No disponible"}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <input
                  type="text"
                  disabled
                  value={getRoleDisplayName(user.role)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado de la cuenta
                </label>
                <input
                  type="text"
                  disabled
                  value="Activa"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
