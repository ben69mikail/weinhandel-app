// ============================================================
// useApi.ts — Barrel file (backward-compatibility re-export)
// All types now live in @weinhandel/types
// All hooks now live in their feature files
// Import directly from feature files for better tree-shaking
// ============================================================

// Types
export type {
  User, Shift, ShiftAssignment, TimeEntry,
  Availability, AvailabilityWithUser,
  MonthlyReport, VacationRequest, SwapRequest,
  Task, TaskCompletion, Document, AppEvent,
  TipCalculation, TipEntry, AppNotification, AppSettings,
  AvailabilityType, VacationType, RequestStatus,
  ErrorCode, ApiErrorResponse,
} from "@weinhandel/types";

// User hooks
export {
  useUsers, useUser, useCreateUser, useUpdateUser,
  useGrantTempAdmin, useRevokeAdmin, useDeleteUser,
} from "./useUsers";

// Shift hooks
export {
  useShifts, useCreateShift, useUpdateShift, useDeleteShift,
  useAssignShift, useMyShifts, useOpenShifts, useApplyShift,
  useUpdateAssignmentStatus,
} from "./useShifts";

// Availability hooks
export {
  useAvailability, useAllAvailability, useSetAvailability,
} from "./useAvailability";

// Time tracking hooks
export {
  useCurrentTimeEntry, useClockIn, useClockOut,
  useBreakStart, useBreakEnd, useTimeEntries,
  useActiveEntries, useCorrectTimeEntry, useMonthlyReport,
} from "./useTime";

// Vacation hooks
export {
  useVacations, useCreateVacation, useUpdateVacation, useDeleteVacation,
} from "./useVacations";

// Swap hooks
export {
  useSwaps, useCreateSwap, useUpdateSwap,
} from "./useSwaps";

// Task hooks
export {
  useTasks, useCreateTask, useUpdateTask, useCompleteTask, useDeleteTask,
} from "./useTasks";

// Document hooks
export {
  useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument,
} from "./useDocuments";

// Event hooks
export {
  useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent,
} from "./useEvents";

// Hygiene hooks
export { useHygieneStatus, useConfirmHygiene } from "./useHygiene";

// Tip hooks
export { useTipCalculations, useCalculateTip } from "./useTips";

// Notification hooks
export { useNotifications, useMarkAllRead, useMarkRead } from "./useNotifications";

// Settings hooks
export { useSettings, useUpdateSettings } from "./useSettings";

// Query keys
export { queryKeys } from "./queryKeys";
