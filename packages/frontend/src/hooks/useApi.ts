import { useAuthStore as useAuthStore_ } from "@/store/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface User {
  id: string; email: string; firstName: string; lastName: string;
  phone?: string; address?: string; birthday?: string;
  role: "ADMIN" | "EMPLOYEE"; employeeType: "PARTTIME" | "MINIJOB";
  monthlyHours?: number; skills: string[]; avatarUrl?: string;
  personnelNumber?: string; isActive: boolean; createdAt: string;
  tempAdminUntil?: string | null;
}

export interface Shift {
  id: string; title: string; date: string; startTime: string; endTime: string;
  location: string; type: string; area: string; maxWorkers: number; minWorkers: number;
  notes?: string; isPublished: boolean; isOpenShift: boolean; requiredSkills: string[];
  color: string; createdAt: string;
  assignments: Array<{ id: string; userId: string; status: string; user: { id: string; firstName: string; lastName: string; avatarUrl?: string } }>;
}

// Users
export function useUsers() {
  return useQuery<User[]>({ queryKey: ["users"], queryFn: () => api.get("/users").then((r) => r.data) });
}

export function useUser(id: string) {
  return useQuery<User>({ queryKey: ["users", id], queryFn: () => api.get(`/users/${id}`).then((r) => r.data), enabled: !!id });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User> & { password: string }) => api.post("/users", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<User> & { id: string; password?: string }) => api.put(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useGrantTempAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: string }) => api.post(`/users/${id}/grant-admin`, { until }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
export function useRevokeAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/revoke-admin`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// Shifts
export function useShifts(params?: { week?: string; month?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery<Shift[]>({
    queryKey: ["shifts", params],
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
    mutationFn: ({ id, ...data }: Partial<Shift> & { id: string }) => api.put(`/shifts/${id}`, data).then((r) => r.data),
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
    mutationFn: ({ shiftId, userId }: { shiftId: string; userId: string }) =>
      api.post(`/shifts/${shiftId}/assign`, { userId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });
}

// --- Time Tracking ---
export interface TimeEntry {
  id: string; userId: string; shiftId?: string;
  clockIn: string; clockOut?: string;
  breakStart?: string; breakEnd?: string;
  breakMinutes: number; totalMinutes?: number; netMinutes?: number;
  autoBreak?: boolean; note?: string; createdAt: string;
}

export function useCurrentTimeEntry() {
  return useQuery<TimeEntry | null>({
    queryKey: ["time", "current"],
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

// --- Availability ---
export interface Availability {
  id: string; userId: string; date: string;
  type: "AVAILABLE" | "UNAVAILABLE" | "PREFERRED" | "PARTIAL";
  startTime?: string; endTime?: string; note?: string;
}

export function useAvailability(month: string) {
  return useQuery<Availability[]>({
    queryKey: ["availability", month],
    queryFn: () => api.get(`/availability?month=${month}`).then((r) => r.data),
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

export function useMyShifts(month: string) {
  const user = useAuthStore_((s: { user: { id: string } | null }) => s.user);
  return useQuery<Shift[]>({
    queryKey: ["shifts", "my", month],
    queryFn: () => api.get(`/shifts?month=${month}&userId=${user?.id}`).then((r) => r.data),
    enabled: !!user,
  });
}

export function useOpenShifts() {
  return useQuery<Shift[]>({
    queryKey: ["shifts", "open"],
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

export interface AvailabilityWithUser extends Availability {
  user: { id: string; firstName: string; lastName: string };
}
export function useAllAvailability(month: string) {
  return useQuery<AvailabilityWithUser[]>({
    queryKey: ["availability", "all", month],
    queryFn: () => api.get(`/availability/all?month=${month}`).then((r) => r.data),
    enabled: !!month,
  });
}

// --- Reporting ---
export interface MonthlyReport {
  user: { id: string; firstName: string; lastName: string; employeeType: string; monthlyHours?: number; personnelNumber?: string };
  entries: TimeEntry[];
  netMinutes: number; grossMinutes: number; breakMinutes: number;
  sollMinutes: number; diff: number; days: number;
}

export function useMonthlyReport(month: string) {
  return useQuery<MonthlyReport[]>({
    queryKey: ["reporting", "monthly", month],
    queryFn: () => api.get(`/reporting/monthly?month=${month}`).then((r) => r.data),
    enabled: !!month,
  });
}

export function useTimeEntries(params: { userId?: string; month?: string }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery<TimeEntry[]>({
    queryKey: ["time", "entries", params],
    queryFn: () => api.get(`/time/entries?${q}`).then((r) => r.data),
  });
}

export function useActiveEntries() {
  return useQuery<(TimeEntry & { user: { id: string; firstName: string; lastName: string; avatarUrl?: string } })[]>({
    queryKey: ["time", "active"],
    queryFn: () => api.get("/time/active").then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useCorrectTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; clockIn?: string; clockOut?: string; breakMinutes?: number; note?: string }) =>
      api.put(`/reporting/time/${id}`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["time"] }); qc.invalidateQueries({ queryKey: ["reporting"] }); },
  });
}

// --- Vacations ---
export interface VacationRequest {
  id: string; userId: string; startDate: string; endDate: string;
  type: "VACATION" | "SICK" | "SPECIAL"; status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string; adminNote?: string; createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}
export function useVacations() {
  return useQuery<VacationRequest[]>({ queryKey: ["vacations"], queryFn: () => api.get("/vacations").then((r) => r.data) });
}
export function useCreateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { startDate: string; endDate: string; type?: string; note?: string }) => api.post("/vacations", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vacations"] }),
  });
}
export function useUpdateVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; adminNote?: string }) => api.put(`/vacations/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vacations"] }),
  });
}
export function useDeleteVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/vacations/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vacations"] }),
  });
}

