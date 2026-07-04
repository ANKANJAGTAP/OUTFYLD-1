'use client';

import React, { useState } from 'react';
import {
  Mail, Phone, MapPin, Loader2, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightShell } from '@/components/night/NightShell';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import { NightInput, NightTextarea, nightField } from '@/components/night/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Main Contact Page — THE PRESS BOX ───────────────────────────────

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departments = ['General', 'Sales', 'Support', 'Partnerships', 'Media'];

  const company = {
    name: 'OutFyld',
    email: 'admin@outfyld.in',
    phone: '+91 7058526196',
    address: 'Sangli, Maharashtra, India',
  };

  const team = [
    { id: 1, name: 'Support team', email: 'admin@outfyld.in', phone: '+91 8830099646', hours: '9 AM – 6 PM' },
    { id: 2, name: 'Sales & partnerships', email: 'admin@outfyld.in', phone: '+91 9975585475', hours: '10 AM – 6 PM' },
    { id: 3, name: 'Technical support', email: 'admin@outfyld.in', phone: '+91 7058526196', hours: 'Mon–Fri 9 AM – 6 PM' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.message) {
      setError('Please fill name, email and message');
      return;
    }

    setSubmitting(true);
    setSubmitted(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setForm({ name: '', email: '', phone: '', subject: 'General', message: '' });
      } else {
        setError(data.error || 'Failed to send message. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  // The form "powers up": the Send button's floodlight intensifies as
  // required fields validate — the floodlight language, made functional.
  const emailLooksValid = /.+@.+\..+/.test(form.email);
  const validCount =
    (form.name.trim() ? 1 : 0) + (emailLooksValid ? 1 : 0) + (form.message.trim() ? 1 : 0);
  const power = validCount / 3;
  const powered = validCount === 3;

  const label = 'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400';

  return (
    <NightShell>
      <LandingHeader />

      {/* ── masthead ── */}
      <section className="nm-grain relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <Reveal>
          <p className="nm-overline mb-5 text-flood-500">Get in touch · replies within 24h</p>
          <h1 className="nm-display-xl text-chalk-100">The press box</h1>
        </Reveal>
      </section>

      <PitchDivider flag="right" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-5 lg:gap-14 lg:px-8">
        {/* ── the form — dark panel that powers up ── */}
        <Reveal className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="rounded-[4px] border border-pitchline bg-pitch-700/90 p-6 sm:p-8"
          >
            <p className="nm-overline mb-6 text-chalk-400">File your report</p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="pb-name">Name *</label>
                <NightInput
                  id="pb-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={label} htmlFor="pb-email">Email *</label>
                <NightInput
                  id="pb-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className={label} htmlFor="pb-phone">Phone</label>
                <NightInput
                  id="pb-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className={label}>Department</label>
                <Select
                  value={form.subject}
                  onValueChange={(v) => setForm({ ...form, subject: v })}
                >
                  <SelectTrigger className="h-[46px] rounded-[4px] border-pitchline bg-pitch-800/80 font-mono text-xs uppercase tracking-[0.12em] text-chalk-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[4px] border-pitchline font-mono text-xs uppercase tracking-[0.1em]">
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="pb-msg">Message *</label>
                <NightTextarea
                  id="pb-msg"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="What's happening on your pitch?"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-[3px] border border-red-900/60 bg-red-950/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-red-300">
                {error}
              </p>
            )}
            {submitted && (
              <p className="mt-4 flex items-center gap-2 rounded-[3px] border border-flood-500/50 bg-flood-500/[0.07] px-3 py-2.5 text-sm text-chalk-100">
                <CheckCircle2 className="h-4 w-4 text-flood-500" />
                Message sent — we&apos;ll get back within 24 hours.
              </p>
            )}

            <div className="mt-7 flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                {powered ? 'Ready to send' : `${validCount}/3 required fields`}
              </p>
              <button
                type="submit"
                disabled={submitting}
                className={`nm-overline inline-flex items-center gap-2 rounded-[4px] px-8 py-4 transition-all duration-300 ease-night active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-40 ${
                  powered
                    ? 'bg-flood-500 text-pitch-900 hover:bg-flood-600'
                    : 'bg-flood-500/60 text-pitch-900/80'
                }`}
                style={{
                  boxShadow: `0 0 ${8 + power * 32}px ${power * -4}px rgba(200,241,53,${0.1 + power * 0.4})`,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send message
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </Reveal>

        {/* ── broadcast rows ── */}
        <Reveal delay={0.08} className="lg:col-span-2">
          <p className="nm-overline mb-2 text-chalk-400">Live channels</p>
          <div>
            {[
              { label: 'Email', value: company.email, href: `mailto:${company.email}`, icon: <Mail className="h-3.5 w-3.5" /> },
              { label: 'Phone', value: company.phone, href: `tel:${company.phone.replace(/\s/g, '')}`, icon: <Phone className="h-3.5 w-3.5" /> },
              { label: 'HQ', value: company.address, icon: <MapPin className="h-3.5 w-3.5" /> },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                className={`group flex items-center gap-4 border-b border-pitchline/70 py-5 transition-colors duration-200 ease-night ${
                  c.href ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-flood-500 shadow-flood" />
                <span className="w-16 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
                  {c.label}
                </span>
                <span className="flex-1 font-mono text-sm text-chalk-100 transition-colors duration-200 ease-night group-hover:text-flood-500">
                  {c.value}
                </span>
                <span className="text-flood-500/0 transition-colors duration-200 ease-night group-hover:text-flood-500">
                  {c.icon}
                </span>
              </a>
            ))}
          </div>

          <p className="nm-overline mb-2 mt-10 text-chalk-400">Desks</p>
          <div>
            {team.map((m) => (
              <div
                key={m.id}
                className="group border-b border-pitchline/70 py-5 transition-colors duration-200 ease-night hover:border-flood-500/40"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-100">
                  {m.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-chalk-400">
                  <span>{m.phone}</span>
                  <span>{m.email}</span>
                  <span className="text-flood-500/80">{m.hours}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <PitchDivider flag="left" />

      {/* ── office map — night-filtered embed (interim treatment) ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <p className="nm-overline mb-6 text-chalk-400">Find the press box</p>
          <div className="overflow-hidden rounded-[4px] border border-pitchline">
            <iframe
              src="https://maps.google.com/maps?q=Walchand%20College%20of%20Engineering,%20Sangli&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="h-[340px] w-full"
              style={{
                border: 0,
                // Google *embed* iframes can't take styled-map JSON — this is
                // the sanctioned CSS night treatment (booking page uses the
                // real styled JS map).
                filter: 'invert(0.9) hue-rotate(160deg) saturate(0.35) brightness(0.9) contrast(0.95)',
              }}
              loading="lazy"
              title="OutFyld HQ map"
            />
          </div>
        </Reveal>
      </section>

      <NightFooter />
    </NightShell>
  );
}
