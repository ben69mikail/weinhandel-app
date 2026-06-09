import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "./queryKeys";

export function useHygieneStatus() {
  return useQuery<{ confirmed: boolean; version: string; confirmedAt: string | null }>({
    queryKey: queryKeys.hygiene.status(),
    queryFn: () => api.get("/hygiene/status").then((r) => r.data),
  });
}

export function useConfirmHygiene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/hygiene/confirm").then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hygiene"] }),
  });
}
