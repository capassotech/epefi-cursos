
import axios from "axios";

// Configuración de axios
const API_BASE_URL = "http://localhost:3000";

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
}

export default new CoursesService();
