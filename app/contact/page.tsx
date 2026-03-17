'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail, Phone, MapPin, Clock, CheckCircle2,
  Send, ChevronRight, Loader2, AlertCircle,
  MessageSquare, Building, ArrowRight, Sparkles,
  ExternalLink, Globe, Headphones,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

// ─── Contact Info Card ───────────────────────────────────────────────

function ContactCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  href,
  subtext,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  href?: string;
  subtext?: string;
}) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
      >
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="text-[15px] text-gray-900 font-medium hover:text-emerald-600 transition-colors mt-0.5 block"
          >
            {value}
          </a>
        ) : (
          <p className="text-[15px] text-gray-900 font-medium mt-0.5">
            {value}
          </p>
        )}
        {subtext && (
          <p className="text-[11px] text-gray-400 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}

// ─── Team Card ───────────────────────────────────────────────────────

function TeamCard({
  name,
  email,
  phone,
  hours,
  gradient,
}: {
  name: string;
  email: string;
  phone: string;
  hours: string;
  gradient: string;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300">
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <Headphones className="h-4 w-4" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{name}</h4>
          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {hours}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
        >
          <Mail className="h-3 w-3" />
          {email}
        </a>
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
        >
          <Phone className="h-3 w-3" />
          {phone}
        </a>
      </div>
    </div>
  );
}

// ─── Main Contact Page ───────────────────────────────────────────────

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
    {
      id: 1,
      name: 'Support Team',
      email: 'admin@outfyld.in',
      phone: '+91 8830099646',
      hours: '9 AM – 6 PM',
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      id: 2,
      name: 'Sales & Partnerships',
      email: 'admin@outfyld.in',
      phone: '+91 9975585475',
      hours: '10 AM – 6 PM',
      gradient: 'from-green-500 to-teal-500',
    },
    {
      id: 3,
      name: 'Technical Support',
      email: 'admin@outfyld.in',
      phone: '+91 7058526196',
      hours: 'Mon–Fri 9 AM – 6 PM',
      gradient: 'from-teal-500 to-cyan-500',
    },
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

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <LandingHeader />

      {/* ─────────── HERO BANNER ─────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 sm:pb-28 text-center">
          <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px] mb-4">
            <MessageSquare className="h-3 w-3 mr-1" />
            Get in Touch
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Contact OutFyld
          </h1>
          <p className="text-emerald-200 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
            We&apos;re here to help — choose a department or send us a message. We aim to reply within 24 hours.
          </p>
        </div>
      </div>

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Form + Contact Info ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact Form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Send className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">Send us a message</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Fill the form and we&apos;ll get back to you</p>
                </div>
              </div>

              <div className="p-6">
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="relative mx-auto w-16 h-16 mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Message Sent!</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                      Thanks for reaching out. We&apos;ll reply within 24 hours to the email you provided.
                    </p>
                    <Button
                      onClick={() => setSubmitted(false)}
                      className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-semibold shadow-lg shadow-emerald-200 transition-all"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Error */}
                    {error && (
                      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    {/* Name + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Your name"
                          required
                          className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="you@example.com"
                          required
                          className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone + Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                          Phone <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+91 9XXXXXXXXX"
                          className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                          Department
                        </label>
                        <select
                          id="subject"
                          title="Select department"
                          value={form.subject}
                          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                          className="
                            w-full h-11 px-3 rounded-xl border border-gray-200
                            bg-white text-sm text-gray-900
                            focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100
                            transition-all appearance-none cursor-pointer
                          "
                        >
                          {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="message" className="text-xs font-semibold text-gray-700">
                          Message <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[11px] text-gray-400">
                          {form.message.length}/1000
                        </span>
                      </div>
                      <Textarea
                        id="message"
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        placeholder="Tell us what's on your mind..."
                        rows={5}
                        maxLength={1000}
                        required
                        className="
                          resize-none rounded-xl border-gray-200 text-sm
                          placeholder:text-gray-400
                          focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100
                          transition-all
                        "
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="
                          flex-1 rounded-xl h-11 font-semibold
                          bg-emerald-600 hover:bg-emerald-700 text-white
                          shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300
                          disabled:opacity-50 disabled:shadow-none
                          transition-all duration-200
                        "
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setForm({ name: '', email: '', phone: '', subject: 'General', message: '' });
                          setError(null);
                          setSubmitted(false);
                        }}
                        className="rounded-xl h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <Mail className="h-4 w-4" />,
                  iconBg: 'bg-emerald-50',
                  iconColor: 'text-emerald-600',
                  label: 'Email',
                  value: company.email,
                  href: `mailto:${company.email}`,
                  subtext: 'We reply within 24 hours',
                },
                {
                  icon: <Phone className="h-4 w-4" />,
                  iconBg: 'bg-green-50',
                  iconColor: 'text-green-600',
                  label: 'Phone',
                  value: company.phone,
                  href: `tel:${company.phone}`,
                  subtext: 'Mon–Fri 9 AM – 6 PM',
                },
                {
                  icon: <MapPin className="h-4 w-4" />,
                  iconBg: 'bg-teal-50',
                  iconColor: 'text-teal-600',
                  label: 'Office',
                  value: company.address,
                  subtext: 'Headquarters',
                },
                {
                  icon: <Clock className="h-4 w-4" />,
                  iconBg: 'bg-cyan-50',
                  iconColor: 'text-cyan-600',
                  label: 'Business Hours',
                  value: 'Mon–Fri: 9 AM – 6 PM',
                  subtext: 'Sat: 10 AM – 2 PM · Sun: Closed',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <ContactCard {...item} />
                </div>
              ))}
            </div>

            {/* Support Team */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                Support Team
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {team.map((member) => (
                  <TeamCard key={member.id} {...member} />
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-5">

            {/* Quick Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Headphones className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">Quick Contact</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Need urgent help?</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Call our helpline or email us. We aim to reply within <strong className="text-gray-700">24 hours</strong> for general inquiries and <strong className="text-gray-700">2 hours</strong> for urgent support.
                </p>

                <div className="space-y-3">
                  <a
                    href={`tel:${company.phone}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Call Hotline</p>
                      <p className="text-[11px] text-emerald-600">{company.phone}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-emerald-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </a>

                  <a
                    href={`mailto:${company.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Us</p>
                      <p className="text-[11px] text-gray-400">{company.email}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </a>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">Office Location</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{company.address}</p>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="w-full h-52 bg-gray-100 rounded-xl overflow-hidden">
                  <iframe
                    src="https://maps.google.com/maps?q=Walchand%20College%20of%20Engineering,%20Sangli&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* FAQ Nudge */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-emerald-200" />
                  <span className="text-sm font-semibold">Have a question?</span>
                </div>
                <p className="text-emerald-100 text-xs leading-relaxed mb-4">
                  Check our About page for frequently asked questions before reaching out.
                </p>
                <Link href="/about">
                  <Button
                    size="sm"
                    className="w-full bg-white/20 hover:bg-white/30 text-white rounded-xl h-9 text-xs font-semibold backdrop-blur-sm border border-white/10"
                  >
                    View FAQ
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}