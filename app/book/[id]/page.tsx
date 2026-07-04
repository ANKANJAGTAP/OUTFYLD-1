'use client';

import React, { use } from 'react';
import dynamic from 'next/dynamic';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';

// Dynamic import — TurfDetailsPage bundles @react-google-maps/api (7.4MB)
// Lazy loading it saves ~80-100kB from the initial page bundle
const TurfDetailsPage = dynamic(
  () => import('@/components/booking/TurfDetailsPage'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <NightLoader label="Preparing the ground…" />
      </div>
    ),
  }
);

interface BookPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BookPage(props: BookPageProps) {
  const params = use(props.params);
  return (
    // work surface → ambient dialed to 60%
    <NightShell ambient={0.6}>
      <LandingHeader />
      <TurfDetailsPage turfId={params.id} />
      <NightFooter />
    </NightShell>
  );
}
