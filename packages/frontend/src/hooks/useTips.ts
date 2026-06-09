import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TipCalculation } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useTipCalculations() {
  return useQuery<TipCalculation[]>({
    queryKey: queryKeys.tips.all(),
    queryFn: () => api.get("/tips").then((r) => r.data),
  });
}

export function useCalculateTip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { shiftDate?: string; totalTip: number; workers: { userId: string; hoursWorked: number }[] }) =>
      api.post("/tips/calculate", d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tips.all() }),
  });
}
