'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// R3F scene is desktop + motion-only, code-split, never SSR'd (keeps LCP = poster).
const KickoffScene = dynamic(() => import('./KickoffScene'), { ssr: false });
import { HeroPoster } from './HeroPoster';
import { SceneBoundary } from './SceneBoundary';
import { heroScroll } from './heroScroll';
import { deferIdle } from './deferIdle';

export function HeroKickoff() {
  const root = useRef<HTMLElement>(null);
  const [mount3D, setMount3D] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');

  // Decide 3D eligibility after mount (avoids hydration mismatch)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!reduce && wide && fine) setMount3D(true);
  }, []);

  // Pause the R3F render loop while the hero is off-screen (idle loop is
  // otherwise independent of scroll and runs continuously).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setFrameloop(e.isIntersecting ? 'always' : 'never'),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll choreography — floodlights dim, camera pushes toward the pitch,
  // content lifts out. scrub-bound, so it tracks the scrollbar in BOTH
  // directions (no dead end-states). Desktop pins for ~80vh; mobile runs the
  // same timeline unpinned (pinSpacer layout is too expensive on throttled
  // mobile CPUs and was the main TBT cost).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    const cancelIdle = deferIdle(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const pin = window.matchMedia('(min-width: 1024px)').matches;
      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: pin
            ? {
                trigger: el,
                start: 'top top',
                end: '+=80%',
                pin: true,
                scrub: 0.6,
                anticipatePin: 1,
              }
            : { trigger: el, start: 'top top', end: 'bottom 35%', scrub: 0.6 },
        });
        tl.to('.nm-hero-dim', { opacity: 0.6, duration: 1, ease: 'none' }, 0)
          // camera push is consumed by the R3F rig via the shared singleton
          .to(heroScroll, { p: 1, duration: 1, ease: 'none' }, 0)
          .to('.nm-hero-cue', { autoAlpha: 0, duration: 0.25, ease: 'none' }, 0)
          .to('.nm-hero-content', { y: -24, autoAlpha: 0, duration: 0.55, ease: 'none' }, 0.3);
      }, el);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      ctx?.revert();
      heroScroll.p = 0;
    };
  }, []);

  return (
    <section
      ref={root}
      className="nm-grain relative z-[2] h-[100svh] min-h-[640px] w-full overflow-hidden bg-pitch-900 text-chalk-100"
    >
      {/* LCP: CSS poster (also the reduced-motion / mobile fallback) */}
      <HeroPoster />

      {/* R3F scene crossfades over the poster once ready; failures fall back to poster */}
      {mount3D && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-night"
          style={{ opacity: sceneReady ? 1 : 0 }}
        >
          <SceneBoundary onError={() => setMount3D(false)}>
            <KickoffScene frameloop={frameloop} onReady={() => setSceneReady(true)} />
          </SceneBoundary>
        </div>
      )}

      {/* floodlight dim — driven by the pinned scrub timeline */}
      <div className="nm-hero-dim pointer-events-none absolute inset-0 z-20 bg-pitch-900 opacity-0" />

      {/* Content — bottom-anchored, asymmetric left */}
      <div className="nm-hero-content relative z-30 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-6 pb-20 sm:px-10 sm:pb-28 lg:px-16">
        <p className="nm-overline mb-5 text-flood-500">Floodlit turf · Book by the hour</p>

        {/* Headline is painted at first paint (no reveal on the LCP path). */}
        <h1 className="mb-7 max-w-4xl">
          <span className="nm-display-hero block">Play under</span>
          <span className="nm-display-hero block">the lights</span>
        </h1>

        <p className="nm-body-l mb-9 max-w-xl text-chalk-400">
          Find and book premium floodlit turfs near you. Real-time slots, instant
          confirmation, no phone calls.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/browse"
            className="nm-overline nm-flood-glow bg-flood-500 px-8 py-4 text-pitch-900 transition-transform duration-300 ease-night hover:scale-[1.03]"
          >
            Find a pitch
          </Link>
          <Link
            href="/auth/register"
            className="nm-overline border border-chalk-400/30 px-8 py-4 text-chalk-100 backdrop-blur-sm transition-colors duration-300 ease-night hover:border-flood-500 hover:text-flood-500"
          >
            Sign up free
          </Link>
        </div>
      </div>

      {/* scroll cue */}
      <div className="nm-hero-cue absolute bottom-6 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex">
        <span className="nm-caption uppercase tracking-[0.2em] text-chalk-400">Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-flood-500 to-transparent" />
      </div>
    </section>
  );
}
