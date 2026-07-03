import type { PlatformStats } from '@/lib/turfs';
import { PitchDivider } from './PitchDivider';
import { CountUp } from './CountUp';
import { Reveal } from './Reveal';
import { ScoreboardSetPiece } from './ScoreboardSetPiece';

/**
 * Scoreboard band — asymmetric, editorial stat layout (deliberately NOT a
 * symmetric stat strip). One lead figure in lime, the rest staggered on a
 * 12-col grid.
 * Reversibility contract: the band chrome (overline, grid) reveals and
 * REVERSES with scroll; the odometer digits are the sanctioned exception —
 * they count once and hold.
 */
export function Scoreboard({ stats }: { stats: PlatformStats }) {
  return (
    <section className="relative z-[2] bg-pitch-800/[0.93] text-chalk-100">
      <PitchDivider flag="right" />

      <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-6 sm:px-10 lg:px-16">
        <Reveal>
          <p className="nm-overline mb-14 flex items-center gap-3 text-chalk-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-flood-500 shadow-flood" />
            Match stats · updated live
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <ScoreboardSetPiece stats={stats}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-14 lg:grid-cols-12 lg:gap-y-0">
          {/* Lead stat — oversized, lime */}
          <div className="col-span-2 lg:col-span-4">
            <div className="nm-scoreboard text-flood-500">
              <CountUp value={stats.turfs} />
            </div>
            <p className="nm-caption mt-3 max-w-[12ch] uppercase tracking-[0.14em] text-chalk-400">
              Turfs floodlit &amp; bookable
            </p>
          </div>

          <div className="lg:col-span-3 lg:mt-10">
            <div className="nm-scoreboard">
              <CountUp value={stats.cities} />
            </div>
            <p className="nm-caption mt-3 max-w-[12ch] uppercase tracking-[0.14em] text-chalk-400">
              Cities in play
            </p>
          </div>

          <div className="lg:col-span-3 lg:mt-4">
            <div className="nm-scoreboard">
              <CountUp value={stats.bookings} />
            </div>
            <p className="nm-caption mt-3 max-w-[14ch] uppercase tracking-[0.14em] text-chalk-400">
              Games booked
            </p>
          </div>

          <div className="lg:col-span-2 lg:mt-16">
            <div className="nm-scoreboard flex items-baseline">
              <CountUp value={stats.rating} decimals={1} />
              <span className="ml-1 text-[0.5em] text-chalk-400">/5</span>
            </div>
            <p className="nm-caption mt-3 max-w-[12ch] uppercase tracking-[0.14em] text-chalk-400">
              Avg. player rating
            </p>
          </div>
          </div>
          </ScoreboardSetPiece>
        </Reveal>
      </div>
    </section>
  );
}
