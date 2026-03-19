'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail, Phone, MapPin, Users, Star, Clock, Activity,
  Loader2, ChevronRight, ArrowRight, Sparkles, Target,
  Zap, Shield, TrendingUp, MessageSquare, Building,
  Quote, HelpCircle, CheckCircle2, Globe,
} from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

// ─── Stat Card ───────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number | React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : value}
      </div>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-[15px]">{title}</h4>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Team Card ───────────────────────────────────────────────────────

function TeamCard({
  name,
  role,
  bio,
  gradient,
}: {
  name: string;
  role: string;
  bio: string;
  gradient: string;
}) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('');

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 text-center">
      <div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg font-bold shadow-lg mx-auto group-hover:scale-110 transition-transform duration-300`}
      >
        {initials}
      </div>
      <h4 className="font-semibold text-gray-900 text-[15px] mt-4">{name}</h4>
      <p className="text-[11px] text-emerald-600 font-medium uppercase tracking-wider mt-1">
        {role}
      </p>
      <p className="text-sm text-gray-500 mt-3 leading-relaxed">{bio}</p>
    </div>
  );
}

// ─── Testimonial Card ────────────────────────────────────────────────

function TestimonialCard({
  quote,
  author,
  role,
  rating,
}: {
  quote: string;
  author: string;
  role?: string;
  rating: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Quote className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">{rating}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 pt-4 border-t border-gray-50">
        <p className="text-sm font-semibold text-gray-900">{author}</p>
        {role && <p className="text-[11px] text-gray-400 mt-0.5">{role}</p>}
      </div>
    </div>
  );
}

// ─── FAQ Card ────────────────────────────────────────────────────────

function FAQCard({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-semibold text-sm group-hover:bg-emerald-100 transition-colors">
          {index + 1}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-[15px]">{question}</h4>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Info Card ───────────────────────────────────────────────

function ContactInfoCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}
      >
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
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
          <p className="text-[15px] text-gray-900 font-medium mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main About Page ─────────────────────────────────────────────────

export default function AboutPage() {
  // ── Auth state (no next-auth dependency) ──
  const [user, setUser] = useState<{ role?: string; name?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [statsData, setStatsData] = useState({
    turfsListed: 0,
    bookingsThisMonth: 0,
    avgRating: '0',
    cities: 0,
  });
  const [loading, setLoading] = useState(true);

  // ── Check auth via API ──
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ── Fetch stats ──
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
      } finally {
        setLoading(false);
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

  const stats = [
    {
      id: 1,
      label: 'Turfs Listed',
      value: statsData.turfsListed,
      icon: <Building className="h-4 w-4" />,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      id: 2,
      label: 'Bookings / Month',
      value: statsData.bookingsThisMonth,
      icon: <Activity className="h-4 w-4" />,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      id: 3,
      label: 'Average Rating',
      value: `${statsData.avgRating} ⭐`,
      icon: <Star className="h-4 w-4" />,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      id: 4,
      label: 'Cities Covered',
      value: statsData.cities,
      icon: <Globe className="h-4 w-4" />,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ];

  const features = [
    {
      id: 1,
      title: 'Easy Booking',
      desc: 'Find and reserve turf slots in seconds with smart availability and instant confirmation.',
      icon: <Zap className="h-5 w-5" />,
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      id: 2,
      title: 'Owner Dashboard',
      desc: 'Owners can manage arenas, view bookings, verify payments and export reports.',
      icon: <Activity className="h-5 w-5" />,
      gradient: 'from-green-500 to-teal-500',
    },
    {
      id: 3,
      title: 'Secure Payments',
      desc: 'Integrated payment gateways and optional manual proof upload for local transfers.',
      icon: <Shield className="h-5 w-5" />,
      gradient: 'from-teal-500 to-cyan-500',
    },
    {
      id: 4,
      title: 'Smart Pricing',
      desc: 'Set dynamic pricing, add buffers and manage peak-hour rates.',
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: 'from-cyan-500 to-blue-500',
    },
  ];

  const team = [
    {
      id: 1,
      name: 'Ankan Jagtap',
      role: 'Founder & CTO',
      bio: 'Full‑stack developer focused on reliable backend systems and simple UX.',
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      id: 2,
      name: 'Naresh Adhe',
      role: 'Head of Operations',
      bio: 'Operations & partnerships — keeps turfs happy and schedules sane.',
      gradient: 'from-green-500 to-teal-500',
    },
    {
      id: 3,
      name: 'Hanamant Halsangi',
      role: 'Product Designer',
      bio: 'Designs pixel-perfect admin and player experiences.',
      gradient: 'from-teal-500 to-cyan-500',
    },
  ];

  const testimonials = [
    {
      quote: 'Found my regular spot in 2 minutes — booking is so simple and the owners respond fast. Highly recommend!',
      author: 'S. Kulkarni',
      role: 'Regular Player',
      rating: 4.8,
    },
    {
      quote: 'Managing multiple turfs used to be a nightmare. The owner dashboard saved us time and doubled our repeat bookings.',
      author: 'R. Desai',
      role: 'Arena Owner',
      rating: 4.6,
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
            <Sparkles className="h-3 w-3 mr-1" />
            About OutFyld
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            We make playing together easy
          </h1>
          <p className="text-emerald-200 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
            OutFyld helps players discover local arenas, book reliable slots, and lets turf owners manage availability and earnings with confidence.
          </p>

          {/* ── Hero Buttons (auth-aware) ── */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            {authLoading ? (
              <Button
                size="lg"
                disabled
                className="bg-white/50 text-emerald-700 rounded-xl h-12 px-6 font-semibold"
              >
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </Button>
            ) : isLoggedIn ? (
              <Link href={getDashboardUrl()}>
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl h-12 px-6 font-semibold shadow-lg shadow-emerald-900/20 transition-all"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl h-12 px-6 font-semibold shadow-lg shadow-emerald-900/20 transition-all"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}

            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-12 px-6 font-semibold backdrop-blur-sm transition-all"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <StatCard
              key={s.id}
              icon={s.icon}
              iconBg={s.iconBg}
              iconColor={s.iconColor}
              label={s.label}
              value={s.value}
              loading={loading}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Main Content ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features Section */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">What we offer</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((f) => (
                  <FeatureCard
                    key={f.id}
                    icon={f.icon}
                    title={f.title}
                    description={f.desc}
                    gradient={f.gradient}
                  />
                ))}
              </div>
            </div>

            {/* Team Section */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Meet the team</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {team.map((member) => (
                  <TeamCard key={member.id} {...member} />
                ))}
              </div>
            </div>

            {/* Testimonials Section */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">What users say</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {testimonials.map((t, i) => (
                  <TestimonialCard key={i} {...t} />
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Frequently asked</h3>
              </div>
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <FAQCard key={i} question={f.q} answer={f.a} index={i} />
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-5">
            {/* Mission Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Target className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">Our Mission</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Make local sports accessible</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  We believe in creating a simple platform where players find great places to play, and owners can grow their business without the headache of manual bookings and calls.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: <Users className="h-4 w-4" />, text: 'Community-first approach' },
                    { icon: <Activity className="h-4 w-4" />, text: 'Fast & dependable booking' },
                    { icon: <Clock className="h-4 w-4" />, text: '24/7 support for owners' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">Contact us</h3>
                  <p className="text-xs text-gray-400 mt-0.5">We&apos;re here to help</p>
                </div>
              </div>
              <div className="p-3">
                <ContactInfoCard
                  icon={<Mail className="h-4 w-4" />}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                  label="Email"
                  value={company.email}
                  href={`mailto:${company.email}`}
                />
                <Separator className="my-1" />
                <ContactInfoCard
                  icon={<Phone className="h-4 w-4" />}
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                  label="Phone"
                  value={company.phone}
                  href={`tel:${company.phone}`}
                />
                <Separator className="my-1" />
                <ContactInfoCard
                  icon={<MapPin className="h-4 w-4" />}
                  iconBg="bg-teal-50"
                  iconColor="text-teal-600"
                  label="Office"
                  value={company.address}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}