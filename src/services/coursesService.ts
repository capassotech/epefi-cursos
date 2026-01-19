import axios from "axios";
import { getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

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
  getAllCourses(token?: string) {
    // El interceptor de axios ya agrega el token automáticamente
    // Pero si se pasa un token explícito, usarlo
    const config = token ? {
      headers: {
        Authorization: `Bearer ${token}`
      }
    } : undefined;
    return api.get(`/cursos`, config);
  }

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

  async uploadPDF(file: File, courseId: string, type: "planDeEstudios" | "fechasDeExamenes", token: string) {
    // Validar tipo de archivo
    if (file.type !== "application/pdf") {
      throw new Error("El archivo debe ser un PDF");
    }

    // Validar tamaño (10 MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("El archivo PDF no puede exceder 10 MB");
    }

    // Obtener el curso para saber su título
    const courseResponse = await this.getCourseById(courseId);
    const course = courseResponse.data;
    const courseTitle = course?.titulo || "curso";

    // Crear nombre de archivo único
    const timestamp = Date.now();
    const filename = type === "planDeEstudios" 
      ? `plan-de-estudios-${timestamp}.pdf`
      : `fechas-de-examenes-${timestamp}.pdf`;
    
    // Crear ruta en Storage
    const directory = `Documentos/Cursos/${courseTitle.replace(/\s+/g, "-")}`;
    const objectPath = `${directory}/${filename}`;

    // Subir a Firebase Storage
    const storageRef = ref(storage, objectPath);
    await uploadBytes(storageRef, file, { contentType: "application/pdf" });
    const url = await getDownloadURL(storageRef);

    // Actualizar el curso en el backend
    const now = new Date().toISOString();
    const updateData: any = {};
    
    if (type === "planDeEstudios") {
      updateData.planDeEstudiosUrl = url;
      updateData.planDeEstudiosFechaActualizacion = now;
    } else {
      updateData.fechasDeExamenesUrl = url;
      updateData.fechasDeExamenesFechaActualizacion = now;
    }

    return api.put(`/cursos/${courseId}`, updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export default new CoursesService();
