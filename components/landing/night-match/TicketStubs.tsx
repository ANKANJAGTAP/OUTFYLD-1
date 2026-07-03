'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PitchDivider } from './PitchDivider';
import { Reveal } from './Reveal';
import { deferIdle } from './deferIdle';

const STEPS = [
  {
    n: '01',
    title: 'Pick pitch',
    body: 'Browse floodlit turfs near you — filter by sport, price and distance.',
    tag: 'Browse',
  },
  {
    n: '02',
    title: 'Pick slot',
    body: 'See live availability and lock a time in seconds. No phone calls, no waiting.',
    tag: 'Reserve',
  },
  {
    n: '03',
    title: 'Play',
    body: 'Show your ticket stub at the gate, step onto the turf, kick off.',
    tag: 'Kickoff',
  },
];

export function TicketStubs() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // rest state is the default; no deal-in

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    const cancelIdle = deferIdle(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      // Deal-in is continuous choreography → scrub-bound, so the stubs deal
      // in on the way down and undeal on the way back up. Animate the
      // WRAPPERS (not the articles) so the stubs' CSS hover-lift transform
      // is never clobbered by GSAP's inline transform.
      const wraps = el.querySelectorAll('.nm-stub-wrap');
      ctx = gsap.context(() => {
        gsap.fromTo(
          wraps,
          { xPercent: 30, y: 48, rotate: -6, autoAlpha: 0 },
          {
            xPercent: 0,
            y: 0,
            rotate: 0,
            autoAlpha: 1,
            stagger: 0.12,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 40%', scrub: 0.8 },
          }
        );
      }, el);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      ctx?.revert();
    };
  }, []);

  return (
    <section className="relative z-[2] bg-pitch-900/[0.92] text-chalk-100">
      <PitchDivider flag="left" />

      <div ref={root} className="mx-auto max-w-[1400px] px-6 pb-28 pt-8 sm:px-10 lg:px-16">
        {/* Section head — asymmetric, left; reveals in and reverses out */}
        <Reveal className="mb-16 max-w-2xl">
          <p className="nm-overline mb-5 text-flood-500">How it works</p>
          <h2 className="nm-display-l">Booking in three taps</h2>
        </Reveal>

        {/* Stubs */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="nm-stub-wrap">
              <article className="nm-stub group relative flex h-full flex-col rounded-[4px] border border-pitchline bg-pitch-700/90 transition-[transform,border-color] duration-300 ease-night hover:-translate-y-2 hover:border-flood-500/50">
                {/* main body */}
                <div className="flex-1 px-7 pb-7 pt-8">
                  <div className="mb-6 flex items-baseline gap-3">
                    <span className="font-mono text-2xl font-medium text-flood-500">{s.n}</span>
                    <span className="nm-overline text-chalk-400">Step</span>
                  </div>
                  <h3 className="mb-4 font-display text-4xl uppercase leading-none tracking-tight text-chalk-100">
                    {s.title}
                  </h3>
                  <p className="nm-caption max-w-[26ch] text-chalk-400">{s.body}</p>
                </div>

                {/* perforation — dashed tear + punched notches, glows lime on hover */}
                <div className="relative">
                  <span className="absolute left-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-pitch-900" />
                  <span className="absolute right-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-pitch-900" />
                  <div className="mx-4 border-t border-dashed border-pitchline transition-colors duration-300 ease-night group-hover:border-flood-500/70" />
                </div>

                {/* stub footer */}
                <div className="flex items-center justify-between px-7 py-5">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-chalk-400">
                    OutFyld · {s.tag}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-chalk-400 transition-colors duration-300 ease-night group-hover:text-flood-500" />
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
