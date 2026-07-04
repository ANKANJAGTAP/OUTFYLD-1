import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightClass } from '@/components/night/NightShell';
import { ScrollIndicator } from '@/components/night/ScrollIndicator';
import { SmoothScroll } from '@/components/landing/night-match/SmoothScroll';
import { AmbientLayer } from '@/components/landing/night-match/AmbientLayer';
import { HeroKickoff } from '@/components/landing/night-match/HeroKickoff';
import { Scoreboard } from '@/components/landing/night-match/Scoreboard';
import { BroadcastTicker } from '@/components/landing/night-match/BroadcastTicker';
import { TicketStubs } from '@/components/landing/night-match/TicketStubs';
import { KitRack } from '@/components/landing/night-match/kit/KitRack';
import { EditorialTurfs } from '@/components/landing/night-match/EditorialTurfs';
import { TestimonialsSpotlight } from '@/components/landing/night-match/TestimonialsSpotlight';
import { CtaFooter } from '@/components/landing/night-match/CtaFooter';
import { getPremiumTurfsServer, getPlatformStatsServer, getSportsRackServer } from '@/lib/turfs';

// ISR: Revalidate landing page data every 5 minutes
export const revalidate = 300;

export default async function Home() {
  // Premium turfs feed the editorial section; stats feed scoreboard + ticker;
  // per-sport counts/prices feed the kit rack
  const [initialTurfs, stats, rack] = await Promise.all([
    getPremiumTurfsServer(4),
    getPlatformStatsServer(),
    getSportsRackServer(),
  ]);

  return (
    <SmoothScroll>
      <main className="relative min-h-screen bg-pitch-900">
        {/* dark theme scope for portals (account dropdown, toasts) */}
        <NightClass />
        {/* scroll progress indicator (lime marker tracks scroll position) */}
        <ScrollIndicator />
        {/* one persistent living layer behind every section (z-1; sections are z-2, slightly translucent) */}
        <AmbientLayer />
        <LandingHeader />
        <HeroKickoff />
        <Scoreboard stats={stats} />
        <BroadcastTicker stats={stats} />
        <TicketStubs />
        <KitRack items={rack} />
        <EditorialTurfs turfs={initialTurfs} />
        <TestimonialsSpotlight />
        <CtaFooter />
      </main>
    </SmoothScroll>
  );
}
