'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Mail, Printer } from 'lucide-react';
import { NightShell } from '@/components/night/NightShell';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightLoader } from '@/components/night/NightLoader';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import { Mono, nightGhostBtn, nightPrimaryBtn } from '@/components/night/ui';

const confirmations = [
  {
    title: 'Verification completed',
    desc: 'Your details have been verified successfully',
  },
  {
    title: 'Digital signature received',
    desc: 'Your signature has been saved securely',
  },
  {
    title: 'Payment processed',
    desc: 'payment completed successfully',
    amount: '₹249',
  },
];

const nextSteps = [
  'Check your email for the joining letter',
  'Download and save all documents for your records',
  'Wait for onboarding instructions (within 24-48 hours)',
  'Mark your calendar for your start date',
];

export default function OfferAcceptanceSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        const response = await fetch(`/api/careers/accept-offer/${applicationId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setApplication(data.application);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  if (loading) {
    return (
      <NightShell ambient={0.5}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Counting the crowd…" />
        </div>
      </NightShell>
    );
  }

  return (
    <NightShell>
      <LandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        {/* ── FULL-TIME WHISTLE — celebratory opener ── */}
        <Reveal>
          <p className="nm-overline mb-5 flex items-center gap-2.5 text-chalk-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-flood-500 shadow-flood" />
            <span className="text-flood-500">Offer accepted</span>
            · Welcome to the squad
          </p>
          <h1 className="nm-display-xl text-chalk-100">
            Signed<span className="text-flood-500">!</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-chalk-400">
            Congratulations — your offer acceptance is complete. Welcome to the OutFyld team.
          </p>
        </Reveal>

        <PitchDivider flag="right" className="my-6" />

        {/* ── SIGNING SHEET — confirmations ledger ── */}
        <Reveal delay={0.08}>
          <div className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-6 sm:p-8">
            <div className="border-b border-pitchline pb-5">
              <p className="nm-overline text-flood-500">Payment successful</p>
              <h2 className="mt-2 font-display text-3xl uppercase tracking-tight text-chalk-100">
                Contract confirmed
              </h2>
            </div>

            <ul>
              {confirmations.map((c) => (
                <li
                  key={c.title}
                  className="flex items-start gap-4 border-b border-pitchline/70 py-5 last:border-0"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100">
                      {c.title}
                    </p>
                    <p className="mt-1 text-sm text-chalk-400">
                      {c.amount && <Mono className="text-flood-500">{c.amount} </Mono>}
                      {c.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* email note */}
            <div className="mt-4 flex items-start gap-3 border-l-2 border-flood-500 bg-pitch-800/80 px-4 py-4">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-flood-500" />
              <p className="text-sm leading-relaxed text-chalk-400">
                <span className="font-medium text-chalk-100">Check your email!</span> We&apos;ve
                sent your joining letter and onboarding details to{' '}
                <span className="font-mono text-chalk-100">{application?.email}</span>
              </p>
            </div>

            {/* Next Steps */}
            <div className="mt-10">
              <p className="nm-overline text-chalk-400">Pre-season schedule</p>
              <h3 className="mt-2 font-display text-2xl uppercase tracking-tight text-chalk-100">
                What&apos;s next?
              </h3>
              <ol className="mt-3">
                {nextSteps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-4 border-b border-pitchline/70 py-4 last:border-0"
                  >
                    <span className="font-mono text-sm tabular-nums text-flood-500">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm leading-relaxed text-chalk-400">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>

        {/* ── Actions — one lime primary ── */}
        <Reveal delay={0.14}>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/careers" className={nightPrimaryBtn}>
              Back to careers
            </Link>
            <button onClick={() => window.print()} className={nightGhostBtn}>
              <Printer className="h-4 w-4" />
              Print this page
            </button>
          </div>

          {/* Contact Support */}
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
            Need help? Contact us at{' '}
            <a
              href="mailto:admin@outfyld.in"
              className="text-chalk-100 transition-colors duration-200 ease-night hover:text-flood-500"
            >
              admin@outfyld.in
            </a>
          </p>
        </Reveal>
      </main>
      <NightFooter />
    </NightShell>
  );
}
