"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import Image from 'next/image';


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
    <div className="min-h-screen bg-[#f0f4f2] flex items-center justify-center p-6 perspective-1000">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Floating 3D Logo */}
        <div className="text-center mb-8 transform-style-3d hover:rotate-x-12 transition-transform duration-500">
          <Link href="/" className="inline-flex flex-col items-center group">
            <div className="mb-3 flex justify-center">
              <Image
                src="/images/logo.png"
                alt="OutFyld Logo"
                width={80}
                height={80}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>

            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              <span className="text-green-600">OutFyld</span>
            </h1>
          </Link>
        </div>

        <div className="relative group">
          {/* Decorative Back Layer */}
          <div className="absolute inset-0 bg-green-600/10 rounded-[2.5rem] transform rotate-2 scale-105 transition-transform group-hover:rotate-1" />

          <Card className="relative bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-center">
                    <div className="bg-green-100 rounded-full p-3 shadow-inner">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Check your email
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed px-4">
                      We've sent reset instructions to{" "}
                      <span className="font-bold text-gray-800">{email}</span>.
                    </p>
                  </div>

                  <Button
                    asChild
                    className="w-full h-11 bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 font-bold transition-all"
                  >
                    <Link href="/auth/login">Back to Login</Link>
                  </Button>

                  <p className="text-xs text-gray-400">
                    Didn't receive it? Check your spam folder or{" "}
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-green-600 font-bold underline"
                    >
                      try again
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      Reset Password{" "}
                      <Sparkles className="h-5 w-5 text-green-500" />
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      We'll help you get back in
                    </p>
                  </div>

                  {error && (
                    <Alert
                      variant="destructive"
                      className="mb-4 rounded-xl border-red-100 bg-red-50"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2 group/input">
                      <Label className="text-xs font-bold text-gray-500 ml-1 tracking-tight">
                        EMAIL ADDRESS
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all shadow-inner"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full h-11 bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 transition-all text-white font-bold group"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        "Sending..."
                      ) : (
                        <span className="flex items-center justify-center">
                          Send Reset Link{" "}
                          <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>

                    <div className="mt-4 text-center">
                      <Link
                        href="/auth/login"
                        className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}