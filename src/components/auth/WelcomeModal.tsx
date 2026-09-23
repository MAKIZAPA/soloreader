"use client";

import { useState } from "react";
import {
  X,
  User,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; username: string }) => void;
  onOpenAniList?: () => void;
}

export function WelcomeModal({
  isOpen,
  onClose,
  onSuccess,
  onOpenAniList,
}: WelcomeModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-neutral-200">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400">
              <BookOpen className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">SoloReader</h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-neutral-400">Suite de lectura para Manhwas y Mangas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            title="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Creator Attribution */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-800/70 bg-neutral-900/40 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span>Creado por</span>
            <span className="font-semibold text-neutral-200">@makizapa</span>
          </div>
          <a
            href="https://github.com/makizapa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300 transition"
          >
            <svg className="size-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </a>
        </div>

        {/* Tab Switcher */}
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
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
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
            <label className="block text-xs font-medium text-neutral-300 mb-1">
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
              <label className="block text-xs font-medium text-neutral-300 mb-1">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50 shadow-xs cursor-pointer"
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

        {/* Optional AniList alternative */}
        {onOpenAniList && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAniList();
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/50 py-2 px-3 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition"
            >
              <Sparkles className="size-3.5 text-sky-400" />
              <span>O sincronizar con cuenta de AniList</span>
            </button>
          </div>
        )}

        {/* Bottom Dismiss Button: 'Solo quiero leer' */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-neutral-800 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 hover:border-neutral-700 transition cursor-pointer"
          >
            <span>Solo quiero leer</span>
            <span className="text-neutral-500 font-mono">▸</span>
          </button>
        </div>
      </div>
    </div>
  );
}