// --- Swaps ---
export interface SwapRequest {
  id: string; requesterId: string; targetUserId?: string; fromShiftId: string; toShiftId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED"; note?: string; createdAt: string;
  requester: { id: string; firstName: string; lastName: string };
  targetUser?: { id: string; firstName: string; lastName: string };
  fromShift: { id: string; startTime: string; endTime: string; title: string };
}
export function useSwaps() {
  return useQuery<SwapRequest[]>({ queryKey: ["swaps"], queryFn: () => api.get("/swaps").then((r) => r.data) });
}
export function useCreateSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fromShiftId: string; targetUserId?: string; toShiftId?: string; note?: string }) => api.post("/swaps", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["swaps"] }),
  });
}
export function useUpdateSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/swaps/${id}`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["swaps"] }),
  });
}

// --- Tasks ---
export interface Task {
  id: string; title: string; description?: string; category: string;
  priority: number; dueDate?: string; isRecurring: boolean; createdAt: string;
  completions: { id: string; userId: string; status: string; note?: string; completedAt: string; user: { id: string; firstName: string; lastName: string } }[];
}
export function useTasks(date?: string) {
  return useQuery<Task[]>({
    queryKey: ["tasks", date],
    queryFn: () => api.get(`/tasks${date ? `?date=${date}` : ""}`).then((r) => r.data),
  });
}
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; dueDate?: string; priority?: number; category?: string }) => api.post("/tasks", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; dueDate?: string; priority?: number; category?: string }) => api.put(`/tasks/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => api.post(`/tasks/${id}/complete`, { note }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
// --- Documents ---
export interface Document {
  id: string; title: string; category: string; content?: string;
  fileUrl?: string; isPublished: boolean; sortOrder: number; createdAt: string;
}
export function useDocuments(category?: string) {
  const q = category ? `?category=${category}` : "";
  return useQuery<Document[]>({ queryKey: ["documents", category], queryFn: () => api.get(`/documents${q}`).then((r) => r.data) });
}
export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Partial<Document>) => api.post("/documents", d).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }) });
}
export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Partial<Document> & { id: string }) => api.put(`/documents/${id}`, d).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }) });
}
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/documents/${id}`).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }) });
}

// --- Events ---
export interface AppEvent {
  id: string; title: string; description?: string; date: string; endDate?: string;
  type: string; color: string; isPublic: boolean; createdAt: string;
}
export function useEvents(from?: string, to?: string) {
  const q = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  return useQuery<AppEvent[]>({ queryKey: ["events", from, to], queryFn: () => api.get(`/events${q ? "?" + q : ""}`).then((r) => r.data) });
}
export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Partial<AppEvent>) => api.post("/events", d).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }) });
}
export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...d }: Partial<AppEvent> & { id: string }) => api.put(`/events/${id}`, d).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }) });
}
export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/events/${id}`).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }) });
}

// --- Hygiene ---
export function useHygieneStatus() {
  return useQuery<{ confirmed: boolean; version: string; confirmedAt: string | null }>({ queryKey: ["hygiene", "status"], queryFn: () => api.get("/hygiene/status").then((r) => r.data) });
}
export function useConfirmHygiene() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.post("/hygiene/confirm").then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["hygiene"] }) });
}

// --- Tips ---
export interface TipCalculation {
  id: string; shiftDate: string; totalTip: number; calculatedAt: string;
  entries: { id: string; userId: string; hoursWorked: number; tipAmount: number; user: { id: string; firstName: string; lastName: string } }[];
}
export function useTipCalculations() {
  return useQuery<TipCalculation[]>({ queryKey: ["tips"], queryFn: () => api.get("/tips").then((r) => r.data) });
}
export function useCalculateTip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { shiftDate?: string; totalTip: number; workers: { userId: string; hoursWorked: number }[] }) =>
      api.post("/tips/calculate", d).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tips"] }),
  });
}
// --- Notifications ---
export interface AppNotification {
  id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; data?: unknown;
}
export function useNotifications() {
  return useQuery<AppNotification[]>({ queryKey: ["notifications"], queryFn: () => api.get("/notifications").then((r) => r.data), refetchInterval: 30000 });
}
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.put("/notifications/read-all").then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.put(`/notifications/${id}/read`).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}

// --- Settings ---
export interface AppSettings {
  businessName: string; businessAddress?: string; defaultShiftStart: string; defaultShiftEnd: string;
  autoBreakAfterHours: number; autoBreakMinutes: number;
  datevClientNumber?: string; datevConsultantNumber?: string;
  emailFrom?: string; smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPassword?: string;
}
export function useSettings() {
  return useQuery<AppSettings>({ queryKey: ["settings"], queryFn: () => api.get("/settings").then((r) => r.data) });
}
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: Partial<AppSettings>) => api.put("/settings", d).then((r) => r.data), onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }) });
}