'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, Clock, Calendar, MapPin, Download, ArrowLeft,
  Activity, CreditCard, Loader2, Receipt, Sparkles, Share2,
  Copy, ArrowRight, AlertCircle, Ticket, ExternalLink,
  Phone, Mail, Building,
} from 'lucide-react';

/* ─── Info Row ──────────────────────────────────────────────────────── */
function InfoRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
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
        <p className="text-[15px] text-gray-900 font-medium mt-0.5">{value}</p>
        {subtext && (
          <p className="text-[11px] text-gray-400 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Payment Line ──────────────────────────────────────────────────── */
function PaymentLine({
  label,
  value,
  highlight,
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
      className={`flex justify-between items-center ${
        bold ? 'pt-3 border-t border-gray-200' : ''
      }`}
    >
      <span
        className={
          bold
            ? 'font-bold text-gray-900 text-lg'
            : discount
            ? 'text-green-600 text-sm'
            : 'text-gray-600 text-sm'
        }
      >
        {label}
      </span>
      <span
        className={
          bold
            ? 'font-bold text-gray-900 text-lg'
            : discount
            ? 'text-green-600 text-sm font-medium'
            : highlight
            ? 'text-gray-900 font-semibold'
            : 'text-gray-900 text-sm'
        }
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function BookingDetailsPage({
  params,
}: {
  params: { bookingId: string };
}) {
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
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <LandingHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto w-16 h-16 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              Loading booking details…
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ── Not Found ── */
  if (!booking) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <LandingHeader />
        <div className="flex-1">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 text-center">
              <h1 className="text-3xl font-extrabold text-white">
                Booking Not Found
              </h1>
              <p className="text-emerald-200 mt-3">
                We couldn&apos;t find the booking you&apos;re looking for.
              </p>
            </div>
          </div>
          <div className="max-w-md mx-auto -mt-10 relative z-10 px-4 pb-12">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No Booking Found
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                The booking ID may be incorrect or the booking may have been
                removed.
              </p>
              <Button
                onClick={() => router.push('/dashboard/player/bookings')}
                className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200 transition-all w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bookings
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const receiptId = params.bookingId.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <LandingHeader />
      <div className="flex-1 pb-16">
        {/* ─────────── HERO BANNER ─────────── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 sm:pb-28">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/player/bookings')}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl mb-6 -ml-2 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Bookings
          </Button>

          <div className="text-center">
            {isSuccess ? (
              <>
                <div className="relative mx-auto w-20 h-20 mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-300/60 animate-pulse" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-white/30" />
                </div>
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px] mb-4">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Payment Successful
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                  Booking Confirmed!
                </h1>
                <p className="text-emerald-200 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
                  Your payment has been processed successfully. A confirmation
                  email with your receipt has been sent to your registered email.
                </p>
              </>
            ) : (
              <>
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px] mb-4">
                  <Ticket className="h-3 w-3 mr-1" />
                  Booking Details
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                  Booking #{receiptId}
                </h1>
                <p className="text-emerald-200 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
                  View your complete booking details, session information, and
                  payment summary below.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Main Details ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Booking Status Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">
                      Booking Overview
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Receipt #{receiptId}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`${
                    booking.status === 'confirmed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : booking.status === 'cancelled'
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  } flex gap-1.5 items-center py-1 px-3 rounded-lg`}
                >
                  {booking.status === 'confirmed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span className="uppercase tracking-wider font-semibold text-[10px]">
                    {booking.status}
                  </span>
                </Badge>
              </div>

              <div className="p-6">
                {/* Booking ID Copy */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                      Booking ID
                    </p>
                    <p className="text-sm font-mono text-gray-700 truncate mt-0.5">
                      {params.bookingId}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBookingId}
                    className="rounded-lg h-9 px-3 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Turf + Session Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow
                    icon={<MapPin className="h-4 w-4" />}
                    iconBg="bg-teal-50"
                    iconColor="text-teal-600"
                    label="Turf"
                    value={
                      booking.turfId?.name ||
                      booking.turfName ||
                      'OutFyld Turf'
                    }
                    subtext={
                      booking.turfId?.location
                        ? `${booking.turfId.location.address || ''}, ${
                            booking.turfId.location.city || ''
                          }`
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                    label="Date"
                    value={booking.slot.date}
                    subtext={booking.slot.day}
                  />
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    label={booking.slotCount > 1 ? "Time Slots" : "Time Slot"}
                    value={booking.slotCount > 1 
                      ? `${booking.slotCount} slots booked` 
                      : `${booking.slot.startTime} – ${booking.slot.endTime}`}
                    subtext={booking.slotCount > 1 
                      ? `Total Duration: ${booking.slotCount} Hours` 
                      : "Duration: 1 Hour"}
                  />
                  <InfoRow
                    icon={<Activity className="h-4 w-4" />}
                    iconBg="bg-cyan-50"
                    iconColor="text-cyan-600"
                    label="Booked On"
                    value={new Date(booking.createdAt).toLocaleDateString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }
                    )}
                    subtext={new Date(booking.createdAt).toLocaleTimeString(
                      'en-IN',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Payment Summary
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Transaction details &amp; breakdown
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <PaymentLine
                    label="Base Amount"
                    value={`₹${booking.totalAmount}`}
                  />
                  {booking.promoDiscountAmount > 0 && (
                    <PaymentLine
                      label={`Promo Discount (${booking.promoCode})`}
                      value={`-₹${booking.promoDiscountAmount}`}
                      discount
                    />
                  )}
                  {booking.dynamicDiscountAmount > 0 && (
                    <PaymentLine
                      label="Special Discount"
                      value={`-₹${booking.dynamicDiscountAmount}`}
                      discount
                    />
                  )}
                  {booking.loyaltyDiscountAmount > 0 && (
                    <PaymentLine
                      label="Loyalty Points Used"
                      value={`-₹${booking.loyaltyDiscountAmount}`}
                      discount
                    />
                  )}
                  <PaymentLine
                    label="Total Paid"
                    value={`₹${
                      booking.totalAmount - 
                      (booking.promoDiscountAmount || 0) - 
                      (booking.dynamicDiscountAmount || 0) - 
                      (booking.loyaltyDiscountAmount || 0)
                    }`}
                    bold
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                      Payment ID
                    </span>
                    <span className="font-mono text-gray-700 text-xs">
                      {booking.razorpayPaymentId || 'N/A'}
                    </span>
                  </div>
                  <Separator className="bg-gray-200/60" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                      Method
                    </span>
                    <span className="text-gray-700 text-xs font-medium capitalize">
                      Razorpay
                    </span>
                  </div>
                  <Separator className="bg-gray-200/60" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                      Paid At
                    </span>
                    <span className="text-gray-700 text-xs">
                      {new Date(booking.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                <Button
                  onClick={handleDownloadReceipt}
                  className="w-full rounded-xl h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-200 mt-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Receipt
                </Button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-5">
            {/* Status Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Ticket className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">
                      Booking Status
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Current state of your booking
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Status Steps */}
                <div className="space-y-0">
                  {[
                    {
                      label: 'Payment Received',
                      done: true,
                      icon: CreditCard,
                    },
                    {
                      label: 'Booking Confirmed',
                      done: booking.status === 'confirmed',
                      icon: CheckCircle2,
                    },
                    {
                      label: 'Email Sent',
                      done: booking.status === 'confirmed',
                      icon: Mail,
                    },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            step.done
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <step.icon className="h-3.5 w-3.5" />
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className={`w-0.5 h-6 ${
                              step.done ? 'bg-emerald-200' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                      <div className="pt-1.5">
                        <p
                          className={`text-sm font-medium ${
                            step.done ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px]">
                      Quick Actions
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Manage your booking
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <button
                  onClick={handleDownloadReceipt}
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group w-full text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                    <Download className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-800">
                      Download Receipt
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      PDF format
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleCopyBookingId}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group w-full text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Copy className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {copied ? 'Copied!' : 'Copy Booking ID'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Share with support
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </button>

                <Link
                  href="/dashboard/player/bookings"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group w-full"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      All Bookings
                    </p>
                    <p className="text-[11px] text-gray-400">
                      View booking history
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* Need Help CTA */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-emerald-200" />
                  <span className="text-sm font-semibold">
                    Need help with this booking?
                  </span>
                </div>
                <p className="text-emerald-100 text-xs leading-relaxed mb-4">
                  Contact our support team for any queries about your booking,
                  refunds, or rescheduling.
                </p>
                <div className="space-y-2">
                  <Link href="/contact">
                    <Button
                      size="sm"
                      className="w-full bg-white/20 hover:bg-white/30 text-white rounded-xl h-9 text-xs font-semibold backdrop-blur-sm border border-white/10"
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Turf Map (if location exists) */}
            {booking.turfId?.location?.city && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-[15px]">
                        Turf Location
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {booking.turfId?.location?.address || ''},&nbsp;
                        {booking.turfId?.location?.city || ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="w-full h-44 bg-gray-100 rounded-xl overflow-hidden">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        (booking.turfId?.location?.address || '') +
                          ' ' +
                          (booking.turfId?.location?.city || '')
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
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
            )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}