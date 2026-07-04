import Link from 'next/link';
import {
  Briefcase, Users, TrendingUp, Award, ArrowRight, Lightbulb, HandshakeIcon, BookOpen,
} from 'lucide-react';
import CareersPageNotifications from '@/components/careers/CareersPageNotifications';
import { Suspense } from 'react';
import { NightShell } from '@/components/night/NightShell';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';

const whyJoin = [
  {
    no: '01',
    title: 'Growth mindset',
    desc: 'Rapid career progression in a fast-growing startup environment.',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    no: '02',
    title: 'Great team',
    desc: 'Work with passionate, talented people.',
    icon: <Users className="h-4 w-4" />,
  },
  {
    no: '03',
    title: 'Impact',
    desc: 'Bring real change to Indian sports.',
    icon: <Award className="h-4 w-4" />,
  },
  {
    no: '04',
    title: 'Flexibility',
    desc: 'Remote-friendly culture with flexible working hours.',
    icon: <Briefcase className="h-4 w-4" />,
  },
];

const culture = [
  {
    title: 'Innovation first',
    desc: "We encourage creative thinking and aren't afraid to try new approaches. Your ideas matter here.",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    title: 'Collaboration',
    desc: 'We believe in teamwork. Every voice is heard, and every contribution is valued.',
    icon: <HandshakeIcon className="h-4 w-4" />,
  },
  {
    title: 'Learning',
    desc: 'Continuous learning is part of our DNA. We invest in your growth through training and mentorship.',
    icon: <BookOpen className="h-4 w-4" />,
  },
];

const perks = [
  {
    title: 'Performance-based stipend*',
    desc: 'Competitive internship stipends based on your contribution',
  },
  {
    title: 'Completion certificate',
    desc: 'Official certificate upon successful internship completion',
  },
  { title: 'Flexible work', desc: 'Remote work options and flexible hours' },
  {
    title: 'Real-world experience',
    desc: 'Work on live projects that impact thousands of users',
  },
  {
    title: 'Mentorship program',
    desc: 'Direct guidance from experienced team leads and founders',
  },
  { title: 'Free turf access', desc: 'Complimentary access to partner turfs' },
];

export default function CareersPage() {
  return (
    <NightShell>
      {/* Notifications for offer acceptance */}
      <Suspense fallback={null}>
        <CareersPageNotifications />
      </Suspense>

      <LandingHeader />

      <main>
        {/* ── TEAM SHEET OPENER — oversized Anton statement, asymmetric ── */}
        <section className="nm-grain relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <Reveal>
            <p className="nm-overline mb-6 text-flood-500">Join the squad</p>
            <h1 className="nm-display-xl max-w-5xl text-chalk-100">
              Play for the
              <br />
              home team
            </h1>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 lg:ml-[38%]">
            <p className="nm-body-l max-w-xl text-chalk-400">
              Build the future of sports and turf booking in India — nights under floodlights,
              shipped by a small squad that plays every position.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/careers/jobs"
                className="nm-overline nm-flood-glow inline-flex items-center gap-2 rounded-[4px] bg-flood-500 px-8 py-4 text-pitch-900 transition-transform duration-300 ease-night hover:scale-[1.02]"
              >
                View open positions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </section>

        <PitchDivider flag="right" />

        {/* ── WHY WORK AT OUTFYLD — hairline ledger, mono numbering ── */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="nm-overline mb-3 text-flood-500">The scouting report</p>
            <h2 className="nm-display-l max-w-3xl text-chalk-100">
              Why work at <span className="text-flood-500">OutFyld</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="mt-10 lg:ml-[24%]">
            <div className="max-w-2xl">
              {whyJoin.map((f) => (
                <div
                  key={f.no}
                  className="group flex items-start gap-5 border-b border-pitchline/70 py-6 transition-colors duration-200 ease-night last:border-0 hover:border-flood-500/40"
                >
                  <span className="font-mono text-sm tabular-nums text-flood-500">{f.no}</span>
                  <span className="mt-0.5 text-flood-500">{f.icon}</span>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100">
                      {f.title}
                    </p>
                    <p className="mt-1 text-sm text-chalk-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <PitchDivider flag="left" />

        {/* ── OUR CULTURE — editorial statements, staggered ── */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal>
            <p className="nm-overline mb-3 text-chalk-400">The dressing room</p>
            <h2 className="nm-display-l text-chalk-100">How we play</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {culture.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06} className={i === 1 ? 'lg:mt-12' : ''}>
                <div className="group relative h-full overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/90 p-6 transition-[border-color,box-shadow] duration-300 ease-night hover:border-flood-500/50 hover:shadow-flood">
                  <span className="text-flood-500">{c.icon}</span>
                  <p className="mt-5 font-display text-2xl uppercase tracking-tight text-chalk-100">
                    {c.title}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-chalk-400">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <PitchDivider flag="right" />

        {/* ── PERKS & BENEFITS — two-column hairline ledger ── */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-4">
              <p className="nm-overline mb-3 text-flood-500">Match-day extras</p>
              <h2 className="nm-display-l text-chalk-100">
                Perks &amp;
                <br />
                benefits
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="mt-10 lg:col-span-8 lg:mt-2">
              <div className="grid gap-x-10 sm:grid-cols-2">
                {perks.map((p, i) => (
                  <div
                    key={p.title}
                    className="border-b border-pitchline/70 py-5 transition-colors duration-200 ease-night hover:border-flood-500/40"
                  >
                    <p className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100">
                      <span className="tabular-nums text-flood-500">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {p.title}
                    </p>
                    <p className="mt-1.5 pl-8 text-sm text-chalk-400">{p.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <PitchDivider flag="left" />

        {/* ── CTA — one lime action ── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="nm-display-xl max-w-4xl text-chalk-100">
              Ready to make
              <br />
              an impact?
            </h2>
            <p className="mt-5 max-w-lg text-sm text-chalk-400">
              Check out our open positions and apply today — the transfer window is open.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/careers/jobs"
                className="nm-overline nm-flood-glow inline-flex items-center gap-2 rounded-[4px] bg-flood-500 px-8 py-4 text-pitch-900 transition-transform duration-300 ease-night hover:scale-[1.02]"
              >
                <Briefcase className="h-4 w-4" />
                View all openings
              </Link>
            </div>
          </Reveal>

          {/* speculative applications */}
          <Reveal delay={0.08} className="mt-16 max-w-xl border-t border-pitchline pt-8 lg:ml-[38%]">
            <p className="nm-overline text-chalk-400">Don&apos;t see a role that fits?</p>
            <p className="mt-3 text-sm leading-relaxed text-chalk-400">
              We&apos;re always looking for talented people. Send us your resume at{' '}
              <a
                href="mailto:careers@outfyld.in"
                className="font-mono text-chalk-100 transition-colors duration-200 ease-night hover:text-flood-500"
              >
                admin@outfyld.in
              </a>
            </p>
          </Reveal>
        </section>
      </main>

      <NightFooter />
    </NightShell>
  );
}
