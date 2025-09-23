import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../../config/firebase-client";
import axios from "axios";

// Configuración de axios
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  dni: string;
}

class AuthService {
  // LOGIN - Usando Firebase SDK (NO REST API)
  async login(data: LoginData) {
    try {
      console.log("Intentando login con Firebase SDK:", data.email);

      // 1. Autenticar con Firebase directamente
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = userCredential.user;

      console.log("Login exitoso con Firebase:", firebaseUser.uid);

      // 2. Obtener token para llamadas al backend
      const token = await firebaseUser.getIdToken();

      // 3. Verificar/obtener datos adicionales del backend
      try {
        const response = await api.post(
          "/api/auth/login",
          {
            email: data.email,
            password: data.password, // Solo para verificación en backend si es necesario
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userData = response.data.user;
        console.log("Datos del usuario desde backend:", userData);

        // 4. Guardar datos en localStorage
        this.saveStudentDataToStorage({
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          nombre: userData.nombre,
          apellido: userData.apellido,
          dni: userData.dni,
          role: userData.role,
          loginTime: new Date().toISOString(),
          fechaRegistro: userData.fechaRegistro || new Date().toISOString(),
        });

        return {
          success: true,
          user: userData,
          firebaseUser: firebaseUser,
        };
      } catch (backendError: any) {
        console.warn(
          "Backend verification failed, but Firebase login successful:",
          backendError
        );

        // Si falla el backend pero Firebase funciona, crear perfil básico
        const basicUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          nombre: firebaseUser.displayName?.split(" ")[0] || "",
          apellido:
            firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
          role: { admin: false, student: true },
          loginTime: new Date().toISOString(),
          fechaRegistro: new Date().toISOString(),
        };

        this.saveStudentDataToStorage(basicUserData);

        return {
          success: true,
          user: basicUserData,
          firebaseUser: firebaseUser,
        };
      }
    } catch (error: any) {
      console.error("Error en login:", error);
      throw {
        error:
          this.getFirebaseErrorMessage(error.code) ||
          "Error en el inicio de sesión",
        code: error.code,
      };
    }
  }

  // REGISTER - Usando Firebase SDK
  async register(data: RegisterData) {
    try {
      console.log("Registrando usuario:", data.email);

      // 1. Crear usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = userCredential.user;

      // 2. Registrar en el backend
      const token = await firebaseUser.getIdToken();

      const response = await api.post(
        "/api/auth/register",
        {
          email: data.email,
          password: data.password,
          nombre: data.nombre,
          apellido: data.apellido,
          dni: data.dni,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userData = response.data.user;

      // 3. Guardar datos
      this.saveStudentDataToStorage({
        uid: firebaseUser.uid,
        email: firebaseUser.email || data.email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        dni: userData.dni,
        role: userData.role,
        loginTime: new Date().toISOString(),
        fechaRegistro: new Date().toISOString(),
      });

      return {
        success: true,
        user: userData,
        firebaseUser: firebaseUser,
      };
    } catch (error: any) {
      console.error("Error en registro:", error);
      throw {
        error:
          this.getFirebaseErrorMessage(error.code) || "Error en el registro",
        code: error.code,
      };
    }
  }

  // GOOGLE LOGIN
  async googleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Crear perfil básico para Google login
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        nombre: firebaseUser.displayName?.split(" ")[0] || "",
        apellido: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
        role: { admin: false, student: true },
        loginTime: new Date().toISOString(),
        fechaRegistro: new Date().toISOString(),
      };

      this.saveStudentDataToStorage(userData);

      return {
        success: true,
        user: userData,
        firebaseUser: firebaseUser,
      };
    } catch (error: any) {
      console.error("Error en Google login:", error);
      throw {
        error:
          this.getFirebaseErrorMessage(error.code) ||
          "Error en el login con Google",
        code: error.code,
      };
    }
  }

  // GOOGLE REGISTER
  async googleRegister(
    firstName: string,
    lastName: string,
    dni: string,
    acceptTerms: boolean
  ) {
    return this.googleLogin(); // Por ahora es igual que el login
  }

  // LOGOUT
  async logout() {
    try {
      await signOut(auth);
      this.clearStudentDataFromStorage();
      return { success: true };
    } catch (error: any) {
      console.error("Error en logout:", error);
      throw {
        error: "Error al cerrar sesión",
        code: error.code,
      };
    }
  }

  // FORGOT PASSWORD
  async forgotPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      throw {
        error:
          this.getFirebaseErrorMessage(error.code) ||
          "Error al enviar email de recuperación",
        code: error.code,
      };
    }
  }

  // CHANGE PASSWORD
  async changePassword(oobCode: string, newPassword: string) {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      return { success: true };
    } catch (error: any) {
      throw {
        error:
          this.getFirebaseErrorMessage(error.code) ||
          "Error al cambiar contraseña",
        code: error.code,
      };
    }
  }

  // UTILS
  saveStudentDataToStorage(data: any) {
    try {
      localStorage.setItem("studentData", JSON.stringify(data));
      console.log("Datos guardados en localStorage:", data);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  getStudentDataFromStorage() {
    try {
      const data = localStorage.getItem("studentData");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return null;
    }
  }

  updateStudentDataInStorage(updates: any) {
    try {
      const currentData = this.getStudentDataFromStorage() || {};
      const updatedData = { ...currentData, ...updates };
      this.saveStudentDataToStorage(updatedData);
    } catch (error) {
      console.error("Error updating localStorage:", error);
    }
  }

  clearStudentDataFromStorage() {
    try {
      localStorage.removeItem("studentData");
      console.log("localStorage cleared");
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }

  private getFirebaseErrorMessage(errorCode: string): string {
    const errors: { [key: string]: string } = {
      "auth/user-not-found": "Usuario no encontrado",
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/email-already-in-use": "El email ya está registrado",
      "auth/weak-password": "La contraseña es muy débil",
      "auth/invalid-email": "Email inválido",
      "auth/user-disabled": "Usuario deshabilitado",
      "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
      "auth/network-request-failed": "Error de conexión",
      "auth/popup-closed-by-user": "Ventana cerrada por el usuario",
      "auth/cancelled-popup-request": "Login cancelado",
    };

    return errors[errorCode] || "Error desconocido";
  }
}

export default new AuthService();
