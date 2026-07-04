"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NightShell } from "@/components/night/NightShell";
import { NightInput } from "@/components/night/ui";

const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400";

export default function ForgotPasswordPage() {
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (error: any) {
      console.error("Reset password error:", error);
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else {
        setError(
          error.message || "Failed to send reset email. Please try again.",
        );
      }
    }
  };

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
          {submitted ? (
            <>
              <p className="nm-overline mb-2 text-flood-500">The turnstile</p>
              <h1 className="font-display text-4xl uppercase tracking-tight text-chalk-100">
                Check your email
              </h1>
              <p className="mt-1.5 text-sm text-chalk-400">
                We&apos;ve sent reset instructions to{" "}
                <span className="font-mono text-chalk-100">{email}</span>.
              </p>

              <div className="mt-6 flex items-start gap-2 rounded-[3px] border border-flood-500/50 bg-flood-500/[0.07] px-3.5 py-3 text-sm text-chalk-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
                Reset link on its way. It can take a minute to land.
              </div>

              <Link
                href="/auth/login"
                className="nm-overline group mt-6 flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none"
              >
                Back to login
                <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 ease-night group-hover:translate-x-1" />
              </Link>

              <p className="mt-7 border-t border-pitchline/60 pt-6 text-center text-sm text-chalk-400">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSubmitted(false)}
                  className="font-medium text-flood-500 transition-colors hover:text-flood-600"
                >
                  try again
                </button>
                .
              </p>
            </>
          ) : (
            <>
              <p className="nm-overline mb-2 text-flood-500">The turnstile</p>
              <h1 className="font-display text-4xl uppercase tracking-tight text-chalk-100">
                Reset password
              </h1>
              <p className="mt-1.5 text-sm text-chalk-400">
                We&apos;ll help you get back on the pitch.
              </p>

              {error && (
                <div className="mt-5 flex items-start gap-2 rounded-[3px] border border-red-900/60 bg-red-950/30 px-3.5 py-3 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className={label} htmlFor="email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                    <NightInput
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="nm-overline group flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40"
                >
                  {loading ? (
                    "Sending…"
                  ) : (
                    <span className="flex items-center justify-center">
                      Send reset link
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 ease-night group-hover:translate-x-1" />
                    </span>
                  )}
                </button>
              </form>

              <p className="mt-7 border-t border-pitchline/60 pt-6 text-center text-sm text-chalk-400">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center font-medium text-flood-500 transition-colors hover:text-flood-600"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </NightShell>
  );
}
