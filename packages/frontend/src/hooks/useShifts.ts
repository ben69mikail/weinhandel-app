import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore as useAuthStore_ } from "@/store/auth";
import { api } from "@/lib/api";
import type { Shift } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useShifts(params?: { week?: string; month?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery<Shift[]>({
    queryKey: queryKeys.shifts.all(params),
    queryFn: () => api.get(`/shifts${query ? "?" + query : ""}`).then((r) => r.data),
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Shift> & { date: string; title: string; startTime: string; endTime: string }) =>
      api.post("/shifts", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Shift> & { id: string }) =>
      api.put(`/shifts/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/shifts/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useAssignShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, userId, force }: { shiftId: string; userId: string; force?: boolean }) =>
      api.post(`/shifts/${shiftId}/assign`, { userId, ...(force ? { force: true } : {}) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useMyShifts(month: string) {
  const user = useAuthStore_((s: { user: { id: string } | null }) => s.user);
  return useQuery<Shift[]>({
    queryKey: queryKeys.shifts.my(month),
    queryFn: () => api.get(`/shifts?month=${month}&userId=${user?.id}`).then((r) => r.data),
    enabled: !!user,
  });
}

export function useOpenShifts() {
  return useQuery<Shift[]>({
    queryKey: queryKeys.shifts.open(),
    queryFn: () => api.get("/shifts/open").then((r) => r.data),
  });
}

export function useApplyShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: string) => api.post(`/shifts/${shiftId}/apply`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

export function useUpdateAssignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, assignmentId, status }: { shiftId: string; assignmentId: string; status: "APPROVED" | "REJECTED" }) =>
      api.put(`/shifts/${shiftId}/assignments/${assignmentId}`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}
