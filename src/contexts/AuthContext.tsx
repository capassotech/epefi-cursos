import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../config/firebase-client";
import authService from "../services/authService";

interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  dni?: string;
  role: any;
  fechaRegistro?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  googleRegister: (
    firstName: string,
    lastName: string,
    dni: string,
    acceptTerms: boolean
  ) => Promise<any>;
  googleLogin: () => Promise<any>;
  forgotPassword: (email: string) => Promise<void>;
  changePassword: (oobCode: string, password: string) => Promise<void>;
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

  // isAuthenticated SOLO depende de firebaseUser
  const isAuthenticated = !!firebaseUser;

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
  }, []);

  // Función para obtener perfil del backend sin bloquear la UI
  const fetchUserProfileInBackground = async (firebaseUser: User) => {
    try {
      console.log("🌐 Fetching profile from backend...");
      const token = await firebaseUser.getIdToken();

      const response = await fetch(
        "https://epefi-backend.onrender.com/api/users/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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
          fechaRegistro: profileData.fechaRegistro || profileData.fechaCreacion,
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
  };

  const login = async (email: string, password: string) => {
    try {
      // ✅ NO establecer isLoading aquí - lo maneja onAuthStateChanged
      const response = await authService.login({ email, password });
      return response;
    } catch (error) {
      // ✅ NO modificar isLoading aquí tampoco
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      // ✅ NO establecer isLoading aquí - lo maneja onAuthStateChanged
      const response = await authService.register({
        email: userData.email,
        password: userData.password,
        nombre: userData.firstName,
        apellido: userData.lastName,
        dni: userData.dni,
      });
      return response;
    } catch (error) {
      // ✅ NO modificar isLoading aquí tampoco
      throw error;
    }
  };

  const googleRegister = async (
    firstName: string,
    lastName: string,
    dni: string,
    acceptTerms: boolean
  ) => {
    try {
      // ✅ NO establecer isLoading aquí - lo maneja onAuthStateChanged
      const response = await authService.googleRegister(
        firstName,
        lastName,
        dni,
        acceptTerms
      );
      return response;
    } catch (error) {
      // ✅ NO modificar isLoading aquí tampoco
      throw error;
    }
  };

  const googleLogin = async () => {
    try {
      // ✅ NO establecer isLoading aquí - lo maneja onAuthStateChanged
      const response = await authService.googleLogin();
      return response;
    } catch (error) {
      // ✅ NO modificar isLoading aquí tampoco
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      // Los estados se limpiarán automáticamente por onAuthStateChanged
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const forgotPassword = async (email: string) => {
    await authService.forgotPassword(email);
  };

  const changePassword = async (oobCode: string, password: string) => {
    await authService.changePassword(oobCode, password);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
