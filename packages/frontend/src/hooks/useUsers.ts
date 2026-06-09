import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: queryKeys.users.all(),
    queryFn: () => api.get("/users").then((r) => r.data),
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: queryKeys.users.byId(id),
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User> & { password: string }) =>
      api.post("/users", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all() }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<User> & { id: string; password?: string }) =>
      api.put(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all() }),
  });
}

export function useGrantTempAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: string }) =>
      api.post(`/users/${id}/grant-admin`, { until }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all() }),
  });
}

export function useRevokeAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/revoke-admin`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all() }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all() }),
  });
}
