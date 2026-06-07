import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "EMPLOYEE";
  employeeType: "PARTTIME" | "MINIJOB";
  avatarUrl?: string | null;
  skills: string[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem("token", token);
        set({ user, token });
      },
      clearAuth: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null });
      },
      isAdmin: () => get().user?.role === "ADMIN",
    }),
    {
      name: "weinhandel-auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
