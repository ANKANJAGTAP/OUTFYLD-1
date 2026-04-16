import { Suspense } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroBanner } from '@/components/landing/HeroBanner';
import { HeroSkeleton } from '@/components/landing/HeroSkeleton';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { Footer } from '@/components/landing/Footer';
import { getPremiumTurfsServer } from '@/lib/turfs';

// ISR: Revalidate landing page data every 5 minutes
export const revalidate = 300;

export default async function Home() {
  // Fetch premium turfs server-side — HTML is sent with real data, no spinner
  const initialTurfs = await getPremiumTurfsServer(4);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <LandingHeader />
      <Suspense fallback={<HeroSkeleton />}>
        <HeroBanner initialTurfs={initialTurfs} />
      </Suspense>
      <FeaturesSection />
      <TestimonialsSection />
      <Footer />
    </main>
  );
}