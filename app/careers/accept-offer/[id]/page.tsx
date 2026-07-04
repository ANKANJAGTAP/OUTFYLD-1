'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import AcceptOfferForm from '@/components/careers/AcceptOfferForm';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { nightGhostBtn } from '@/components/night/ui';

export default function AcceptOfferPage() {
  const params = useParams();
  const applicationId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplicationDetails();
  }, []);

  const fetchApplicationDetails = async () => {
    try {
      const response = await fetch(`/api/careers/accept-offer/${applicationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch application details');
      }

      setApplication(data.application);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <NightShell ambient={0.5}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Loading your offer details…" />
        </div>
      </NightShell>
    );
  }

  if (error) {
    return (
      <NightShell ambient={0.5}>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[4px] border border-pitchline bg-pitch-700/90 p-8 text-center">
            <AlertTriangle className="mx-auto mb-5 h-8 w-8 text-flood-500" />
            <p className="nm-overline mb-3 text-flood-500">Off the books</p>
            <h1 className="font-display text-3xl uppercase tracking-tight text-chalk-100">
              Offer not found
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-chalk-400">{error}</p>
            <a href="/" className={`${nightGhostBtn} mt-8`}>
              Return to home
            </a>
          </div>
        </div>
      </NightShell>
    );
  }

  return (
    <NightShell ambient={0.5}>
      <AcceptOfferForm application={application} applicationId={applicationId} />
    </NightShell>
  );
}
