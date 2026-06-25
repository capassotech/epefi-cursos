import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import CoursesService from "@/services/coursesService";
import type { Curso, Materia, Modulo } from "@/types/types";

export type StudentCourseContent = {
  curso: Curso;
  materias: Materia[];
  modulos: Modulo[];
  progreso: Record<string, Record<string, boolean>>;
  modulos_habilitados: Record<string, boolean>;
};

export function useStudentCourseContent(
  courseId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey:
      courseId && userId
        ? queryKeys.courseContent(courseId, userId)
        : ["courseContent"],
    queryFn: async (): Promise<StudentCourseContent> => {
      const response = await CoursesService.getStudentCourseContent(courseId!);
      return response.data;
    },
    enabled: Boolean(courseId && userId),
    staleTime: 10 * 60 * 1000,
  });
}
