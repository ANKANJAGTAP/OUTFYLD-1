'use client';

import React, { use } from 'react';
import dynamic from 'next/dynamic';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import { Loader2 } from 'lucide-react';

// Dynamic import — TurfDetailsPage bundles @react-google-maps/api (7.4MB)
// Lazy loading it saves ~80-100kB from the initial page bundle
const TurfDetailsPage = dynamic(
  () => import('@/components/booking/TurfDetailsPage'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <LandingHeader />
      <TurfDetailsPage turfId={params.id} />
      <Footer />
    </div>
  );
}
