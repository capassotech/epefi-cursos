import axios from "axios";

// Configuración de axios
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

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
}

export default new CoursesService();
