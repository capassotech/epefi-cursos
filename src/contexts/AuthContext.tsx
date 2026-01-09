import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../config/firebase-client";
import authService from "../services/authService";

interface UserRole {
  admin: boolean;
  student: boolean;
}

interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  dni?: string;
  role: UserRole;
  fechaRegistro?: string;
  activo?: boolean;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dni: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: RegisterUserData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  googleRegister: (
    firstName: string,
    lastName: string,
    dni: string,
    acceptTerms: boolean
  ) => Promise<AuthResponse>;
  googleLogin: () => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<void>;
  changePassword: (oobCode: string, password: string) => Promise<void>;
  updateProfile: (data: {
    nombre?: string;
    apellido?: string;
    dni?: string;
    email?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com";

  // isAuthenticated SOLO depende de firebaseUser
  const isAuthenticated = !!firebaseUser;

  // Función para obtener perfil del backend sin bloquear la UI
  const fetchUserProfileInBackground = useCallback(
    async (firebaseUser: User) => {
      try {
        console.log("🌐 Fetching profile from backend...");
        const token = await firebaseUser.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log("✅ Backend profile fetched:", profileData);

          const updatedProfile: UserProfile = {
            uid: profileData.uid || firebaseUser.uid,
            email: profileData.email || firebaseUser.email || "",
            nombre: profileData.nombre || "Usuario",
            apellido: profileData.apellido || "",
            dni: profileData.dni,
            role: profileData.role || { admin: false, student: true },
            fechaRegistro:
              profileData.fechaRegistro || profileData.fechaCreacion,
            activo: profileData.activo !== undefined ? profileData.activo : true,
          };

          setUser(updatedProfile);
          authService.updateStudentDataInStorage(updatedProfile);
        } else {
          console.warn("Backend profile fetch failed:", response.status);
        }
      } catch (error) {
        console.warn("Backend profile fetch error:", error);
        // No hacer nada - seguir con el perfil básico
      }
    },
    [API_BASE_URL]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔥 Auth state changed:",
        firebaseUser ? "logged in" : "logged out"
      );

      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Intentar obtener datos del localStorage primero
        try {
          const storedData = authService.getStudentDataFromStorage();
          console.log("📦 Stored data:", storedData);

          if (storedData && storedData.uid === firebaseUser.uid) {
            console.log("✅ Using stored data");
            setUser(storedData as UserProfile);

            // Siempre buscar datos del backend para actualizar el estado activo
            // especialmente importante si el usuario fue deshabilitado
            console.log("🔄 Fetching latest profile from backend to check activo status...");
            fetchUserProfileInBackground(firebaseUser);
          } else {
            console.log("📝 Creating basic profile from Firebase user");
            // Crear perfil básico con datos de Firebase
            const basicProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              nombre: firebaseUser.displayName?.split(" ")[0] || "Usuario",
              apellido:
                firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
              role: { admin: false, student: true },
              fechaRegistro: new Date().toISOString(),
            };
            setUser(basicProfile);

            // Intentar obtener datos del backend en segundo plano (sin bloquear)
            fetchUserProfileInBackground(firebaseUser);
          }
        } catch (error) {
          console.error("Error with stored data:", error);
          // Crear perfil mínimo si hay error
          const minimalProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            nombre: "Usuario",
            apellido: "",
            role: { admin: false, student: true },
            fechaRegistro: new Date().toISOString(),
          };
          setUser(minimalProfile);
        }
      } else {
        console.log("🚪 User logged out");
        setUser(null);
      }

      // ✅ CRÍTICO: Siempre establecer isLoading en false al final
      setIsLoading(false);
      console.log("✅ Auth loading complete");
    });

    return () => unsubscribe();
  }, [fetchUserProfileInBackground]);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    // ✅ NO establecer isLoading aquí - lo maneja onAuthStateChanged
    const response = await authService.login({ email, password });
    return response;
  };

  const register = async (
    userData: RegisterUserData
  ): Promise<AuthResponse> => {
    // ✅ NO establecer isLoading aquí - lo maneja onAuthStateChanged
    const response = await authService.register({
      email: userData.email,
      password: userData.password,
      nombre: userData.firstName,
      apellido: userData.lastName,
      dni: userData.dni,
    });
    return response;
  };

  const googleRegister = async (
    firstName: string,
    lastName: string,
    dni: string,
    acceptTerms: boolean
  ): Promise<AuthResponse> => {
    // ✅ NO establecer isLoading aquí - lo maneja onAuthStateChanged
    const response = await authService.googleRegister(
      firstName,
      lastName,
      dni,
      acceptTerms
    );
    return response;
  };

  const googleLogin = async (): Promise<AuthResponse> => {
    // ✅ NO establecer isLoading aquí - lo maneja onAuthStateChanged
    const response = await authService.googleLogin();
    return response;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    await authService.forgotPassword(email);
  };

  const changePassword = async (
    oobCode: string,
    password: string
  ): Promise<void> => {
    await authService.changePassword(oobCode, password);
  };

  const updateProfile = async (data: {
    nombre?: string;
    apellido?: string;
    dni?: string;
    email?: string;
  }): Promise<void> => {
    if (!firebaseUser) {
      throw new Error("Usuario no autenticado");
    }

    try {
      const token = await firebaseUser.getIdToken();

      // Intentar actualizar en el backend
      const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Si el endpoint no existe (404), solo actualizar el estado local
        if (response.status === 404) {
          // Actualizar el estado local del usuario directamente
          if (user) {
            const updatedProfile: UserProfile = {
              ...user,
              nombre: data.nombre !== undefined ? data.nombre : user.nombre,
              apellido:
                data.apellido !== undefined ? data.apellido : user.apellido,
              dni: data.dni !== undefined ? data.dni : user.dni,
              email: data.email !== undefined ? data.email : user.email,
            };
            setUser(updatedProfile);
            authService.updateStudentDataInStorage(updatedProfile);
          }

          // Nota: El email y displayName se actualizan en el backend
          // Solo actualizamos el estado local aquí cuando el endpoint no existe

          return; // Salir exitosamente después de actualizar localmente
        }

        // Para otros errores, intentar obtener más información
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          `Error al actualizar el perfil (${response.status})`;
        throw new Error(errorMessage);
      }

      // Si la respuesta fue exitosa, usar los datos del servidor
      const responseData = await response.json();

      // El backend devuelve { message: '...', user: { ... } }
      const updatedUserData = responseData.user || responseData;

      // Actualizar el estado local del usuario
      if (user) {
        const updatedProfile: UserProfile = {
          ...user,
          nombre:
            updatedUserData.nombre !== undefined
              ? updatedUserData.nombre
              : user.nombre,
          apellido:
            updatedUserData.apellido !== undefined
              ? updatedUserData.apellido
              : user.apellido,
          dni:
            updatedUserData.dni !== undefined ? updatedUserData.dni : user.dni,
          email:
            updatedUserData.email !== undefined
              ? updatedUserData.email
              : user.email,
        };
        setUser(updatedProfile);
        authService.updateStudentDataInStorage(updatedProfile);
      }

      // El backend ya actualiza el email y displayName en Firebase Auth
      // No necesitamos actualizar nada más en el cliente
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    googleRegister,
    googleLogin,
    forgotPassword,
    changePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
