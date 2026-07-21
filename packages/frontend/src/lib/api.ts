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
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export type ApiError = { error: string };
