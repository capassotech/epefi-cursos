import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, LogOut, Lock, Save, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout, updateProfile, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingPasswordEmail, setIsSendingPasswordEmail] = useState(false);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    dni: user?.dni || "",
    email: user?.email || "",
  });

  // Actualizar formData cuando cambie el usuario
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        dni: user.dni || "",
        email: user.email || "",
      });
    }
  }, [user, isEditing]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile({
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        email: formData.email,
      });
      
      toast.success("Perfil actualizado", {
        description: "Tus datos se han actualizado correctamente.",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      toast.error("Error al actualizar", {
        description: error.message || "No se pudo actualizar el perfil. Intenta nuevamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        dni: user.dni || "",
        email: user.email || "",
      });
    }
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!user?.email) {
      toast.error("Error", {
        description: "No se pudo obtener tu email.",
      });
      return;
    }

    setIsSendingPasswordEmail(true);
    try {
      await forgotPassword(user.email);
      toast.success("Email enviado", {
        description: "Revisa tu bandeja de entrada para las instrucciones de cambio de contraseña.",
      });
    } catch (error: any) {
      console.error("Error al enviar email:", error);
      toast.error("Error al enviar email", {
        description: error.message || "No se pudo enviar el email. Intenta nuevamente.",
      });
    } finally {
      setIsSendingPasswordEmail(false);
    }
  };

  const getUserInitials = () => {
    if (user?.nombre && user?.apellido) {
      return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
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
            Mi perfil
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm hidden sm:block">
            Información personal de la cuenta
          </p>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            size="sm"
            className="gap-2"
          >
            <span>Editar</span>
          </Button>
        )}
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
                {isEditing ? (
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    className="w-full"
                    disabled={isSaving}
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-gray-100">
                      {formData.nombre || "No disponible"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Apellido
                </label>
                {isEditing ? (
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => handleInputChange("apellido", e.target.value)}
                    className="w-full"
                    disabled={isSaving}
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-gray-100">
                      {formData.apellido || "No disponible"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  DNI
                </label>
                {isEditing ? (
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleInputChange("dni", e.target.value)}
                    className="w-full"
                    disabled={isSaving}
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-gray-100">
                      {formData.dni || "No disponible"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full"
                    disabled={isSaving}
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-gray-100 break-all">
                      {formData.email || "No disponible"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Botón para cambiar contraseña */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleChangePassword}
                disabled={isSendingPasswordEmail}
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                {isSendingPasswordEmail ? "Enviando..." : "Cambiar contraseña"}
              </Button>
            </div>

            {/* Botones de acción cuando está editando */}
            {isEditing && (
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            )}
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
