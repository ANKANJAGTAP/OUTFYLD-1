'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building, Phone, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { NightShell } from '@/components/night/NightShell';
import { NightInput } from '@/components/night/ui';

const label = 'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400';

export default function ProfileSetupPage() {
  const { firebaseUser, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: firebaseUser?.displayName || '',
    phone: '',
    role: '' as 'customer' | 'owner' | '',
    businessName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firebaseUser) {
      setError('User not authenticated');
      return;
    }

    if (!formData.name || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.role === 'owner' && !formData.businessName) {
      setError('Business name is required for turf owners');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = {
        uid: firebaseUser.uid,
        name: formData.name,
        email: firebaseUser.email!,
        role: formData.role,
        phone: formData.phone || undefined,
        businessName: formData.role === 'owner' ? formData.businessName : undefined,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user profile');
      }

      setSuccess('Profile created successfully! Redirecting...');

      // Refresh user data in AuthContext
      await refreshUserData();

      // Redirect based on role
      setTimeout(() => {
        if (formData.role === 'owner') {
          window.location.href = '/owner/dashboard';
        } else {
          window.location.href = '/';
        }
      }, 2000);

    } catch (error: any) {
      console.error('Profile setup error:', error);
      setError(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  if (!firebaseUser) {
    return (
      <NightShell className="flex items-center justify-center p-6">
        <div className="relative z-[2] w-full max-w-md py-10">
          <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-8 text-center backdrop-blur-sm md:p-10">
            <p className="nm-overline mb-2 text-flood-500">The turnstile</p>
            <h1 className="font-display text-3xl uppercase tracking-tight text-chalk-100">
              Access denied
            </h1>
            <p className="mt-3 text-sm text-chalk-400">
              You need to be logged in to access this page.
            </p>
          </div>
        </div>
      </NightShell>
    );
  }

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
            Complete your profile
          </h1>
          <p className="mt-1.5 text-sm text-chalk-400">
            A few more details to set up your account.
          </p>

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

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className={label} htmlFor="name">
                Full name *
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                <NightInput
                  id="name"
                  placeholder="Your full name"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className={label} htmlFor="role">
                Account type *
              </label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({...formData, role: value as 'customer' | 'owner'})}
              >
                <SelectTrigger className="h-auto rounded-[4px] border-pitchline bg-pitch-800/80 px-4 py-3 text-sm text-chalk-100 transition-[border-color] duration-200 ease-night focus:border-flood-500/60 focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-chalk-400/60">
                  <SelectValue placeholder="Select your account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Player</SelectItem>
                  <SelectItem value="owner">Arena owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'owner' && (
              <div>
                <label className={label} htmlFor="businessName">
                  Business name *
                </label>
                <div className="relative">
                  <Building className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                  <NightInput
                    id="businessName"
                    placeholder="Your turf business name"
                    className="pl-10"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    required={formData.role === 'owner'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={label} htmlFor="phone">
                Phone number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400/50" />
                <NightInput
                  id="phone"
                  placeholder="+91 98765 43210"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nm-overline group flex h-12 w-full items-center justify-center rounded-[4px] bg-flood-500 text-pitch-900 shadow-flood transition-[transform,box-shadow,background-color] duration-200 ease-night hover:bg-flood-600 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40"
            >
              {loading ? (
                'Creating profile…'
              ) : (
                <span className="flex items-center justify-center">
                  Complete setup
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 ease-night group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </NightShell>
  );
}
