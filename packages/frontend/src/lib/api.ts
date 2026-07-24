import axios from "axios";

// Immer gleiche Domain: In Produktion leitet Netlify /api/* an die Function weiter,
// im Dev-Modus leitet der Vite-Proxy /api an localhost:4000 weiter.
const BASE_URL = "/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // WICHTIG: auch den zustand-Store-Persist ("weinhandel-auth") leeren.
      // Sonst hält der Store den (ungültigen) Login weiter → Routing schickt
      // wieder in die App → API 401 → /login → Endlos-Loop, App hängt.
      // Tritt auf bei abgelaufenem ODER widerrufenem Token (tokenVersion).
      localStorage.removeItem("token");
      localStorage.removeItem("weinhandel-auth");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export type ApiError = { error: string };
