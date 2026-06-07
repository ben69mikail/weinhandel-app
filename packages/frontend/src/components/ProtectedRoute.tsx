import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireAdmin() {
  const { token, isAdmin } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RedirectIfAuth() {
  const { token, isAdmin } = useAuthStore();
  if (token) return <Navigate to={isAdmin() ? "/admin" : "/"} replace />;
  return <Outlet />;
}
