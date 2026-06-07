import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore, AuthUser } from "../store/auth";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const mutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<LoginResponse>("/auth/login", data).then((r) => r.data),
    onSuccess: ({ token, user }) => {
      setAuth(user, token);
      navigate(user.role === "ADMIN" ? "/admin" : "/");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error ?? "Login fehlgeschlagen");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#8B1A1A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🍷</span>
          </div>
          <h1 className="text-2xl font-bold text-[#8B1A1A]">Weinhandel</h1>
          <p className="text-gray-500 text-sm mt-1">Staff Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Anmelden</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent text-sm"
                placeholder="name@weinhandel.de"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 bg-[#8B1A1A] text-white font-semibold rounded-xl hover:bg-[#6B1414] active:bg-[#5A1111] transition-colors disabled:opacity-60 mt-2"
            >
              {mutation.isPending ? "Anmelden..." : "Anmelden"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Weinhandel Martin Volmer e.K.
        </p>
      </div>
    </div>
  );
}
