import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import CoursesService from "@/services/coursesService";
import type { Course } from "@/data/courses";

export type StudentHomeCourse = Course & {
  progresoPorcentaje?: number;
  progresoCompletados?: number;
  progresoTotal?: number;
};

export function useStudentHome(
  userId: string | undefined,
  activo: boolean | undefined
) {
  return useQuery({
    queryKey: userId ? queryKeys.studentHome(userId) : ["studentHome"],
    queryFn: async (): Promise<StudentHomeCourse[]> => {
      const response = await CoursesService.getStudentHome(userId!);
      return Array.isArray(response.data?.cursos) ? response.data.cursos : [];
    },
    enabled: Boolean(userId) && activo !== false,
    staleTime: 5 * 60 * 1000,
  });
}
