import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AppNotification } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useNotifications() {
  return useQuery<AppNotification[]>({
    queryKey: queryKeys.notifications.all(),
    queryFn: () => api.get("/notifications").then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put("/notifications/read-all").then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
  });
}
