// Centralized query key registry — prevents magic strings
// Usage: queryKeys.shifts.all(), queryKeys.availability.byMonth("2026-06"), etc.

export const queryKeys = {
  users: {
    all: () => ["users"] as const,
    byId: (id: string) => ["users", id] as const,
  },
  shifts: {
    all: (params?: object) => ["shifts", params] as const,
    my: (month: string) => ["shifts", "my", month] as const,
    open: () => ["shifts", "open"] as const,
  },
  availability: {
    mine: (month: string) => ["availability", month] as const,
    all: (month: string) => ["availability", "all", month] as const,
  },
  time: {
    current: () => ["time", "current"] as const,
    entries: (params: object) => ["time", "entries", params] as const,
    active: () => ["time", "active"] as const,
  },
  reporting: {
    monthly: (month: string) => ["reporting", "monthly", month] as const,
  },
  vacations: {
    all: () => ["vacations"] as const,
  },
  swaps: {
    all: () => ["swaps"] as const,
  },
  tasks: {
    byDate: (date?: string) => ["tasks", date] as const,
  },
  documents: {
    byCategory: (category?: string) => ["documents", category] as const,
  },
  events: {
    byRange: (from?: string, to?: string) => ["events", from, to] as const,
  },
  hygiene: {
    status: () => ["hygiene", "status"] as const,
  },
  tips: {
    all: () => ["tips"] as const,
  },
  notifications: {
    all: () => ["notifications"] as const,
  },
  settings: {
    all: () => ["settings"] as const,
  },
} as const;
