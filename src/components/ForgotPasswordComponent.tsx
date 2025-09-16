import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Lock,
  EyeOff,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordRequirements } from "./PasswordRequirements";

export default function ForgotPasswordComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const { forgotPassword, changePassword } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get("oobCode");

  const getPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  };

  const passwordRequirements = getPasswordRequirements(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validamos si esta en la ruta de retorno de firebase
      if (oobCode) {
        await changePassword(oobCode, password);

        toast.success("¡Contraseña cambiada!", {
          description: "Tu contraseña ha sido cambiada correctamente.",
        });

        navigate("/login");
      } else {
        await forgotPassword(email);

        setEmailSent(true);
        toast.success("¡Email enviado!", {
          description:
            "Revisa tu bandeja de entrada para las instrucciones de recuperación.",
        });
      }
    } catch (error: any) {
      const userExists = error.exists;

      toast.error("Error al enviar el email", {
        description: userExists
          ? "Hubo un problema técnico. Intenta nuevamente en unos minutos."
          : "El email no está registrado en nuestro sistema.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="flex items-center space-x-2">
                <div className="h-10 rounded-lg flex items-center justify-center">
                  <img
                    src="/logo-blanco.png"
                    alt="INEE Logo"
                    className="h-20"
                  />
                </div>
              </div>
            </Link>
          </div>

          <Card className="shadow-2xl border-0 card-gradient">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Email Enviado
              </CardTitle>
              <p className="text-muted-foreground">
                Te hemos enviado las instrucciones de recuperación a{" "}
                <strong>{email}</strong>
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Revisa tu bandeja de entrada</p>
                  <p>• No olvides revisar la carpeta de spam</p>
                  <p>• El enlace expira en 24 horas</p>
                </div>

                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Enviar a otro email
                </Button>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
                >
                  Volver al Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero dark:bg-gradient-hero-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="flex items-center space-x-2">
              <div className="h-10 rounded-lg flex items-center justify-center">
                <img src="/logo-blanco.png" alt="INEE Logo" className="h-20" />
              </div>
            </div>
          </Link>
        </div>

        <Card className="shadow-2xl border-0 card-gradient">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              {oobCode ? "Cambiar Contraseña" : "Recuperar Contraseña"}
            </CardTitle>
            <p className="text-center text-muted-foreground">
              {oobCode
                ? "Ingresa tu nueva contraseña"
                : "Ingresa tu email para recibir las instrucciones de recuperación"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="form-label">
                  {oobCode ? "Nueva Contraseña" : "Email"}
                </Label>
                <div className="relative">
                  {!oobCode ? (
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    id={oobCode ? "password" : "email"}
                    type={
                      oobCode ? (showPassword ? "text" : "password") : "email"
                    }
                    placeholder={oobCode ? "Nueva Contraseña" : "tu@email.com"}
                    className="pl-10 form-input"
                    value={oobCode ? password : email}
                    onChange={(e) =>
                      oobCode
                        ? setPassword(e.target.value)
                        : setEmail(e.target.value)
                    }
                    disabled={isSubmitting}
                    autoComplete={oobCode ? "new-password" : "email"}
                    autoFocus
                  />
                  {oobCode && (
                    <button
                      type="button"
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                {(password as string)?.length > 0 && (
                  <PasswordRequirements
                    passwordRequirements={passwordRequirements}
                  />
                )}
              </div>

              <Button
                type="submit"
                className="w-full btn-gradient dark:btn-gradient-dark hover:opacity-90 transition-all duration-200 font-medium"
                disabled={
                  isSubmitting || (oobCode ? !password.trim() : !email.trim())
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {oobCode
                      ? "Cambiando Contraseña..."
                      : "Enviando Instrucciones..."}
                  </>
                ) : oobCode ? (
                  "Cambiar Contraseña"
                ) : (
                  "Enviar Instrucciones"
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
