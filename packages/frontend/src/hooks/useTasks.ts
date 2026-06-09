import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Task } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useTasks(date?: string) {
  return useQuery<Task[]>({
    queryKey: queryKeys.tasks.byDate(date),
    queryFn: () => api.get(`/tasks${date ? `?date=${date}` : ""}`).then((r) => r.data),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; dueDate?: string; priority?: number; category?: string }) =>
      api.post("/tasks", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; dueDate?: string; priority?: number; category?: string }) =>
      api.put(`/tasks/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api.post(`/tasks/${id}/complete`, { note }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
