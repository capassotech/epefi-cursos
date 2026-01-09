import axios from "axios";
import { getAuth } from "firebase/auth";

// Configuración de axios
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class CoursesService {
  getAllCoursesPerUser(id: string) {
    return api.get(`/cursos/user/${id}`);
  }

  getCourseById(id: string) {
    return api.get(`/cursos/${id}`);
  }

  getMateriasByCourseId(id: string) {
    return api.get(`/materias/${id}`);
  }

  getModulosByMateriaId(id: string) {
    return api.get(`/modulos/${id}`);
  }

  getStudentModules(userId: string) {
    return api.get(`/usuarios/${userId}/modulos`);
  }

  markContentAsCompleted(userId: string, moduleId: string, contentIndex: number, contentType: 'video' | 'document', completed: boolean) {
    return api.post(`/usuarios/${userId}/progreso`, {
      moduleId,
      contentIndex,
      contentType,
      completed
    });
  }

  getStudentProgress(userId: string) {
    return api.get(`/usuarios/${userId}/progreso`);
  }
}

export default new CoursesService();
