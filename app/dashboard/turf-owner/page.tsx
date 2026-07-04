"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";

// Dynamic import — LocationPickerMap bundles @react-google-maps/api (7.4MB)
// Map is on step 4, not visible on initial load
const LocationPickerMap = dynamic(
  () => import("@/components/owner/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-[4px] border border-pitchline bg-pitch-800/60">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-chalk-400">
          Loading map…
        </p>
      </div>
    ),
  }
);
import ProtectedRoute from "@/components/ProtectedRoute";
import { NightShell } from "@/components/night/NightShell";
import { NightLoader } from "@/components/night/NightLoader";
import {
  nightCard,
  nightGhostBtn,
  nightPrimaryBtn,
  Mono,
  NightInput,
  StatusDot,
} from "@/components/night/ui";
import { CountUp } from "@/components/landing/night-match/CountUp";
import { Reveal } from "@/components/landing/night-match/Reveal";
import { PitchDivider } from "@/components/landing/night-match/PitchDivider";
import { ScoreboardSetPiece } from "@/components/landing/night-match/ScoreboardSetPiece";
import {
  AlertCircle,
  Save,
  User,
  IndianRupee,
  MapPin,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  CreditCard,
  Layers,
  Settings,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Import our custom components
import { TurfImagesUploader } from "@/components/owner/TurfImagesUploader";
import { BannerImageUploader } from "@/components/owner/BannerImageUploader";
import { SportsSelection } from "@/components/owner/SportsSelection";
import { AmenitiesSelector } from "@/components/owner/AmenitiesSelector";
import { AboutSection } from "@/components/owner/AboutSection";
import { SlotManager } from "@/components/owner/SlotManager";

interface CloudinaryImage {
  url: string;
  public_id: string;
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface OwnerFormData {
  businessName: string;
  ownerName: string;
  phone: string;
  turfImages: CloudinaryImage[];
  bannerImage?: string;
  sportsOffered: string[];
  customSport: string;
  amenities: string[];
  about: string;
  availableSlots: TimeSlot[];
  pricing: number;
  maxDiscount: number;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  geoLocation?: {
    type: "Point";
    coordinates: [number, number];
  };
  locationMetadata?: {
    accuracy: string;
    accuracyRadius: number;
    isOwnerVerified: boolean;
    geocodedBy: string;
    geocodedAt: Date;
  };
}

/* ─── Field label — mono caps, lime asterisk ─────────────────────── */
function FieldLabel({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400"
    >
      {children} {required && <span className="text-flood-500">*</span>}
      {hint && (
        <span className="ml-1 normal-case tracking-normal text-chalk-400/60">
          ({hint})
        </span>
      )}
    </label>
  );
}

/* ─── Tab Step Row — fixture-row treatment ───────────────────────── */
function TabStepButton({
  step,
  label,
  icon: Icon,
  active,
  completed,
  onClick,
}: {
  step: number;
  label: string;
  icon: any;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-4 border-b border-pitchline/60 px-5 py-4 text-left transition-colors duration-200 ease-night last:border-0 ${
        active ? "bg-white/[0.04]" : "hover:bg-white/[0.03]"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[2px] bg-flood-500 shadow-flood"
        />
      )}
      <span
        className={`w-7 shrink-0 font-mono text-xl leading-none tabular-nums ${
          active
            ? "text-flood-500"
            : completed
            ? "text-chalk-100"
            : "text-chalk-400/50"
        }`}
      >
        {String(step).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate font-mono text-[11px] uppercase tracking-[0.14em] ${
            active ? "text-chalk-100" : "text-chalk-400"
          }`}
        >
          {label}
        </span>
        <span className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
          <StatusDot tone={completed || active ? "lime" : "chalk"} />
          {completed ? "Complete" : active ? "On the board" : "Up next"}
        </span>
      </span>
      <Icon
        className={`h-4 w-4 shrink-0 transition-colors duration-200 ease-night ${
          active ? "text-flood-500" : "text-chalk-400/50 group-hover:text-chalk-400"
        }`}
      />
    </button>
  );
}

/* ─── Section Card ──────────────────────────────────────────────── */
function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${nightCard} overflow-hidden`}>
      <div className="flex items-center gap-3 border-b border-pitchline/60 px-6 py-4">
        <Icon className="h-4 w-4 shrink-0 text-flood-500" />
        <div className="min-w-0">
          <p className="nm-overline text-chalk-100">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-chalk-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

/* ─── Status Screen ──────────────────────────────────────────────── */
function StatusScreen({
  tone,
  status,
  title,
  description,
  detail,
  actions,
}: {
  tone: "lime" | "chalk" | "red";
  status: string;
  title: string;
  description: string;
  detail?: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <NightShell ambient={0.45}>
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16 sm:px-6">
        <p className="nm-overline mb-4 text-flood-500">The dugout</p>
        <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight text-chalk-100 sm:text-6xl">
          {title}
        </h1>
        <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">
          <StatusDot tone={tone} />
          {status}
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-chalk-400">
          {description}
        </p>
        {detail && <div className="mt-6 max-w-md">{detail}</div>}
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">{actions}</div>
      </div>
    </NightShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  MAIN DASHBOARD
 * ═══════════════════════════════════════════════════════════════════ */
function TurfOwnerDashboard() {
  const { user, firebaseUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("business-info");
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasSubscription: boolean;
    status: string;
    rejectionReason?: string;
    plan?: string;
  } | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const [formData, setFormData] = useState<OwnerFormData>({
    businessName: "",
    ownerName: "",
    phone: "",
    turfImages: [],
    sportsOffered: [],
    customSport: "",
    amenities: [],
    about: "",
    availableSlots: [],
    pricing: 0,
    maxDiscount: 0,
    location: {
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
    geoLocation: undefined,
    locationMetadata: undefined,
  });

  const tabs = [
    { id: "business-info", label: "Business Info", icon: User, step: 1 },
    { id: "turf-details", label: "Arena Details", icon: ImageIcon, step: 2 },
    { id: "scheduling", label: "Scheduling", icon: Clock, step: 3 },
    { id: "location", label: "Location", icon: MapPin, step: 4 },
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`/api/owner/subscription?uid=${user.uid}`);
        const data = await response.json();
        if (data.success) {
          setSubscriptionStatus({
            hasSubscription: !!data.subscription.subscriptionPlan,
            status: data.subscription.verificationStatus || "none",
            rejectionReason: data.subscription.rejectionReason,
            plan: data.subscription.subscriptionPlan,
          });
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      } finally {
        setCheckingSubscription(false);
      }
    };
    if (user) checkSubscription();
  }, [user]);

  // Load existing owner data on component mount
  useEffect(() => {
    const loadOwnerData = async () => {
      if (!firebaseUser) return;
      setLoading(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        const urlParams = new URLSearchParams(window.location.search);
        const turfId = urlParams.get("turfId");

        if (turfId) {
          setIsEditMode(true);
          const turfResponse = await fetch(`/api/turfs/owner/${turfId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (turfResponse.ok) {
            const turfData = await turfResponse.json();
            const turf = turfData.turf;
            setFormData({
              businessName: turf.name || turf.contactInfo?.businessName || "",
              ownerName: turf.contactInfo?.ownerName || "",
              phone: turf.contactInfo?.phone || "",
              turfImages: turf.images || [],
              bannerImage: turf.bannerImage || "",
              sportsOffered: turf.sportsOffered || [],
              customSport: turf.customSport || "",
              amenities: turf.amenities || [],
              about: turf.description || "",
              availableSlots: turf.availableSlots || [],
              pricing: turf.pricing || 0,
              maxDiscount: turf.maxDiscount || 0,
              location: {
                address: turf.location?.address || "",
                city: turf.location?.city || "",
                state: turf.location?.state || "",
                pincode: turf.location?.pincode || "",
              },
              geoLocation: turf.geoLocation || undefined,
              locationMetadata: turf.locationMetadata || undefined,
            });
          }
        } else {
          const userResponse = await fetch("/api/owner/update", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const ownerData = userData.user;
            setFormData({
              businessName: ownerData.businessName || "",
              ownerName: ownerData.ownerName || user?.name || "",
              phone: ownerData.phone || "",
              turfImages: ownerData.turfImages || [],
              bannerImage: ownerData.bannerImage || "",
              sportsOffered: ownerData.sportsOffered || [],
              customSport: ownerData.customSport || "",
              amenities: ownerData.amenities || [],
              about: ownerData.about || "",
              availableSlots: ownerData.availableSlots || [],
              pricing: ownerData.pricing || 0,
              maxDiscount: ownerData.maxDiscount || 0,
              location: {
                address: ownerData.location?.address || "",
                city: ownerData.location?.city || "",
                state: ownerData.location?.state || "",
                pincode: ownerData.location?.pincode || "",
              },
            });
          }
        }
      } catch (error) {
        console.error("Error loading owner data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadOwnerData();
  }, [firebaseUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const validateForm = (): boolean => {
    setError(null);
    setSuccess(null);

    if (!formData.businessName.trim()) {
      setError("Business name is required");
      setActiveTab("business-info");
      return false;
    }
    if (!formData.ownerName.trim()) {
      setError("Owner name is required");
      setActiveTab("business-info");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      setActiveTab("business-info");
      return false;
    }
    if (formData.turfImages.length === 0) {
      setError("At least one arena image is required");
      setActiveTab("turf-details");
      return false;
    }
    if (formData.sportsOffered.length === 0) {
      setError("At least one sport must be selected");
      setActiveTab("turf-details");
      return false;
    }
    if (
      formData.sportsOffered.includes("Other") &&
      !formData.customSport.trim()
    ) {
      setError('Custom sport name is required when "Other" is selected');
      setActiveTab("turf-details");
      return false;
    }
    if (!formData.about.trim()) {
      setError("About section is required");
      setActiveTab("turf-details");
      return false;
    }
    if (formData.availableSlots.length === 0) {
      setError("At least one time slot is required");
      setActiveTab("scheduling");
      return false;
    }
    if (!formData.pricing || formData.pricing <= 0) {
      setError("Valid pricing is required");
      setActiveTab("business-info");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!firebaseUser) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const idToken = await firebaseUser.getIdToken();

      const userResponse = await fetch("/api/owner/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!userResponse.ok) {
        const userData = await userResponse.json();
        setError(userData.error || "Failed to update user profile");
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const turfId = urlParams.get("turfId");

      const turfData = {
        name: formData.businessName || "My Turf",
        ownerName: formData.ownerName,
        phone: formData.phone,
        description: formData.about,
        images: formData.turfImages,
        bannerImage: formData.bannerImage,
        sportsOffered: formData.sportsOffered,
        customSport: formData.customSport,
        amenities: formData.amenities,
        availableSlots: formData.availableSlots,
        pricing: formData.pricing,
        maxDiscount: formData.maxDiscount,
        location: formData.location,
        geoLocation: formData.geoLocation,
        locationMetadata: formData.locationMetadata,
        ...(turfId && { turfId }),
      };

      const turfMethod = turfId ? "PUT" : "POST";

      const turfResponse = await fetch("/api/turfs/manage", {
        method: turfMethod,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(turfData),
      });

      if (!turfResponse.ok) {
        const turfError = await turfResponse.json();
        setError(turfError.error || "Failed to save arena");
        return;
      }

      setSuccess(
        turfId ? "Arena updated successfully!" : "Arena created successfully!"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        window.location.href = "/owner/dashboard";
      }, 1500);
    } catch (error) {
      console.error("Error saving owner data:", error);
      setError("An error occurred while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ── */
  if (loading || checkingSubscription) {
    return (
      <NightShell ambient={0.45}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Opening the dugout…" />
        </div>
      </NightShell>
    );
  }

  /* ── No Subscription ── */
  if (!subscriptionStatus?.hasSubscription) {
    return (
      <StatusScreen
        tone="chalk"
        status="Season pass required"
        title="No season pass on file"
        description="You need a subscription plan before adding arenas. Pick a season pass and come back to chalk up your ground."
        actions={
          <>
            <Link href="/owner/subscription" className={nightPrimaryBtn}>
              <CreditCard className="h-4 w-4" />
              Choose plan
            </Link>
            <Link href="/owner/dashboard" className={nightGhostBtn}>
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </>
        }
      />
    );
  }

  /* ── Pending ── */
  if (subscriptionStatus?.status === "pending") {
    return (
      <StatusScreen
        tone="chalk"
        status="Under review"
        title="Waiting on the officials"
        description="Your payment is being verified by our admin team. You will be waved through as soon as the check clears."
        actions={
          <Link href="/owner/dashboard" className={nightGhostBtn}>
            <ArrowLeft className="h-4 w-4" />
            Go to dashboard
          </Link>
        }
      />
    );
  }

  /* ── Rejected ── */
  if (subscriptionStatus?.status === "rejected") {
    return (
      <StatusScreen
        tone="red"
        status="Application rejected"
        title="Application not approved"
        description="Your subscription application was not approved. Review the reason below and reapply."
        detail={
          <div className="rounded-[4px] border border-red-700/40 bg-red-950/30 p-4 text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-400">
              Reason
            </p>
            <p className="mt-1.5 text-sm text-red-300">
              {subscriptionStatus.rejectionReason || "No reason provided"}
            </p>
          </div>
        }
        actions={
          <>
            <Link href="/owner/subscription" className={nightPrimaryBtn}>
              Reapply
            </Link>
            <Link href="/owner/dashboard" className={nightGhostBtn}>
              Dashboard
            </Link>
          </>
        }
      />
    );
  }

  /* ── Team sheet numbers — live as the owner fills the form ── */
  const sheetStats = [
    { label: "PRICE / HR (RS)", value: formData.pricing, prefix: "₹" },
    { label: "SLOTS / WEEK", value: formData.availableSlots.length },
    { label: "SPORTS", value: formData.sportsOffered.length },
    { label: "PHOTOS", value: formData.turfImages.length },
  ];

  /* ═══════════════════════════════════════════
   *  MAIN FORM VIEW
   * ═══════════════════════════════════════════ */
  return (
    <NightShell ambient={0.45}>
      {/* ─────────── HEADER — restyled in place ─────────── */}
      <header className="sticky top-0 z-40 border-b border-pitchline bg-pitch-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/owner/dashboard"
            className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-night group-hover:-translate-x-1" />
            Back to dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight text-chalk-100">{user?.name}</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-flood-500">
                Arena owner
              </p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="rounded-[4px] border border-chalk-400/30 p-2 text-chalk-400 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────── TITLE BAND — asymmetric, oversized ─────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <Reveal>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="nm-overline mb-3 text-flood-500">The dugout</p>
              <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight text-chalk-100 sm:text-6xl lg:text-7xl">
                {isEditMode ? (
                  <>
                    Update
                    <br />
                    the arena
                  </>
                ) : (
                  <>
                    Chalk up
                    <br />
                    your arena
                  </>
                )}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-chalk-400">
                {isEditMode
                  ? "Update your arena details, images, scheduling, and location information."
                  : "Set up your arena facility with all the details players need to find and book your venue."}
              </p>
            </div>

            {/* step counter + clickable progress ticks */}
            <div className="shrink-0 lg:text-right">
              <p className="font-mono text-5xl leading-none tabular-nums tracking-tight text-chalk-100">
                {String(currentTabIndex + 1).padStart(2, "0")}
                <span className="text-chalk-400/40">
                  /{String(tabs.length).padStart(2, "0")}
                </span>
              </p>
              <p className="nm-caption mt-2 text-chalk-400">
                {tabs[currentTabIndex]?.label}
              </p>
              <div className="mt-4 flex gap-1.5 lg:justify-end">
                {tabs.map((tab, i) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    aria-label={`Step ${tab.step}: ${tab.label}`}
                    className={`h-1 w-8 rounded-[2px] transition-colors duration-200 ease-night ${
                      i === currentTabIndex
                        ? "bg-flood-500 shadow-flood"
                        : i < currentTabIndex
                        ? "bg-flood-500/40"
                        : "bg-pitchline hover:bg-chalk-400/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─────────── TEAM SHEET — 3D stadium scoreboard, live numbers ─────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <p className="nm-overline text-chalk-400">
          Team sheet — updates as you build
        </p>
        <div className="mt-4">
          <ScoreboardSetPiece
            cells={[
              { label: "PRICE / HR (RS)", value: formData.pricing },
              { label: "SLOTS / WEEK", value: formData.availableSlots.length },
              { label: "SPORTS", value: formData.sportsOffered.length },
              { label: "PHOTOS", value: formData.turfImages.length },
            ]}
            srText={`Arena sheet so far: ₹${formData.pricing.toLocaleString(
              "en-IN"
            )} per hour, ${formData.availableSlots.length} weekly slots, ${
              formData.sportsOffered.length
            } sports offered, ${formData.turfImages.length} photos uploaded.`}
          >
            {/* flat fallback — same numbers, asymmetric: price leads */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-pitchline bg-pitchline/60 sm:grid-cols-[1.7fr_1fr_1fr_1fr]">
              {sheetStats.map((s, i) => (
                <div
                  key={s.label}
                  className={`bg-pitch-700/90 px-5 py-6 ${
                    i === 0 ? "sm:px-8 sm:py-8" : ""
                  }`}
                >
                  <div
                    className={`font-mono tabular-nums tracking-tight text-chalk-100 ${
                      i === 0 ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
                    }`}
                  >
                    <CountUp value={s.value} prefix={s.prefix || ""} />
                  </div>
                  <p className="nm-caption mt-2 text-chalk-400">{s.label}</p>
                </div>
              ))}
            </div>
          </ScoreboardSetPiece>
        </div>
      </section>

      <PitchDivider flag="left" />

      {/* ─────────── CONTENT ─────────── */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-[4px] border border-red-700/40 bg-red-950/30 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-[4px] border border-flood-500/50 bg-flood-500/10 p-4 shadow-flood">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-flood-500" />
            <p className="text-sm text-chalk-100">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* ── LEFT: Tab Navigation (sidebar) ── */}
          <div className="space-y-6 lg:col-span-1">
            {/* Steps — fixture rows */}
            <Reveal>
              <div className="overflow-hidden rounded-[4px] border border-pitchline bg-pitch-700/80">
                <div className="flex items-center justify-between border-b border-pitchline/60 px-5 py-4">
                  <p className="nm-overline text-chalk-400">Match prep</p>
                  <Mono className="text-[10px] text-chalk-400">
                    {currentTabIndex + 1}/{tabs.length}
                  </Mono>
                </div>
                <div>
                  {tabs.map((tab, i) => (
                    <TabStepButton
                      key={tab.id}
                      step={tab.step}
                      label={tab.label}
                      icon={tab.icon}
                      active={tab.id === activeTab}
                      completed={i < currentTabIndex}
                      onClick={() => setActiveTab(tab.id)}
                    />
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Touchline notes */}
            <Reveal delay={0.08}>
              <div className="rounded-[4px] border border-pitchline bg-pitch-700/60">
                <div className="border-b border-pitchline/60 px-5 py-4">
                  <p className="nm-overline flex items-center gap-2 text-flood-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    Touchline notes
                  </p>
                </div>
                <ul className="space-y-3 px-5 py-4">
                  {[
                    "Add high-quality images to attract more players",
                    "Set competitive pricing for your area",
                    "Mark your exact location on the map",
                    "Add all available time slots",
                  ].map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2.5 text-xs leading-relaxed text-chalk-400"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 h-1 w-1 flex-shrink-0 bg-flood-500"
                      />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* ── RIGHT: Form Content ── */}
          <div className="space-y-5 lg:col-span-3">
            {/* ═══ TAB: Business Info ═══ */}
            {activeTab === "business-info" && (
              <>
                <SectionCard
                  icon={User}
                  title="Basic information"
                  subtitle="Your business and contact details"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <FieldLabel htmlFor="ownerName" required>
                        Owner name
                      </FieldLabel>
                      <NightInput
                        id="ownerName"
                        placeholder="Your full name"
                        value={formData.ownerName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ownerName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="businessName" required>
                        Business name
                      </FieldLabel>
                      <NightInput
                        id="businessName"
                        placeholder="Your turf business name"
                        value={formData.businessName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            businessName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="phone" required>
                        Phone number
                      </FieldLabel>
                      <NightInput
                        id="phone"
                        placeholder="+91 9XXXXXXXXX"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  icon={IndianRupee}
                  title="Pricing"
                  subtitle="Set your hourly rates and discount limits"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel htmlFor="pricing" required>
                        Price per hour (₹)
                      </FieldLabel>
                      <NightInput
                        id="pricing"
                        type="number"
                        placeholder="Enter hourly rate"
                        value={formData.pricing || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pricing: Number(e.target.value),
                          })
                        }
                        className="font-mono tabular-nums"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel htmlFor="maxDiscount" hint="Dynamic pricing">
                        Max discount %
                      </FieldLabel>
                      <NightInput
                        id="maxDiscount"
                        type="number"
                        placeholder="e.g. 20"
                        min={0}
                        max={100}
                        value={formData.maxDiscount || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDiscount: Math.min(
                              100,
                              Math.max(0, Number(e.target.value))
                            ),
                          })
                        }
                        className="font-mono tabular-nums"
                      />
                      <p className="text-[11px] leading-relaxed text-chalk-400/70">
                        Maximum discount (0–100%) the platform can offer based
                        on demand.
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  icon={CreditCard}
                  title="Bank details & payouts"
                  subtitle="Configure where your payouts will be sent"
                >
                  <Link
                    href="/owner/bank-details"
                    className="group flex items-center gap-4 rounded-[4px] border border-pitchline bg-pitch-800/60 px-5 py-4 transition-colors duration-200 ease-night hover:border-flood-500/40 hover:bg-white/[0.03]"
                  >
                    <CreditCard className="h-4 w-4 flex-shrink-0 text-flood-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-chalk-100">
                        Manage bank details
                      </span>
                      <span className="mt-0.5 block text-xs text-chalk-400">
                        Add or update your club treasury account
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-flood-500 transition-transform duration-200 ease-night group-hover:translate-x-1" />
                  </Link>
                </SectionCard>

                {/* Navigation */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveTab("turf-details")}
                    className={nightGhostBtn}
                  >
                    Next: Arena details
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* ═══ TAB: Arena Details ═══ */}
            {activeTab === "turf-details" && (
              <>
                <SectionCard
                  icon={ImageIcon}
                  title="Arena images"
                  subtitle="Upload photos of your arena facility"
                >
                  <TurfImagesUploader
                    value={formData.turfImages}
                    onChange={(images) =>
                      setFormData({ ...formData, turfImages: images })
                    }
                  />
                </SectionCard>

                {subscriptionStatus?.plan === "pro" && (
                  <SectionCard
                    icon={Sparkles}
                    title="Premium banner image"
                    subtitle="Pro plan exclusive — showcase your turf with a banner"
                  >
                    <BannerImageUploader
                      value={formData.bannerImage}
                      onChange={(url) =>
                        setFormData({ ...formData, bannerImage: url })
                      }
                    />
                  </SectionCard>
                )}

                <SectionCard
                  icon={Layers}
                  title="Sports & amenities"
                  subtitle="Select the sports and facilities you offer"
                >
                  <div className="space-y-6">
                    <SportsSelection
                      value={formData.sportsOffered}
                      customSport={formData.customSport}
                      onSportsChange={(sports) =>
                        setFormData((prev) => ({
                          ...prev,
                          sportsOffered: sports,
                        }))
                      }
                      onCustomSportChange={(sport) =>
                        setFormData((prev) => ({
                          ...prev,
                          customSport: sport,
                        }))
                      }
                    />
                    <div aria-hidden className="h-px bg-pitchline" />
                    <AmenitiesSelector
                      value={formData.amenities}
                      onChange={(amenities) =>
                        setFormData({ ...formData, amenities })
                      }
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  icon={Settings}
                  title="About your arena"
                  subtitle="Describe your turf to attract players"
                >
                  <AboutSection
                    value={formData.about}
                    onChange={(about) => setFormData({ ...formData, about })}
                  />
                </SectionCard>

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActiveTab("business-info")}
                    className={nightGhostBtn}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setActiveTab("scheduling")}
                    className={nightGhostBtn}
                  >
                    Next: Scheduling
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* ═══ TAB: Scheduling ═══ */}
            {activeTab === "scheduling" && (
              <>
                <SectionCard
                  icon={Clock}
                  title="Time slot management"
                  subtitle="Configure your available booking slots"
                >
                  <SlotManager
                    value={formData.availableSlots}
                    onChange={(slots) =>
                      setFormData({ ...formData, availableSlots: slots })
                    }
                  />
                </SectionCard>

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActiveTab("turf-details")}
                    className={nightGhostBtn}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setActiveTab("location")}
                    className={nightGhostBtn}
                  >
                    Next: Location
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* ═══ TAB: Location ═══ */}
            {activeTab === "location" && (
              <>
                <SectionCard
                  icon={MapPin}
                  title="Location details"
                  subtitle="Enter your turf address and pin exact location"
                >
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <FieldLabel htmlFor="address">
                        Address / colony / area
                      </FieldLabel>
                      <NightInput
                        id="address"
                        placeholder="e.g., Koramangala 5th Block, Near Sony Signal"
                        value={formData.location?.address || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              address: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <FieldLabel htmlFor="city" required>
                          City
                        </FieldLabel>
                        <NightInput
                          id="city"
                          placeholder="City"
                          value={formData.location?.city || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: {
                                ...formData.location,
                                city: e.target.value,
                              },
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <FieldLabel htmlFor="state">State</FieldLabel>
                        <NightInput
                          id="state"
                          placeholder="State"
                          value={formData.location?.state || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: {
                                ...formData.location,
                                state: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
                        <NightInput
                          id="pincode"
                          placeholder="Pincode"
                          value={formData.location?.pincode || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: {
                                ...formData.location,
                                pincode: e.target.value,
                              },
                            })
                          }
                          className="font-mono tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Map Picker */}
                <SectionCard
                  icon={MapPin}
                  title="Pin your location"
                  subtitle="Drop a pin on the map for exact turf location"
                >
                  <LocationPickerMap
                    address={formData.location?.address || ""}
                    city={formData.location?.city || ""}
                    state={formData.location?.state || ""}
                    pincode={formData.location?.pincode || ""}
                    initialCoordinates={
                      formData.geoLocation?.coordinates
                        ? {
                            latitude: formData.geoLocation.coordinates[1],
                            longitude: formData.geoLocation.coordinates[0],
                          }
                        : undefined
                    }
                    onLocationConfirmed={(locationData) => {
                      setFormData((prev) => ({
                        ...prev,
                        geoLocation: {
                          type: "Point" as const,
                          coordinates: locationData.coordinates,
                        },
                        locationMetadata: {
                          accuracy: locationData.accuracy,
                          accuracyRadius: locationData.accuracyRadius,
                          isOwnerVerified: locationData.isOwnerVerified,
                          geocodedBy: "user_pin_drop",
                          geocodedAt: new Date(),
                        },
                        location: {
                          ...prev.location,
                          ...(locationData.address && {
                            address: locationData.address,
                          }),
                          ...(locationData.city && {
                            city: locationData.city,
                          }),
                          ...(locationData.state && {
                            state: locationData.state,
                          }),
                          ...(locationData.pincode && {
                            pincode: locationData.pincode,
                          }),
                        },
                      }));
                    }}
                  />
                </SectionCard>

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setActiveTab("scheduling")}
                    className={nightGhostBtn}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                </div>
              </>
            )}

            {/* ═══ GLOBAL SAVE BUTTON ═══ */}
            <div className="sticky bottom-4 z-10">
              <div className="flex flex-col items-center justify-between gap-4 rounded-[4px] border border-pitchline bg-pitch-900/85 p-4 backdrop-blur sm:flex-row sm:px-6">
                <div className="flex items-center gap-3">
                  <Save className="h-4 w-4 flex-shrink-0 text-flood-500" />
                  <div>
                    <p className="nm-overline text-chalk-100">
                      {isEditMode ? "Save changes" : "Submit your turf"}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                      All fields marked <span className="text-flood-500">*</span>{" "}
                      are required
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`${nightPrimaryBtn} w-full sm:w-auto`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEditMode
                        ? "Update arena details"
                        : "Submit arena details"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NightShell>
  );
}

// Page wrapper
export default function TurfOwnerDashboardPage() {
  return (
    <ProtectedRoute requireRole="owner">
      <TurfOwnerDashboard />
    </ProtectedRoute>
  );
}
