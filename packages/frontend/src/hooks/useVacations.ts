import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VacationRequest } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useVacations() {
  return useQuery<VacationRequest[]>({
    queryKey: queryKeys.vacations.all(),
    queryFn: () => api.get("/vacations").then((r) => r.data),
  });
}

export function useCreateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { startDate: string; endDate: string; type?: string; note?: string }) =>
      api.post("/vacations", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vacations.all() }),
  });
}

export function useUpdateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; adminNote?: string }) =>
      api.put(`/vacations/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vacations.all() }),
  });
}

export function useDeleteVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/vacations/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vacations.all() }),
  });
}
