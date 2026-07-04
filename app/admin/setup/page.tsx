'use client';

import { useState } from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { NightShell } from '@/components/night/NightShell';
import { NightInput, nightCard, nightPrimaryBtn } from '@/components/night/ui';
import { Reveal } from '@/components/landing/night-match/Reveal';

export default function AdminSetupPage() {
  const [formData, setFormData] = useState({
    adminEmail: '',
    adminUid: '',
    adminName: '',
    setupKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup admin');
      }

      setSuccess(data.message);
      setFormData({
        adminEmail: '',
        adminUid: '',
        adminName: '',
        setupKey: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'nm-overline block text-chalk-400';
  const hintClass = 'font-mono text-[10px] leading-relaxed text-chalk-400/70';

  return (
    <NightShell ambient={0.4}>
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          {/* ── left rail: the brief ── */}
          <Reveal>
            <div className="lg:pt-8">
              <p className="nm-overline mb-3 flex items-center gap-2 text-flood-500">
                <Shield className="h-4 w-4" />
                Control room
              </p>
              <h1 className="nm-display-l text-chalk-100">Admin setup</h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-chalk-400">
                Create or verify the admin account for the OutFyld platform.
              </p>

              <div className="mt-8 border-t border-pitchline pt-6">
                <p className="nm-overline text-chalk-400">Pre-match routine</p>
                <ol className="mt-4 space-y-2 text-sm leading-relaxed text-chalk-400">
                  {[
                    'First, create a user account through Firebase Authentication',
                    'Get the Firebase UID from the Firebase Console',
                    'Set the ADMIN_SETUP_KEY in your environment variables',
                    'Fill in the form and submit',
                    'The admin can then log in and access the admin dashboard',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-xs tabular-nums text-flood-500">{String(i + 1).padStart(2, '0')}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <a
                href="/"
                className="mt-8 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
              >
                ← Back to home
              </a>
            </div>
          </Reveal>

          {/* ── right: the form ── */}
          <Reveal delay={0.08}>
            <div className={`${nightCard} p-6 sm:p-8`}>
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-[4px] border border-red-700/60 bg-red-950/40 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 flex items-start gap-3 rounded-[4px] border border-flood-500/40 bg-pitch-700/80 px-4 py-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-flood-500">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="adminName" className={labelClass}>Admin name</label>
                  <NightInput
                    id="adminName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="adminEmail" className={labelClass}>Admin email</label>
                  <NightInput
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="adminUid" className={labelClass}>Firebase UID</label>
                  <NightInput
                    id="adminUid"
                    type="text"
                    placeholder="Firebase user UID"
                    value={formData.adminUid}
                    onChange={(e) => setFormData({ ...formData, adminUid: e.target.value })}
                    required
                  />
                  <p className={hintClass}>
                    The Firebase UID of the admin user. This user must already be registered in Firebase Authentication.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="setupKey" className={labelClass}>Setup key</label>
                  <NightInput
                    id="setupKey"
                    type="password"
                    placeholder="Enter setup key"
                    value={formData.setupKey}
                    onChange={(e) => setFormData({ ...formData, setupKey: e.target.value })}
                    required
                  />
                  <p className={hintClass}>
                    The secret setup key configured in environment variables (ADMIN_SETUP_KEY)
                  </p>
                </div>

                <button type="submit" className={`${nightPrimaryBtn} w-full`} disabled={loading}>
                  {loading ? 'Setting up...' : 'Setup admin account'}
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </NightShell>
  );
}
