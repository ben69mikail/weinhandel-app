import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppEvent } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useEvents(from?: string, to?: string) {
  const q = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return useQuery<AppEvent[]>({
    queryKey: queryKeys.events.byRange(from, to),
    queryFn: () => api.get(`/events${q ? "?" + q : ""}`).then((r) => r.data),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<AppEvent>) => api.post("/events", d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }: Partial<AppEvent> & { id: string }) =>
      api.put(`/events/${id}`, d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}
