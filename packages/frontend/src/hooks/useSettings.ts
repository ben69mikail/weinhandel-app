import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppSettings } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useSettings() {
  return useQuery<AppSettings>({
    queryKey: queryKeys.settings.all(),
    queryFn: () => api.get("/settings").then((r) => r.data),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<AppSettings>) => api.put("/settings", d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings.all() }),
  });
}
