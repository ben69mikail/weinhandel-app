// ============================================================
// @weinhandel/types — Shared domain interfaces
// Single source of truth for frontend + backend
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  birthday?: string;
  role: "ADMIN" | "EMPLOYEE";
  employeeType: "PARTTIME" | "MINIJOB";
  monthlyHours?: number;
  vacationHoursPerDay?: number;
  skills: string[];
  avatarUrl?: string;
  personnelNumber?: string;
  isActive: boolean;
  createdAt: string;
  tempAdminUntil?: string | null;
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  status: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string };
}

export interface Shift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  area: string;
  maxWorkers: number;
  minWorkers: number;
  notes?: string | null;
  isPublished: boolean;
  isOpenShift: boolean;
  isRecurring: boolean;
  requiredSkills: string[];
  color: string;
  createdAt: string;
  assignments: ShiftAssignment[];
}

export interface TimeEntry {
  id: string;
  userId: string;
  shiftId?: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes: number;
  totalMinutes?: number;
  netMinutes?: number;
  autoBreak?: boolean;
  note?: string;
  createdAt: string;
}

export type AvailabilityType = "AVAILABLE" | "UNAVAILABLE" | "PREFERRED" | "PARTIAL";

export interface Availability {
  id: string;
  userId: string;
  date: string;
  type: AvailabilityType;
  startTime?: string;
  endTime?: string;
  note?: string;
}

export interface AvailabilityWithUser extends Availability {
  user: { id: string; firstName: string; lastName: string };
}

export interface MonthlyReport {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    employeeType: string;
    monthlyHours?: number;
    personnelNumber?: string;
  };
  entries: TimeEntry[];
  netMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  sollMinutes: number;
  diff: number;
  days: number;
  vacationDays?: number;
  vacationHours?: number;
}

export type VacationType = "VACATION" | "SICK" | "SPECIAL";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface VacationRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: VacationType;
  status: RequestStatus;
  note?: string;
  adminNote?: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  targetUserId?: string;
  fromShiftId: string;
  toShiftId?: string;
  status: RequestStatus;
  note?: string;
  createdAt: string;
  requester: { id: string; firstName: string; lastName: string };
  targetUser?: { id: string; firstName: string; lastName: string };
  fromShift: { id: string; startTime: string; endTime: string; title: string };
}

export interface TaskCompletion {
  id: string;
  userId: string;
  status: string;
  note?: string;
  completedAt: string;
  user: { id: string; firstName: string; lastName: string };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: number;
  dueDate?: string;
  isRecurring: boolean;
  createdAt: string;
  completions: TaskCompletion[];
}

export interface Document {
  id: string;
  title: string;
  category: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AppEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  type: string;
  color: string;
  isPublic: boolean;
  createdAt: string;
}

export interface TipEntry {
  id: string;
  userId: string;
  hoursWorked: number;
  tipAmount: number;
  user: { id: string; firstName: string; lastName: string };
}

export interface TipCalculation {
  id: string;
  shiftDate: string;
  totalTip: number;
  calculatedAt: string;
  entries: TipEntry[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: unknown;
}

export interface AppSettings {
  businessName: string;
  businessAddress?: string;
  defaultShiftStart: string;
  defaultShiftEnd: string;
  autoBreakAfterHours: number;
  autoBreakMinutes: number;
  autoBreak2AfterHours: number;
  autoBreak2Minutes: number;
  datevClientNumber?: string;
  datevConsultantNumber?: string;
  emailFrom?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

// ---- Error codes (Kandidat 4) ----
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SHIFT_FULL"
  | "SHIFT_ALREADY_ASSIGNED"
  | "SHIFT_NOT_OPEN"
  | "CLOCK_ALREADY_IN"
  | "CLOCK_NOT_IN"
  | "VACATION_OVERLAP"
  | "SWAP_INVALID"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  code: ErrorCode;
  message: string;
}
