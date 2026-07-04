'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightFooter } from '@/components/landing/night-match/NightFooter';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { Reveal } from '@/components/landing/night-match/Reveal';
import {
  nightCard,
  nightPrimaryBtn,
  nightGhostBtn,
  Overline,
  StatusDot,
  Mono,
} from '@/components/night/ui';
import {
  CheckCircle2, Clock, Calendar, MapPin, Download, ArrowLeft,
  CreditCard, Copy, ArrowRight, Mail, Phone,
} from 'lucide-react';

/* ─── Ticket Row — a printed line on the match ticket ───────────────── */
function TicketRow({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-pitchline/50 py-3.5 last:border-b-0 sm:border-b-0 sm:py-2">
      <span className="mt-0.5 shrink-0 text-flood-500">{icon}</span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm text-chalk-100">{value}</p>
        {subtext && (
          <p className="mt-0.5 truncate font-mono text-[11px] text-chalk-400/80">{subtext}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Payment Line — mono ledger row ────────────────────────────────── */
function PaymentLine({
  label,
  value,
  discount,
  bold,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  discount?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        bold ? 'border-t border-pitchline pt-3' : ''
      }`}
    >
      <span
        className={
          bold
            ? 'nm-overline text-chalk-100'
            : discount
            ? 'font-mono text-xs uppercase tracking-[0.1em] text-flood-500'
            : 'font-mono text-xs uppercase tracking-[0.1em] text-chalk-400'
        }
      >
        {label}
      </span>
      <Mono
        className={
          bold
            ? 'text-xl text-flood-500'
            : discount
            ? 'text-sm text-flood-500'
            : 'text-sm text-chalk-100'
        }
      >
        {value}
      </Mono>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function BookingDetailsPage(
  props: {
    params: Promise<{ bookingId: string }>;
  }
) {
  const params = use(props.params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [params.bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${params.bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
      }
    } catch (err) {
      console.error('Error fetching booking details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    window.open(`/api/bookings/${params.bookingId}/receipt`, '_blank');
  };

  const handleCopyBookingId = () => {
    navigator.clipboard.writeText(params.bookingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <NightShell ambient={0.55}>
        <LandingHeader />
        <div className="flex min-h-[70vh] items-center justify-center">
          <NightLoader label="Printing your ticket…" />
        </div>
        <NightFooter />
      </NightShell>
    );
  }

  /* ── Not Found ── */
  if (!booking) {
    return (
      <NightShell ambient={0.55}>
        <LandingHeader />
        <main className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6">
          <Overline tone="lime">Match ticket</Overline>
          <h1 className="nm-display-l mt-3 text-chalk-100">Ticket not found</h1>
          <div className={`${nightCard} mt-10 p-8`}>
            <p className="nm-overline text-chalk-400">
              <StatusDot tone="red" />
              <span className="ml-2">No booking on record</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-chalk-400">
              The booking ID may be incorrect or the booking may have been
              removed. Check the reference on your confirmation email.
            </p>
            <button
              onClick={() => router.push('/dashboard/player/bookings')}
              className={`${nightGhostBtn} mt-8 w-full`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to bookings
            </button>
          </div>
        </main>
        <NightFooter />
      </NightShell>
    );
  }

  const receiptId = params.bookingId.slice(0, 8).toUpperCase();
  const statusTone: 'lime' | 'red' | 'chalk' =
    booking.status === 'confirmed'
      ? 'lime'
      : booking.status === 'cancelled'
      ? 'red'
      : 'chalk';
  const totalPaid =
    booking.totalAmount -
    (booking.promoDiscountAmount || 0) -
    (booking.dynamicDiscountAmount || 0) -
    (booking.loyaltyDiscountAmount || 0);
  const turfName = booking.turfId?.name || booking.turfName || 'OutFyld Turf';

  return (
    <NightShell ambient={0.55}>
      <LandingHeader />
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* ─────────── MASTHEAD ─────────── */}
        <Reveal>
          <button
            onClick={() => router.push('/dashboard/player/bookings')}
            className="nm-overline mb-8 inline-flex items-center gap-2 text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            <ArrowLeft className="h-4 w-4" />
            My bookings
          </button>

          {isSuccess && (
            <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[4px] border border-flood-500/50 bg-flood-500/[0.06] px-5 py-4">
              <span className="nm-overline inline-flex items-center gap-2 text-flood-500">
                <StatusDot tone="lime" />
                Payment successful — ticket issued
              </span>
              <span className="text-sm text-chalk-400">
                A confirmation email with your receipt is on its way.
              </span>
            </div>
          )}

          <Overline tone="lime">
            Match ticket · <Mono>#{receiptId}</Mono>
          </Overline>
          <h1 className="nm-display-l mt-3 max-w-4xl text-chalk-100">{turfName}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="nm-overline inline-flex items-center gap-2 text-chalk-400">
              <StatusDot tone={statusTone} />
              {booking.status}
            </span>
            {booking.turfId?.location?.city && (
              <span className="flex items-center gap-1.5 text-sm text-chalk-400">
                <MapPin className="h-3.5 w-3.5" />
                {booking.turfId.location.city}
              </span>
            )}
          </div>
        </Reveal>

        {/* ─────────── CONTENT ─────────── */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ── LEFT: THE PRINTED TICKET ── */}
          <div className="space-y-6 lg:col-span-2">
            <Reveal>
              <div className={`${nightCard} overflow-hidden bg-pitch-700/95`}>
                {/* ticket masthead */}
                <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-5 pt-6">
                  <div>
                    <p className="nm-overline mb-2 text-flood-500">Fixture details</p>
                    <h2 className="line-clamp-2 font-display text-2xl uppercase leading-none tracking-tight text-chalk-100">
                      {turfName}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-chalk-400">
                      Admit
                    </p>
                    <Mono className="text-2xl text-chalk-100">
                      {booking.slotCount > 1 ? `${booking.slotCount}H` : '1H'}
                    </Mono>
                  </div>
                </div>

                {/* booking id strip */}
                <div className="mx-6 mb-5 flex items-center gap-3 rounded-[3px] border border-pitchline/70 bg-pitch-800/60 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
                      Booking ID
                    </p>
                    <Mono className="mt-0.5 block truncate text-sm text-chalk-100">
                      {params.bookingId}
                    </Mono>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyBookingId}
                    aria-label="Copy booking ID"
                    className="shrink-0 rounded-[3px] border border-chalk-400/30 p-2 text-chalk-400 transition-[border-color,color] duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-flood-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* fixture grid */}
                <div className="grid grid-cols-1 gap-x-8 px-6 pb-6 sm:grid-cols-2 sm:gap-y-4">
                  <TicketRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="Ground"
                    value={turfName}
                    subtext={
                      booking.turfId?.location
                        ? `${booking.turfId.location.address || ''}, ${
                            booking.turfId.location.city || ''
                          }`
                        : undefined
                    }
                  />
                  <TicketRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Matchday"
                    value={booking.slot.date}
                    subtext={booking.slot.day}
                  />
                  <TicketRow
                    icon={<Clock className="h-4 w-4" />}
                    label={booking.slotCount > 1 ? 'Kick-off slots' : 'Kick-off'}
                    value={
                      booking.slotCount > 1
                        ? `${booking.slotCount} slots booked`
                        : `${booking.slot.startTime} – ${booking.slot.endTime}`
                    }
                    subtext={
                      booking.slotCount > 1
                        ? `Total duration: ${booking.slotCount} hours`
                        : 'Duration: 1 hour'
                    }
                  />
                  <TicketRow
                    icon={<CreditCard className="h-4 w-4" />}
                    label="Booked on"
                    value={new Date(booking.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    subtext={new Date(booking.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                </div>

                {/* payment ledger */}
                <div className="border-t border-pitchline/60 px-6 py-6">
                  <p className="nm-overline mb-4 text-chalk-400">Payment summary</p>
                  <div className="space-y-3">
                    <PaymentLine label="Base amount" value={`₹${booking.totalAmount}`} />
                    {booking.promoDiscountAmount > 0 && (
                      <PaymentLine
                        label={`Promo (${booking.promoCode})`}
                        value={`−₹${booking.promoDiscountAmount}`}
                        discount
                      />
                    )}
                    {booking.dynamicDiscountAmount > 0 && (
                      <PaymentLine
                        label="Special discount"
                        value={`−₹${booking.dynamicDiscountAmount}`}
                        discount
                      />
                    )}
                    {booking.loyaltyDiscountAmount > 0 && (
                      <PaymentLine
                        label="Loyalty points used"
                        value={`−₹${booking.loyaltyDiscountAmount}`}
                        discount
                      />
                    )}
                    <PaymentLine label="Total paid" value={`₹${totalPaid}`} bold />
                  </div>

                  <div className="mt-5 space-y-2.5 rounded-[3px] border border-pitchline/70 bg-pitch-800/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
                        Payment ID
                      </span>
                      <Mono className="truncate text-xs text-chalk-100">
                        {booking.razorpayPaymentId || 'N/A'}
                      </Mono>
                    </div>
                    <div className="border-t border-pitchline/50" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
                        Method
                      </span>
                      <span className="text-xs capitalize text-chalk-100">Razorpay</span>
                    </div>
                    <div className="border-t border-pitchline/50" />
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
                        Paid at
                      </span>
                      <Mono className="text-xs text-chalk-100">
                        {new Date(booking.createdAt).toLocaleString('en-IN')}
                      </Mono>
                    </div>
                  </div>
                </div>

                {/* perforation — punched notches + dashed tear */}
                <div className="relative">
                  <span className="absolute left-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-pitch-900" />
                  <span className="absolute right-[-9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-pitch-900" />
                  <div className="mx-4 border-t border-dashed border-pitchline" />
                </div>

                {/* stub footer — barcode, total, the ONE lime action */}
                <div className="flex flex-wrap items-end justify-between gap-5 px-6 py-5">
                  <div>
                    <div
                      aria-hidden
                      className="h-8 w-36 opacity-40"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, rgba(243,247,241,0.7) 0 2px, transparent 2px 5px, rgba(243,247,241,0.7) 5px 6px, transparent 6px 11px, rgba(243,247,241,0.7) 11px 12px, transparent 12px 15px)',
                      }}
                    />
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-chalk-400/70">
                      OutFyld · {receiptId}
                    </p>
                  </div>
                  <button onClick={handleDownloadReceipt} className={nightPrimaryBtn}>
                    <Download className="h-4 w-4" />
                    Download PDF receipt
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ── RIGHT: TOUCHLINE ── */}
          <div className="space-y-6">
            {/* Status timeline */}
            <Reveal delay={0.08}>
              <div className={`${nightCard} p-6`}>
                <p className="nm-overline mb-5 text-chalk-400">Ticket status</p>
                <div className="space-y-0">
                  {[
                    {
                      label: 'Payment received',
                      done: true,
                      icon: CreditCard,
                    },
                    {
                      label: 'Booking confirmed',
                      done: booking.status === 'confirmed',
                      icon: CheckCircle2,
                    },
                    {
                      label: 'Email sent',
                      done: booking.status === 'confirmed',
                      icon: Mail,
                    },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex h-6 w-6 items-center justify-center">
                          <StatusDot tone={step.done ? 'lime' : 'chalk'} />
                        </span>
                        {i < arr.length - 1 && (
                          <span
                            className={`h-7 w-px ${
                              step.done ? 'bg-flood-500/40' : 'bg-pitchline'
                            }`}
                          />
                        )}
                      </div>
                      <p
                        className={`pt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] ${
                          step.done ? 'text-chalk-100' : 'text-chalk-400/60'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Quick actions */}
            <Reveal delay={0.14}>
              <div className={`${nightCard} p-6`}>
                <p className="nm-overline mb-4 text-chalk-400">Touchline actions</p>
                <div className="space-y-2">
                  <button
                    onClick={handleDownloadReceipt}
                    className="group flex w-full items-center gap-3 rounded-[3px] border border-pitchline/70 bg-pitch-800/50 px-4 py-3 text-left transition-[border-color] duration-200 ease-night hover:border-flood-500/50"
                  >
                    <Download className="h-4 w-4 shrink-0 text-flood-500" />
                    <span className="flex-1">
                      <span className="block text-sm text-chalk-100">Download receipt</span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                        PDF format
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-chalk-400 transition-transform duration-200 ease-night group-hover:translate-x-1 group-hover:text-flood-500" />
                  </button>

                  <button
                    onClick={handleCopyBookingId}
                    className="group flex w-full items-center gap-3 rounded-[3px] border border-pitchline/70 bg-pitch-800/50 px-4 py-3 text-left transition-[border-color] duration-200 ease-night hover:border-flood-500/50"
                  >
                    <Copy className="h-4 w-4 shrink-0 text-flood-500" />
                    <span className="flex-1">
                      <span className="block text-sm text-chalk-100">
                        {copied ? 'Copied!' : 'Copy booking ID'}
                      </span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                        Share with support
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-chalk-400 transition-transform duration-200 ease-night group-hover:translate-x-1 group-hover:text-flood-500" />
                  </button>

                  <Link
                    href="/dashboard/player/bookings"
                    className="group flex w-full items-center gap-3 rounded-[3px] border border-pitchline/70 bg-pitch-800/50 px-4 py-3 text-left transition-[border-color] duration-200 ease-night hover:border-flood-500/50"
                  >
                    <Calendar className="h-4 w-4 shrink-0 text-flood-500" />
                    <span className="flex-1">
                      <span className="block text-sm text-chalk-100">All bookings</span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                        View booking history
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-chalk-400 transition-transform duration-200 ease-night group-hover:translate-x-1 group-hover:text-flood-500" />
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Support */}
            <Reveal delay={0.2}>
              <div className={`${nightCard} p-6`}>
                <p className="nm-overline mb-3 text-flood-500">Need a steward?</p>
                <p className="text-sm leading-relaxed text-chalk-400">
                  Contact our support team for any queries about your booking,
                  refunds, or rescheduling.
                </p>
                <Link href="/contact" className={`${nightGhostBtn} mt-5 w-full`}>
                  <Phone className="h-3.5 w-3.5" />
                  Contact support
                </Link>
              </div>
            </Reveal>

            {/* Turf Map (if location exists) */}
            {booking.turfId?.location?.city && (
              <Reveal delay={0.26}>
                <div className={`${nightCard} overflow-hidden`}>
                  <div className="border-b border-pitchline/60 px-6 py-4">
                    <p className="nm-overline text-chalk-400">Find the ground</p>
                    <p className="mt-1 truncate text-xs text-chalk-400/80">
                      {booking.turfId?.location?.address || ''},{' '}
                      {booking.turfId?.location?.city || ''}
                    </p>
                  </div>
                  <div className="p-3">
                    <div className="h-44 w-full overflow-hidden rounded-[3px] border border-pitchline/60">
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(
                          (booking.turfId?.location?.address || '') +
                            ' ' +
                            (booking.turfId?.location?.city || '')
                        )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: 'invert(0.9) hue-rotate(180deg) saturate(0.4)' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Turf location map"
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </main>
      <NightFooter />
    </NightShell>
  );
}
