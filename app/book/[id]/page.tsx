'use client';

import React from 'react';
import TurfDetailsPage from '@/components/booking/TurfDetailsPage';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

interface BookPageProps {
  params: {
    id: string;
  };
}

export default function BookPage({ params }: BookPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <LandingHeader />
      <TurfDetailsPage turfId={params.id} />
      <Footer />
    </div>
  );
}
