"use client";

import { useState, useEffect } from "react";
import LocationPickerMap from "@/components/owner/LocationPickerMap";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Save,
  User,
  Building,
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
  Shield,
  CreditCard,
  Layers,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

/* ─── Tab Step Card ──────────────────────────────────────────────── */
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
      className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full text-left ${
        active
          ? "bg-emerald-50 border-emerald-200 border shadow-sm"
          : "hover:bg-gray-50 border border-transparent"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
          active
            ? "bg-emerald-600 text-white shadow-md"
            : completed
            ? "bg-emerald-50 text-emerald-600"
            : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
        }`}
      >
        {completed && !active ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
          Step {step}
        </p>
        <p
          className={`text-sm font-medium truncate ${
            active ? "text-emerald-700" : "text-gray-700"
          }`}
        >
          {label}
        </p>
      </div>
    </button>
  );
}

/* ─── Section Card ──────────────────────────────────────────────── */
function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  children,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-[15px]">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ─── Status Screen ──────────────────────────────────────────────── */
function StatusScreen({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  detail,
  actions,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  detail?: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-emerald-200 text-base mt-3">{description}</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto -mt-10 relative z-10 px-4 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-8 text-center">
          <div
            className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-5`}
          >
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-4">{description}</p>
          {detail}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            {actions}
          </div>
        </div>
      </div>
    </div>
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
    { id: "turf-details", label: "Turf Details", icon: ImageIcon, step: 2 },
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
      setError("At least one turf image is required");
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
        setError(turfError.error || "Failed to save turf");
        return;
      }

      setSuccess(
        turfId ? "Turf updated successfully!" : "Turf created successfully!"
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
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }

  /* ── No Subscription ── */
  if (!subscriptionStatus?.hasSubscription) {
    return (
      <StatusScreen
        icon={Shield}
        iconColor="text-amber-500"
        iconBg="bg-amber-50"
        title="Subscription Required"
        description="You need a subscription plan before adding turfs."
        actions={
          <>
            <Link href="/owner/subscription">
              <Button className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200 transition-all">
                <CreditCard className="w-4 h-4 mr-2" />
                Choose Plan
              </Button>
            </Link>
            <Link href="/owner/dashboard">
              <Button
                variant="outline"
                className="rounded-xl h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
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
        icon={Clock}
        iconColor="text-amber-500"
        iconBg="bg-amber-50"
        title="Subscription Pending"
        description="Your payment is being verified by our admin team."
        actions={
          <Link href="/owner/dashboard">
            <Button
              variant="outline"
              className="rounded-xl h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        }
      />
    );
  }

  /* ── Rejected ── */
  if (subscriptionStatus?.status === "rejected") {
    return (
      <StatusScreen
        icon={AlertCircle}
        iconColor="text-red-500"
        iconBg="bg-red-50"
        title="Subscription Rejected"
        description="Your application was not approved."
        detail={
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2 text-left">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
              Reason
            </p>
            <p className="text-sm text-red-600">
              {subscriptionStatus.rejectionReason || "No reason provided"}
            </p>
          </div>
        }
        actions={
          <>
            <Link href="/owner/subscription">
              <Button className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200 transition-all">
                Reapply
              </Button>
            </Link>
            <Link href="/owner/dashboard">
              <Button
                variant="outline"
                className="rounded-xl h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
              >
                Dashboard
              </Button>
            </Link>
          </>
        }
      />
    );
  }

  /* ═══════════════════════════════════════════
   *  MAIN FORM VIEW
   * ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* ─────────── HERO BANNER ─────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-28">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/owner/dashboard">
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl -ml-2 font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-[11px] text-emerald-200">Turf Owner</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center">
            <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-[10px] mb-4">
              <Building className="h-3 w-3 mr-1" />
              {isEditMode ? "Edit Turf" : "Add New Turf"}
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {isEditMode ? "Update Your Turf" : "Create Your Turf"}
            </h1>
            <p className="text-emerald-200 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
              {isEditMode
                ? "Update your turf details, images, scheduling, and location information."
                : "Set up your turf facility with all the details players need to find and book your venue."}
            </p>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {tabs.map((tab, i) => (
                <div key={tab.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      tab.id === activeTab
                        ? "bg-white text-emerald-700 shadow-lg"
                        : i < currentTabIndex
                        ? "bg-white/25 text-white"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {i < currentTabIndex ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      tab.step
                    )}
                  </button>
                  {i < tabs.length - 1 && (
                    <div
                      className={`w-8 sm:w-12 h-0.5 rounded-full transition-all duration-200 ${
                        i < currentTabIndex ? "bg-white/40" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── CONTENT ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-12">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── LEFT: Tab Navigation (sidebar) ── */}
          <div className="lg:col-span-1 space-y-5">
            {/* Steps */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-[15px]">
                    Setup Steps
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Step {currentTabIndex + 1} of {tabs.length}
                  </p>
                </div>
              </div>
              <div className="p-3 space-y-1">
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

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-emerald-200" />
                  <span className="text-sm font-semibold">Quick Tips</span>
                </div>
                <ul className="text-emerald-100 text-xs leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Add high-quality images to attract more players
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Set competitive pricing for your area
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Mark your exact location on the map
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    Add all available time slots
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Form Content ── */}
          <div className="lg:col-span-3 space-y-5">
            {/* ═══ TAB: Business Info ═══ */}
            {activeTab === "business-info" && (
              <>
                <SectionCard
                  icon={User}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                  title="Basic Information"
                  subtitle="Your business and contact details"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="ownerName"
                        className="text-xs font-semibold text-gray-700"
                      >
                        Owner Name{" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="ownerName"
                        placeholder="Your full name"
                        value={formData.ownerName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ownerName: e.target.value,
                          })
                        }
                        className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="businessName"
                        className="text-xs font-semibold text-gray-700"
                      >
                        Business Name{" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="businessName"
                        placeholder="Your turf business name"
                        value={formData.businessName || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            businessName: e.target.value,
                          })
                        }
                        className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-xs font-semibold text-gray-700"
                      >
                        Phone Number{" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+91 9XXXXXXXXX"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value,
                          })
                        }
                        className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  icon={IndianRupee}
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                  title="Pricing"
                  subtitle="Set your hourly rates and discount limits"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="pricing"
                        className="text-xs font-semibold text-gray-700"
                      >
                        Price per Hour (₹){" "}
                        <span className="text-red-400">*</span>
                      </Label>
                      <Input
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
                        className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="maxDiscount"
                        className="text-xs font-semibold text-gray-700"
                      >
                        Max Discount %{" "}
                        <span className="text-gray-400 font-normal">
                          (Dynamic Pricing)
                        </span>
                      </Label>
                      <Input
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
                        className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                      <p className="text-[11px] text-gray-400">
                        Maximum discount (0–100%) the platform can offer based
                        on demand.
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  icon={CreditCard}
                  iconBg="bg-teal-50"
                  iconColor="text-teal-600"
                  title="Bank Details & Payouts"
                  subtitle="Configure where your payouts will be sent"
                >
                  <Link href="/owner/bank-details">
                    <button className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group w-full text-left">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-800">
                          Manage Bank Details
                        </p>
                        <p className="text-[11px] text-emerald-600">
                          Add or update your bank account
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                </SectionCard>

                {/* Navigation */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setActiveTab("turf-details")}
                    className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-200"
                  >
                    Next: Turf Details
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {/* ═══ TAB: Turf Details ═══ */}
            {activeTab === "turf-details" && (
              <>
                <SectionCard
                  icon={ImageIcon}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                  title="Turf Images"
                  subtitle="Upload photos of your turf facility"
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
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                    title="Premium Banner Image"
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
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                  title="Sports & Amenities"
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
                    <Separator />
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
                  iconBg="bg-teal-50"
                  iconColor="text-teal-600"
                  title="About Your Turf"
                  subtitle="Describe your turf to attract players"
                >
                  <AboutSection
                    value={formData.about}
                    onChange={(about) => setFormData({ ...formData, about })}
                  />
                </SectionCard>

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("business-info")}
                    className="rounded-xl h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setActiveTab("scheduling")}
                    className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-200"
                  >
                    Next: Scheduling
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {/* ═══ TAB: Scheduling ═══ */}
            {activeTab === "scheduling" && (
              <>
                <SectionCard
                  icon={Clock}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                  title="Time Slot Management"
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
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("turf-details")}
                    className="rounded-xl h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setActiveTab("location")}
                    className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-200"
                  >
                    Next: Location
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {/* ═══ TAB: Location ═══ */}
            {activeTab === "location" && (
              <>
                <SectionCard
                  icon={MapPin}
                  iconBg="bg-teal-50"
                  iconColor="text-teal-600"
                  title="Location Details"
                  subtitle="Enter your turf address and pin exact location"
                >
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="address"
                        className="text-xs font-semibold text-gray-700"
                      >
                        Address / Colony / Area
                      </Label>
                      <Input
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
                        className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="city"
                          className="text-xs font-semibold text-gray-700"
                        >
                          City <span className="text-red-400">*</span>
                        </Label>
                        <Input
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
                          className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="state"
                          className="text-xs font-semibold text-gray-700"
                        >
                          State
                        </Label>
                        <Input
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
                          className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="pincode"
                          className="text-xs font-semibold text-gray-700"
                        >
                          Pincode
                        </Label>
                        <Input
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
                          className="rounded-xl border-gray-200 h-11 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Map Picker */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-[15px]">
                        Pin Your Location
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Drop a pin on the map for exact turf location
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
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
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("scheduling")}
                    className="rounded-xl h-11 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                </div>
              </>
            )}

            {/* ═══ GLOBAL SAVE BUTTON ═══ */}
            <div className="sticky bottom-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Save className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {isEditMode ? "Save Changes" : "Submit Your Turf"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      All fields marked * are required
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl h-11 px-8 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 disabled:opacity-50 disabled:shadow-none transition-all duration-200 w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditMode
                        ? "Update Turf Details"
                        : "Submit Turf Details"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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