import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    if (!role) return "outline" as const;
    if (typeof role === "string") {
      if (role === "admin") return "destructive" as const;
      if (role === "student" || role === "alumno") return "outline" as const;
      return "outline" as const;
    }
    if (typeof role === "object") {
      if (role.admin) return "destructive" as const;
      if (role.student) return "outline" as const;
      return "outline" as const;
    }
    return "outline" as const;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header minimalista */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Mi Perfil
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm hidden sm:block">
            Información personal de la cuenta
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          size="sm"
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </Button>
      </div>

      {/* Card principal del perfil */}
      <Card className="border-gray-100 dark:border-gray-800">
        <CardContent className="p-4 sm:p-6">
          {/* Avatar y datos principales */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
              {getUserInitials()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                {user.nombre} {user.apellido}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-1">
                {user.email}
              </p>
              <Badge variant={getRoleBadgeColor(user.role)} className="mt-2">
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>
          </div>

          {/* Información personal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="w-4 h-4" />
              Información Personal
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-gray-100">
                    {user.nombre || "No disponible"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Apellido
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-gray-100">
                    {user.apellido || "No disponible"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-gray-100 break-all">
                    {user.email || "No disponible"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  DNI
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-gray-100">
                    {user.dni || "No disponible"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rol
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-gray-100">
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado de la cuenta
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-900 dark:text-gray-100">
                      Activa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de logout para mobile en la parte inferior */}
      <div className="sm:hidden">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
