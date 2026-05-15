import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import authService from "../../services/authService";
import AuthFormView from "./AuthFormView";
import {
  getPasswordRequirements,
  getPasswordValidationErrors,
  validatePassword,
} from "@/lib/passwordValidation";

interface AuthFormProps {
  isLogin?: boolean;
}

const AuthFormController: React.FC<AuthFormProps> = ({ isLogin = false }) => {
  const navigate = useNavigate();
  const { login, register, googleRegister, googleLogin, updateProfile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [forceProfileCompletion, setForceProfileCompletion] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dni: "",
  });

  const validateForm = (
    googleAuth: boolean = false,
    requirePersonalData: boolean = false
  ) => {
    const newErrors: Record<string, string> = {};

    if (!googleAuth) {
      if (!formData.email) {
        newErrors.email = "El email es requerido";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "El formato del email es inválido";
      }

      if (!formData.password) {
        newErrors.password = "La contraseña es requerida";
      } else {
        const { valid, errors } = validatePassword(formData.password);
        if (!valid) {
          newErrors.password = errors.join(" · ");
        }
      }
    }

    if (!isLogin || requirePersonalData) {
      if (!googleAuth) {
        if (!formData.firstName.trim()) {
          newErrors.firstName = "El nombre es requerido";
        } else if (formData.firstName.trim().length < 2) {
          newErrors.firstName = "El nombre debe tener al menos 2 caracteres";
        }

        if (!formData.lastName.trim()) {
          newErrors.lastName = "El apellido es requerido";
        } else if (formData.lastName.trim().length < 2) {
          newErrors.lastName = "El apellido debe tener al menos 2 caracteres";
        }
      }

      if (!formData.dni) {
        newErrors.dni = "El DNI es requerido";
      } else if (!/^\d{7,8}$/.test(formData.dni)) {
        newErrors.dni = "El DNI debe tener entre 7 y 8 dígitos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLogin && !validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);

        const studentData = authService.getStudentDataFromStorage();
        const userName = studentData?.nombre || "Usuario";

        toast.success(`¡Bienvenido de vuelta, ${userName}!`, {
          description: "Has iniciado sesión exitosamente",
          duration: 4000,
        });

        // Mantener el loader visible durante el delay antes de navegar
        setTimeout(() => {
          navigate("/");
          // El loader se ocultará cuando el componente se desmonte al navegar
        }, 1000);
      } else {
        await register(formData);

        const studentData = authService.getStudentDataFromStorage();
        const userName = studentData?.nombre || "Usuario";

        toast.success(`¡Bienvenido a EPEFI, ${userName}!`, {
          description: "Tu cuenta ha sido creada exitosamente",
          duration: 4000,
        });

        // Mantener el loader visible durante el delay antes de navegar
        setTimeout(() => {
          navigate("/");
          // El loader se ocultará cuando el componente se desmonte al navegar
        }, 1000);
      }
    } catch (error: any) {
      setIsSubmitting(false);
      toast.error(error.error);
    }
  };

  const handleGoogleAuth = async () => {
    if (isLogin) {
      setIsSubmitting(true);
      try {
        const response = await googleLogin();

        if (response.requiresProfileCompletion) {
          const nombre = response.user?.nombre || "";
          const apellido = response.user?.apellido || "";
          const dni = response.user?.dni || "";

          setFormData((prev) => ({
            ...prev,
            firstName: nombre.toLowerCase() === "usuario" ? "" : nombre,
            lastName: apellido,
            dni,
          }));
          setForceProfileCompletion(true);
          setIsSubmitting(false);

          toast.info("Completa tus datos para continuar", {
            description:
              "Necesitamos nombre, apellido y DNI para terminar tu alta con Google.",
            duration: 5000,
          });
          return;
        }

        toast.success("¡Bienvenido de vuelta!", {
          description: "Has iniciado sesión exitosamente",
          duration: 4000,
        });

        // Mantener el loader visible durante el delay antes de navegar
        setTimeout(() => {
          navigate("/");
          // El loader se ocultará cuando el componente se desmonte al navegar
        }, 2000);
        return;
      } catch (error: unknown) {
        setIsSubmitting(false);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Error en el login con Google";
        toast.error(errorMessage);
        return;
      }
    }

    if (!validateForm(true)) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }

    setIsSubmitting(true);
    try {
      await googleRegister(
        formData.firstName,
        formData.lastName,
        formData.dni,
        true
      );

      toast.success("¡Bienvenido a INEE!", {
        description: "Tu cuenta ha sido creada exitosamente",
        duration: 4000,
      });

      // Mantener el loader visible durante el delay antes de navegar
      setTimeout(() => {
        navigate("/");
        // El loader se ocultará cuando el componente se desmonte al navegar
      }, 2000);
    } catch (error: unknown) {
      setIsSubmitting(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error en el registro con Google";
      toast.error(errorMessage);
    }
  };

  const handleCompleteGoogleProfile = async () => {
    if (!validateForm(true, true)) {
      toast.error("Por favor, completa nombre, apellido y DNI");
      return;
    }

    setIsSubmitting(true);
    try {
      const nombre = formData.firstName.trim();
      const apellido = formData.lastName.trim();
      const dni = formData.dni.trim();

      await updateProfile({ nombre, apellido, dni });
      authService.updateStudentDataInStorage({ nombre, apellido, dni });
      setForceProfileCompletion(false);

      toast.success("¡Perfil completado!", {
        description: "Ya puedes continuar con tu cuenta de Google.",
        duration: 4000,
      });

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error: any) {
      setIsSubmitting(false);
      toast.error(error?.message || error?.error || "No se pudo completar el perfil");
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (typeof value === "string" && field === "password") {
      setFormData((prev) => ({ ...prev, password: value }));
      if (!isLogin) {
        if (!value) {
          setErrors((prev) => ({ ...prev, password: "" }));
        } else {
          const missing = getPasswordValidationErrors(value);
          setErrors((prev) => ({
            ...prev,
            password: missing.length ? missing.join(" · ") : "",
          }));
        }
      } else if (errors.password) {
        setErrors((prev) => ({ ...prev, password: "" }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setErrors({});
    if (step !== 2) {
      setShowEmailForm(false);
    }
  };

  const handleEmailMethodSelect = () => {
    setShowEmailForm(true);
  };

  return (
    <AuthFormView
      isLogin={isLogin}
      forceProfileCompletion={forceProfileCompletion}
      currentStep={currentStep}
      showEmailForm={showEmailForm}
      onSubmit={handleSubmit}
      onGoogleAuth={handleGoogleAuth}
      onInputChange={handleInputChange}
      onStepChange={handleStepChange}
      onEmailMethodSelect={handleEmailMethodSelect}
      onCompleteGoogleProfile={handleCompleteGoogleProfile}
      errors={errors}
      formData={formData}
      isSubmitting={isSubmitting}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      passwordRequirements={getPasswordRequirements(
        (formData.password as string) || ""
      )}
    />
  );
};

export default AuthFormController;
