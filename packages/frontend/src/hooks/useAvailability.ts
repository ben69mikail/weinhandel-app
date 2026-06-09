import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Availability, AvailabilityWithUser } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useAvailability(month: string) {
  return useQuery<Availability[]>({
    queryKey: queryKeys.availability.mine(month),
    queryFn: () => api.get(`/availability?month=${month}`).then((r) => r.data),
  });
}

export function useAllAvailability(month: string) {
  const valid = !!month && /^\d{4}-\d{2}$/.test(month);
  return useQuery<AvailabilityWithUser[]>({
    queryKey: queryKeys.availability.all(month),
    queryFn: () => api.get(`/availability/all?month=${month}`).then((r) => r.data),
    enabled: valid,
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; type: string; startTime?: string; endTime?: string; note?: string }) =>
      api.post("/availability", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability"] }),
  });
}
