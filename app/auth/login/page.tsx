"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Mail,
  Lock,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

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

  return (
    <div className="min-h-screen bg-[#f0f4f2] flex items-center justify-center p-6 perspective-1000">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Floating 3D Logo */}
        <div className="text-center mb-10 transform-style-3d hover:rotate-x-12 transition-transform duration-500">
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

        {/* 3D "Stacked" Card Effect */}
        <div className="relative group">
          {/* Decorative Back Layer */}
          <div className="absolute inset-0 bg-green-600/10 rounded-[2rem] transform rotate-3 scale-105 transition-transform group-hover:rotate-1" />

          <Card className="relative bg-white/90 backdrop-blur-xl border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Welcome Back <Sparkles className="h-5 w-5 text-green-500" />
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Ready to explore the field?
                </p>
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="mb-6 rounded-xl border-red-100 bg-red-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Enhanced Google Button */}
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-green-200 transition-all shadow-sm active:scale-95"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  <span className="bg-white/80 px-3 py-1 rounded-full">
                    Secure Login
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 ml-1">
                    EMAIL ADDRESS
                  </Label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
                    </div>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 rounded-xl focus-visible:ring-green-500 focus-visible:bg-white transition-all shadow-inner"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-xs font-bold text-gray-600">
                      PASSWORD
                    </Label>
                    <Link
                      href="/auth/forgot-password"

                      className="text-xs font-semibold text-green-600 hover:text-green-700"
                    >
                      Reset?
                    </Link>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
                    </div>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-12 bg-gray-50/50 border-gray-200 rounded-xl focus-visible:ring-green-500 focus-visible:bg-white transition-all shadow-inner"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] transition-all font-bold text-white group"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    "Authorizing..."
                  ) : (
                    <span className="flex items-center justify-center">
                      Sign In{" "}
                      <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  New here?{" "}
                  <Link
                    href="/auth/register"
                    className="text-green-600 hover:underline font-bold"
                  >
                    Create free account
                  </Link>
                </p>
              </div>
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
        .translate-z-10 {
          transform: translateZ(20px);
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
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}