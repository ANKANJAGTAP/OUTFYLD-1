'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, User, Phone, Building, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { NightShell } from '@/components/night/NightShell';
import { NightInput } from '@/components/night/ui';
import { SquadSelector } from '@/components/night/SquadSelector';

type UserRole = 'customer' | 'owner';

const label = 'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400';

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
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    }
  };

  const form = activeRole === 'customer' ? customerForm : ownerForm;
  const setForm = activeRole === 'customer' ? setCustomerForm : setOwnerForm;
  const update = (key: string, val: any) => setForm({ ...(form as any), [key]: val });

  return (
    <NightShell className="flex items-center justify-center p-6">
      <div className="relative z-[2] w-full max-w-md py-10">
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

        <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-8 backdrop-blur-sm">
          <p className="nm-overline mb-2 text-flood-500">The turnstile</p>
          <h1 className="font-display text-4xl uppercase tracking-tight text-chalk-100">
            Join the club
          </h1>
          <p className="mt-1.5 text-sm text-chalk-400">Players and arena owners welcome.</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-[3px] border border-red-900/60 bg-red-950/30 px-3.5 py-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mt-5 flex items-start gap-2 rounded-[3px] border border-flood-500/50 bg-flood-500/[0.07] px-3.5 py-3 text-sm text-chalk-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
              {success}
            </div>
          )}

          {/* role toggle — sliding lime underline */}
          <SquadSelector
            className="mt-6"
            options={[
              { label: 'Player', value: 'customer' },
              { label: 'Arena owner', value: 'owner' },
            ]}
            value={activeRole}
            onChange={(v) => setActiveRole(v as UserRole)}
          />

          <button
            type="button"
            onClick={() => loginWithGoogle(activeRole)}
            disabled={loading}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[4px] border border-[#8E918F] bg-[#131314] text-sm font-medium text-white transition-[border-color,background-color] duration-200 ease-night hover:bg-[#1b1c1d] disabled:opacity-40"
          >
            <GoogleG />
            Sign up with Google as {activeRole === 'customer' ? 'player' : 'owner'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-pitchline" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-pitch-700 px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-chalk-400">
                Or with email
              </span>
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e, activeRole)} className="space-y-4">
            {activeRole === 'owner' && (
              <div>
                <label className={label}>Business name</label>
                <div className="relative">
                  <Building className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                  <NightInput
                    className="pl-10"
                    placeholder="Green Field Sports"
                    value={ownerForm.businessName}
                    onChange={(e) => setOwnerForm({ ...ownerForm, businessName: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                  <NightInput
                    className="pl-10"
                    placeholder="John Doe"
                    value={(form as any).name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={label}>Phone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                  <NightInput
                    className="pl-10"
                    placeholder="+91"
                    value={(form as any).phone}
                    onChange={(e) => update('phone', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={label}>Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                <NightInput
                  className="pl-10"
                  type="email"
                  placeholder="name@email.com"
                  value={(form as any).email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                  <NightInput
                    className="pl-10"
                    type="password"
                    placeholder="••••••••"
                    value={(form as any).password}
                    onChange={(e) => update('password', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={label}>Confirm</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                  <NightInput
                    className="pl-10"
                    type="password"
                    placeholder="••••••••"
                    value={(form as any).confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 py-1">
              <Checkbox
                id="terms"
                checked={(form as any).acceptTerms}
                onCheckedChange={(val) => update('acceptTerms', val)}
              />
              <label htmlFor="terms" className="text-xs leading-tight text-chalk-400">
                I agree to the <span className="text-flood-500">Terms</span> and{' '}
                <span className="text-flood-500">Privacy Policy</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nm-overline group flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40"
            >
              {loading ? (
                'Creating…'
              ) : (
                <span className="flex items-center">
                  Create {activeRole === 'customer' ? 'player' : 'owner'} account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 ease-night group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 border-t border-pitchline/60 pt-5 text-center text-sm text-chalk-400">
            Already a member?{' '}
            <Link href="/auth/login" className="font-medium text-flood-500 transition-colors hover:text-flood-600">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </NightShell>
  );
}
