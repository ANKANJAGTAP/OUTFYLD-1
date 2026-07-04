'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail, Phone, MapPin, Star, Activity, ArrowRight, Zap, Shield,
  TrendingUp, Building, Globe, Plus,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightShell } from '@/components/night/NightShell';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import { CountUp } from '@/components/landing/night-match/CountUp';

// ─── FAQ row — hairline-divided, mono numbering, lime + rotating to × ──

function FaqRow({
  index,
  q,
  a,
  open,
  onToggle,
}: {
  index: number;
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-pitchline/70">
      <button
        onClick={onToggle}
        className="group flex w-full items-center gap-5 py-6 text-left"
        aria-expanded={open}
      >
        <span className="font-mono text-sm tabular-nums text-flood-500">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex-1 text-base text-chalk-100 transition-colors duration-200 ease-night group-hover:text-flood-500 sm:text-lg">
          {q}
        </span>
        <Plus
          className={`h-5 w-5 shrink-0 text-flood-500 transition-transform duration-300 ease-night ${
            open ? 'rotate-45' : ''
          }`}
        />
      </button>
      {/* height ease via the grid-rows trick */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-night ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-6 pl-10 text-sm leading-relaxed text-chalk-400">{a}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main About Page — THE CLUB MANIFESTO ────────────────────────────

export default function AboutPage() {
  const [user, setUser] = useState<{ role?: string; name?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [statsData, setStatsData] = useState({
    turfsListed: 0,
    bookingsThisMonth: 0,
    avgRating: '0',
    cities: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data?.user) setUser(data.user);
        else setUser(null);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
          setStatsData({
            turfsListed: data.stats.turfsListed,
            bookingsThisMonth: data.stats.bookingsThisMonth,
            avgRating: data.stats.avgRating,
            cities: data.stats.cities,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const isLoggedIn = !authLoading && !!user;

  const getDashboardUrl = () => {
    if (!user?.role) return '/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'owner') return '/owner/dashboard';
    return '/dashboard';
  };

  const ownerFeatures = [
    {
      title: 'Easy booking',
      desc: 'Find and reserve turf slots in seconds with smart availability and instant confirmation.',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: 'Owner dashboard',
      desc: 'Owners manage arenas, view bookings, verify payments and export reports.',
      icon: <Activity className="h-4 w-4" />,
    },
    {
      title: 'Secure payments',
      desc: 'Integrated payment gateways and optional manual proof upload for local transfers.',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      title: 'Smart pricing',
      desc: 'Set dynamic pricing, add buffers and manage peak-hour rates.',
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  const team = [
    {
      name: 'Ankan Jagtap',
      role: 'Founder & CTO',
      bio: 'Full-stack developer focused on reliable backend systems and simple UX.',
      no: '01',
    },
    {
      name: 'Naresh Adhe',
      role: 'Head of Operations',
      bio: 'Operations & partnerships — keeps turfs happy and schedules sane.',
      no: '02',
    },
    {
      name: 'Hanamant Halsangi',
      role: 'Product Designer',
      bio: 'Designs pixel-perfect admin and player experiences.',
      no: '03',
    },
  ];

  const faqs = [
    {
      q: 'How do I list my arena?',
      a: 'Owners can sign up, go to the Owner Dashboard → Add Arena, fill details and set availability. Photos and bank details can be added in Settings.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We support Razorpay and Stripe. For local transfers, players can upload payment screenshots which owners verify manually.',
    },
    {
      q: 'How does cancellation work?',
      a: 'Cancellation policy is set per arena. Refunds are processed via the payment gateway or manually by owner request.',
    },
  ];

  const company = {
    email: 'admin@outfyld.in',
    phone: '+91 7058526196',
    address: 'Sangli, Maharashtra, India',
  };

  return (
    <NightShell>
      <LandingHeader />

      {/* ── MANIFESTO OPENER — full-width Anton statement, asymmetric ── */}
      <section className="nm-grain relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <Reveal>
          <p className="nm-overline mb-6 text-flood-500">The club manifesto</p>
          <h1 className="nm-display-xl max-w-5xl text-chalk-100">
            We make playing
            <br />
            together easy
          </h1>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 lg:ml-[38%]">
          <p className="nm-body-l max-w-xl text-chalk-400">
            OutFyld helps players discover local arenas, book reliable slots, and lets turf
            owners manage availability and earnings with confidence.
          </p>
        </Reveal>
      </section>

      <PitchDivider flag="right" />

      {/* ── SEASON SO FAR — scoreboard strip ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <p className="nm-overline mb-10 text-chalk-400">The season so far</p>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-pitchline/70">
            {[
              { label: 'Turfs listed', value: statsData.turfsListed, icon: <Building className="h-3.5 w-3.5" /> },
              { label: 'Bookings / month', value: statsData.bookingsThisMonth, icon: <Activity className="h-3.5 w-3.5" /> },
              { label: 'Average rating', value: Number(statsData.avgRating), decimals: 1, icon: <Star className="h-3.5 w-3.5" /> },
              { label: 'Cities covered', value: statsData.cities, icon: <Globe className="h-3.5 w-3.5" /> },
            ].map((s, i) => (
              <div key={s.label} className={i > 0 ? 'lg:pl-10' : ''}>
                <div className="nm-scoreboard text-chalk-100">
                  <CountUp value={s.value || 0} decimals={s.decimals || 0} />
                </div>
                <p className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
                  <span className="text-flood-500">{s.icon}</span>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <PitchDivider flag="left" />

      {/* ── MANIFESTO STATEMENTS — editorial, reversing reveals ── */}
      <section className="mx-auto max-w-7xl space-y-20 px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="nm-display-l max-w-4xl text-chalk-100">
            Local pitches deserve <span className="text-flood-500">full fixtures</span>
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-chalk-400">
            Every empty slot on a good turf is a game that never happened. We connect the
            players looking for a ground with the grounds looking for players.
          </p>
        </Reveal>
        <Reveal className="lg:ml-[30%]">
          <h2 className="nm-display-l max-w-4xl text-chalk-100">
            Owners run grounds, <span className="text-flood-500">not spreadsheets</span>
          </h2>
          <div className="mt-8 max-w-2xl">
            {ownerFeatures.map((f) => (
              <div
                key={f.title}
                className="group flex items-start gap-4 border-b border-pitchline/70 py-5 transition-colors duration-200 ease-night last:border-0 hover:border-flood-500/40"
              >
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

      <PitchDivider flag="right" />

      {/* ── THE SQUAD — player cards ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <p className="nm-overline mb-3 text-flood-500">The squad</p>
          <h2 className="nm-display-l text-chalk-100">Small team, full press</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m, i) => {
            const initials = m.name.split(' ').map((n) => n[0]).slice(0, 2).join('');
            return (
              <Reveal key={m.name} delay={i * 0.06}>
                <div className="group relative overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/90 p-6 transition-[border-color,box-shadow] duration-300 ease-night hover:border-flood-500/50 hover:shadow-flood">
                  {/* jersey number */}
                  <span className="pointer-events-none absolute -right-2 -top-6 font-display text-[7rem] leading-none text-chalk-100/[0.05] transition-colors duration-300 ease-night group-hover:text-flood-500/10">
                    {m.no}
                  </span>
                  <span className="font-display text-6xl uppercase leading-none text-chalk-100">
                    {initials}
                  </span>
                  <p className="mt-5 font-display text-2xl uppercase tracking-tight text-chalk-100">
                    {m.name}
                  </p>
                  <p className="nm-overline mt-1.5 text-flood-500">{m.role}</p>
                  <p className="mt-4 text-sm leading-relaxed text-chalk-400">{m.bio}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <PitchDivider flag="left" />

      {/* ── FAQ — hairline ledger with mono numbering ── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <p className="nm-overline mb-3 text-flood-500">From the stands</p>
          <h2 className="nm-display-l text-chalk-100">Questions, answered</h2>
        </Reveal>
        <div className="mt-10">
          {faqs.map((f, i) => (
            <FaqRow
              key={i}
              index={i}
              q={f.q}
              a={f.a}
              open={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>

        {/* contact rows */}
        <div className="mt-14 grid gap-x-8 gap-y-4 sm:grid-cols-3">
          {[
            { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: company.email, href: `mailto:${company.email}` },
            { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone', value: company.phone, href: `tel:${company.phone.replace(/\s/g, '')}` },
            { icon: <MapPin className="h-3.5 w-3.5" />, label: 'HQ', value: company.address },
          ].map((c) => (
            <div key={c.label} className="border-t border-pitchline pt-4">
              <p className="nm-overline flex items-center gap-2 text-chalk-400">
                <span className="text-flood-500">{c.icon}</span>
                {c.label}
              </p>
              {c.href ? (
                <a
                  href={c.href}
                  className="mt-1.5 block font-mono text-sm text-chalk-100 transition-colors hover:text-flood-500"
                >
                  {c.value}
                </a>
              ) : (
                <p className="mt-1.5 font-mono text-sm text-chalk-100">{c.value}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <PitchDivider flag="right" />

      {/* ── CTA — one lime action ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="nm-display-xl max-w-3xl text-chalk-100">Join the club</h2>
          <p className="mt-5 max-w-lg text-sm text-chalk-400">
            Whether you&apos;re chasing a Tuesday-night five-a-side or filling your ground&apos;s
            empty hours — kick off here.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href={isLoggedIn ? getDashboardUrl() : '/auth/register'}
              className="nm-overline nm-flood-glow inline-flex items-center gap-2 rounded-[4px] bg-flood-500 px-8 py-4 text-pitch-900 transition-transform duration-300 ease-night hover:scale-[1.02]"
            >
              {isLoggedIn ? 'Open dashboard' : 'Sign up free'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="nm-overline inline-flex items-center rounded-[4px] border border-chalk-400/30 px-8 py-4 text-chalk-100 transition-colors duration-300 ease-night hover:border-flood-500 hover:text-flood-500"
            >
              Browse arenas
            </Link>
          </div>
        </Reveal>
      </section>

      <NightFooter />
    </NightShell>
  );
}
