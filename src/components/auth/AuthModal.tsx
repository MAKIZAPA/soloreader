"use client";

import { useState } from "react";
import { X, User, Lock, Loader2, CheckCircle2, AlertCircle, Shield } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; username: string }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError("Ingresa un nombre de usuario.");
      return;
    }

    if (cleanUser.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }

    if (!password) {
      setError("Ingresa una contraseña.");
      return;
    }

    if (tab === "register") {
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la solicitud.");
      }

      setSuccessMsg(
        tab === "login"
          ? "Sesión iniciada correctamente."
          : "Cuenta creada exitosamente."
      );

      setTimeout(() => {
        onSuccess(data.user);
        onClose();
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setSuccessMsg(null);
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400">
              <Shield className="size-4" />
            </div>
            <h2 className="text-base font-semibold text-white">
              {tab === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 p-1 mt-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`py-2 rounded-lg transition ${
              tab === "login"
                ? "bg-neutral-800 text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`py-2 rounded-lg transition ${
              tab === "register"
                ? "bg-neutral-800 text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nombre de usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. makizapa"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                required
              />
            </div>
          </div>

          {tab === "register" && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder-neutral-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : tab === "login" ? (
              "Iniciar Sesión"
            ) : (
              "Crear Cuenta"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-neutral-500">
          Sin correos ni spam. Tu biblioteca, historial y estadísticas se cifran y sincronizan con tu usuario.
        </p>
      </div>
    </div>
  );
}
