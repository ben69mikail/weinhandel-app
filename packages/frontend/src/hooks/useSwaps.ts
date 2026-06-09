import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SwapRequest } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useSwaps() {
  return useQuery<SwapRequest[]>({
    queryKey: queryKeys.swaps.all(),
    queryFn: () => api.get("/swaps").then((r) => r.data),
  });
}

export function useCreateSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fromShiftId: string; targetUserId?: string; toShiftId?: string; note?: string }) =>
      api.post("/swaps", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.swaps.all() }),
  });
}

export function useUpdateSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/swaps/${id}`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.swaps.all() }),
  });
}
