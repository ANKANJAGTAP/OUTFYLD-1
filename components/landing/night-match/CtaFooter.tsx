import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { PitchDivider } from './PitchDivider';
import { Reveal } from './Reveal';
import { NightFooter } from './NightFooter';

/**
 * Closing CTA + Night Match footer (homepage).
 * Full-bleed "Get on the pitch" CTA on the elevated pitch, then the shared
 * NightFooter used across every page.
 */
export function CtaFooter() {
  return (
    <>
      {/* ── Closing CTA ── */}
      <section className="nm-grain relative z-[2] overflow-hidden bg-pitch-800/[0.93] text-chalk-100">
        <PitchDivider flag="right" />
        {/* faint floodlight bloom top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(40% 45% at 82% 4%, rgba(200,241,53,0.10) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 py-28 sm:px-10 lg:px-16 lg:py-36">
          <Reveal>
            <p className="nm-overline mb-6 text-flood-500">Kickoff</p>
            <h2 className="nm-display-xl max-w-4xl">Get on the pitch</h2>
            <p className="nm-body-l mt-7 max-w-xl text-chalk-400">
              Floodlit turfs, real-time slots, instant confirmation. Your next game is a
              couple of taps away.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/browse"
                className="nm-overline nm-flood-glow bg-flood-500 px-8 py-4 text-pitch-900 transition-transform duration-300 ease-night hover:scale-[1.03]"
              >
                Find a pitch
              </Link>
              <Link
                href="/auth/register"
                className="nm-overline inline-flex items-center gap-2 border border-chalk-400/30 px-8 py-4 text-chalk-100 transition-colors duration-300 ease-night hover:border-flood-500 hover:text-flood-500"
              >
                List your turf
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Shared footer ── */}
      <NightFooter />
    </>
  );
}
