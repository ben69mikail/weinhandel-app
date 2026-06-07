import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
      toggle: () => set((s) => {
        const next = !s.dark;
        document.documentElement.classList.toggle("dark", next);
        return { dark: next };
      }),
    }),
    { name: "theme" }
  )
);

// Apply on load
const saved = localStorage.getItem("theme");
if (saved) {
  const { state } = JSON.parse(saved);
  document.documentElement.classList.toggle("dark", state?.dark ?? false);
}