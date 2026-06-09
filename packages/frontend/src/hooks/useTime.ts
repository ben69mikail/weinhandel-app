import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TimeEntry } from "@weinhandel/types";
import { queryKeys } from "./queryKeys";

export function useCurrentTimeEntry() {
  return useQuery<TimeEntry | null>({
    queryKey: queryKeys.time.current(),
    queryFn: () => api.get("/time/current").then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId?: string) => api.post("/time/clock-in", { shiftId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time"] }),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/time/clock-out").then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time"] }),
  });
}

export function useBreakStart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/time/break-start").then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time"] }),
  });
}

export function useBreakEnd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/time/break-end").then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time"] }),
  });
}

export function useTimeEntries(params: { userId?: string; month?: string }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery<TimeEntry[]>({
    queryKey: queryKeys.time.entries(params),
    queryFn: () => api.get(`/time/entries?${q}`).then((r) => r.data),
  });
}

export function useActiveEntries() {
  return useQuery<(TimeEntry & { user: { id: string; firstName: string; lastName: string; avatarUrl?: string } })[]>({
    queryKey: queryKeys.time.active(),
    queryFn: () => api.get("/time/active").then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useCorrectTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; clockIn?: string; clockOut?: string; breakMinutes?: number; note?: string }) =>
      api.put(`/reporting/time/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time"] });
      qc.invalidateQueries({ queryKey: ["reporting"] });
    },
  });
}

export function useMonthlyReport(month: string) {
  return useQuery<import("@weinhandel/types").MonthlyReport[]>({
    queryKey: queryKeys.reporting.monthly(month),
    queryFn: () => api.get(`/reporting/monthly?month=${month}`).then((r) => r.data),
    enabled: !!month,
  });
}
