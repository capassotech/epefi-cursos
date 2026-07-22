import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  studentHome: (userId: string) => ["studentHome", userId] as const,
  courseContent: (courseId: string, userId: string) =>
    ["courseContent", courseId, userId] as const,
};
