
import axios from "axios";

// Configuración de axios
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://epefi-backend.onrender.com";

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

    // Métodos para administración (requieren autenticación)
    async getAllCourses(token: string) {
        return api.get(`/cursos`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async updateCourse(id: string, data: any, token: string) {
        return api.put(`/cursos/${id}`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    // Subir archivo PDF
    async uploadPDF(file: File, courseId: string, field: 'planDeEstudios' | 'fechasDeExamenes', token: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('field', field);

        return api.post(`/cursos/${courseId}/upload-pdf`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
    }
}

export default new CoursesService();
