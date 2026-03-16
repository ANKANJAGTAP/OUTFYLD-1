'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Mail, Lock, User, Phone, Building, AlertCircle, Sparkles, ChevronRight, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

type UserRole = 'customer' | 'owner';

export default function RegisterPage() {
  const { register, loginWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  
  const [customerForm, setCustomerForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: false
  });

  const [ownerForm, setOwnerForm] = useState({
    name: '', email: '', phone: '', businessName: '', password: '', confirmPassword: '', acceptTerms: false
  });

  const handleSubmit = async (e: React.FormEvent, role: UserRole) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const formData = role === 'customer' ? customerForm : ownerForm;
      if (!formData.acceptTerms) throw new Error('You must accept the terms and conditions');
      if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
      if (formData.password.length < 6) throw new Error('Password should be at least 6 characters');

      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        phone: formData.phone,
        businessName: role === 'owner' ? ownerForm.businessName : undefined,
      };

      await register(registrationData);
      setSuccess('Registration successful! Please check your email to verify.');
      
      // Reset logic...
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
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
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Create Account <Sparkles className="h-5 w-5 text-green-500" />
                </h2>
                <p className="text-gray-500 text-sm mt-1">Join the community of turf lovers</p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 rounded-xl border-red-100 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 rounded-xl border-green-100 bg-green-50 text-green-700">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeRole} onValueChange={(val) => setActiveRole(val as UserRole)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/50 p-1 rounded-xl h-12">
                  <TabsTrigger value="customer" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">Customer</TabsTrigger>
                  <TabsTrigger value="owner" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">Turf Owner</TabsTrigger>
                </TabsList>

                <Button 
                  variant="outline"
                  className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 transition-all mb-6 font-medium text-gray-600"
                  onClick={() => loginWithGoogle(activeRole)}
                  disabled={loading}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Signup as {activeRole === 'customer' ? 'Customer' : 'Owner'}
                </Button>

                <TabsContent value="customer">
                  <form onSubmit={(e) => handleSubmit(e, 'customer')} className="space-y-4">
                    <RegisterFields form={customerForm} setForm={setCustomerForm} type="customer" />
                    <SubmitButton loading={loading} text="Create Customer Account" />
                  </form>
                </TabsContent>

                <TabsContent value="owner">
                  <form onSubmit={(e) => handleSubmit(e, 'owner')} className="space-y-4">
                    <div className="space-y-2 group/input">
                      <Label className="text-xs font-bold text-gray-500 ml-1 tracking-tight">BUSINESS NAME</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
                        <Input placeholder="Green Field Sports" className="pl-10 h-12 rounded-xl bg-gray-50/50" value={ownerForm.businessName} onChange={(e) => setOwnerForm({...ownerForm, businessName: e.target.value})} required />
                      </div>
                    </div>
                    <RegisterFields form={ownerForm} setForm={setOwnerForm} type="owner" />
                    <SubmitButton loading={loading} text="Create Owner Account" />
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center pt-5 border-t border-gray-50">
                <p className="text-sm text-gray-500 font-medium">
                  Already a member?{' '}
                  <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-bold">Sign in here</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}

// Sub-components for cleaner code
function RegisterFields({ form, setForm, type }: any) {
  const update = (key: string, val: any) => setForm({ ...form, [key]: val });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2 group/input">
          <Label className="text-xs font-bold text-gray-500 ml-1">FULL NAME</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
            <Input className="pl-10 h-11 rounded-xl bg-gray-50/50" placeholder="John Doe" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2 group/input">
          <Label className="text-xs font-bold text-gray-500 ml-1">PHONE</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
            <Input className="pl-10 h-11 rounded-xl bg-gray-50/50" placeholder="+91" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
          </div>
        </div>
      </div>
      <div className="space-y-2 group/input">
        <Label className="text-xs font-bold text-gray-500 ml-1">EMAIL</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
          <Input className="pl-10 h-11 rounded-xl bg-gray-50/50" type="email" placeholder="name@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2 group/input">
          <Label className="text-xs font-bold text-gray-500 ml-1">PASSWORD</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
            <Input className="pl-10 h-11 rounded-xl bg-gray-50/50" type="password" placeholder="••••••••" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2 group/input">
          <Label className="text-xs font-bold text-gray-500 ml-1">CONFIRM</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within/input:text-green-500 transition-colors" />
            <Input className="pl-10 h-11 rounded-xl bg-gray-50/50" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 py-1">
        <Checkbox id={`terms-${type}`} checked={form.acceptTerms} onCheckedChange={(val) => update('acceptTerms', val)} />
        <Label htmlFor={`terms-${type}`} className="text-xs text-gray-500 leading-tight">
          I agree to the <span className="text-green-600 font-bold">Terms</span> and <span className="text-green-600 font-bold">Privacy Policy</span>
        </Label>
      </div>
    </div>
  );
}

function SubmitButton({ loading, text }: { loading: boolean, text: string }) {
  return (
    <Button className="w-full h-11 bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-100 transition-all text-white font-bold group" disabled={loading}>
      {loading ? 'Creating...' : <span className="flex items-center"> {text} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /> </span>}
    </Button>
  );
}