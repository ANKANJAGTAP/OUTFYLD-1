"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, AlertCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { NightShell } from "@/components/night/NightShell";
import { NightInput } from "@/components/night/ui";

/** Google "G" — official four-colour mark (dark-theme button variant). */
function GoogleG() {
  return (
    <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, loginWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please fill in all fields");
      }
      await login(formData.email, formData.password);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred during login");
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle("customer");
    } catch (error: any) {
      console.error("Google Login error:", error);
      setError(error.message || "An error occurred during Google sign in");
    }
  };

  const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400";

  return (
    <NightShell className="flex items-center justify-center p-6">
      <div className="relative z-[2] w-full max-w-md py-10">
        {/* wordmark */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center">
            <Image
              src="/images/logo.png"
              alt="OutFyld Logo"
              width={64}
              height={64}
              className="mb-2 object-contain brightness-0 invert"
              priority
            />
            <span className="font-display text-2xl uppercase tracking-tight text-chalk-100">
              OutFyld
            </span>
          </Link>
        </div>

        {/* THE TURNSTILE */}
        <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-8 backdrop-blur-sm md:p-10">
          <p className="nm-overline mb-2 text-flood-500">The turnstile</p>
          <h1 className="font-display text-4xl uppercase tracking-tight text-chalk-100">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-chalk-400">Ready to get on the pitch?</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-[3px] border border-red-900/60 bg-red-950/30 px-3.5 py-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Google — dark variant per brand guidelines */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[4px] border border-[#8E918F] bg-[#131314] text-sm font-medium text-white transition-[border-color,background-color] duration-200 ease-night hover:bg-[#1b1c1d] disabled:opacity-40"
          >
            <GoogleG />
            Continue with Google
          </button>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-pitchline" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-pitch-700 px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-chalk-400">
                Secure login
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={label} htmlFor="login-email">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                <NightInput
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  className="block font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
                  htmlFor="login-password"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-flood-500 transition-colors hover:text-flood-600"
                >
                  Reset?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                <NightInput
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* press-down physicality: 2px translate + glow tighten */}
            <button
              type="submit"
              disabled={loading}
              className="nm-overline group flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40"
            >
              {loading ? (
                "Authorizing…"
              ) : (
                <span className="flex items-center justify-center">
                  Sign in
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 ease-night group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-7 border-t border-pitchline/60 pt-6 text-center text-sm text-chalk-400">
            New here?{" "}
            <Link href="/auth/register" className="font-medium text-flood-500 transition-colors hover:text-flood-600">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </NightShell>
  );
}
