'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Briefcase, FileText, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { nightCard, nightGhostBtn, nightPrimaryBtn, Mono, StatusDot } from '@/components/night/ui';
import { CountUp } from '@/components/landing/night-match/CountUp';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { PitchDivider } from '@/components/landing/night-match/PitchDivider';
import { ScoreboardSetPiece } from '@/components/landing/night-match/ScoreboardSetPiece';

interface Turf {
  _id: string;
  name: string;
  location: { city: string, state: string };
  pricing: number;
  isActive: boolean;
  ownerId: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
    subscriptionPlan?: string;
  };
  contactInfo?: {
    ownerName?: string;
    businessName?: string;
  };
  createdAt: string;
  totalBookings?: number;
  totalRevenue?: number;
}

interface AnalyticsData {
  totalCustomers: number;
  totalTurfOwners: number;
  totalTurfs: number;
  totalBookings: number;
  platformRevenue: number;
}

export default function AdminDashboard() {
  const { user, firebaseUser, initialLoading } = useAuth();
  const router = useRouter();

  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  const fetchData = async () => {
    try {
      if (!user || !firebaseUser) return;
      setLoading(true);

      const idToken = await firebaseUser.getIdToken();
      const headers = { 'Authorization': `Bearer ${idToken}` };

      // Fetch Analytics
      const analyticsRes = await fetch('/api/admin/analytics', { headers });
      const analyticsData = await analyticsRes.json();

      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }

      // Fetch Turfs
      const turfsRes = await fetch('/api/admin/turfs', { headers });
      const turfsData = await turfsRes.json();

      if (turfsData.success) {
        setTurfs(turfsData.turfs || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (initialLoading || loading) {
    return (
      <NightShell ambient={0.4}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Opening the control room…" />
        </div>
      </NightShell>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const networkUsers = (analytics?.totalCustomers || 0) + (analytics?.totalTurfOwners || 0);
  const platformStats = [
    { label: 'Revenue (Rs)', value: analytics?.platformRevenue || 0 },
    { label: 'Bookings', value: analytics?.totalBookings || 0 },
    { label: 'Active turfs', value: analytics?.totalTurfs || 0 },
    { label: 'Network users', value: networkUsers },
  ];

  return (
    <NightShell ambient={0.4}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* ── masthead ── */}
        <Reveal>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="nm-overline mb-3 flex items-center gap-2 text-flood-500">
                <Shield className="h-4 w-4" />
                OutFyld operations
              </p>
              <h1 className="nm-display-l text-chalk-100">Control room</h1>
              <p className="mt-2 max-w-md text-sm text-chalk-400">
                Platform analytics and operations monitoring — every arena, every whistle.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/manage-admins" className={`${nightGhostBtn} !px-4 !py-2.5 text-xs`}>
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Manage&nbsp;</span>Admins
              </Link>
              <Link href="/admin/careers/jobs" className={`${nightGhostBtn} !px-4 !py-2.5 text-xs`}>
                <Briefcase className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Manage&nbsp;</span>Jobs
              </Link>
              <Link href="/admin/careers/applications" className={`${nightGhostBtn} !px-4 !py-2.5 text-xs`}>
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View&nbsp;</span>Applications
              </Link>
              <Link href="/admin/settings" className={`${nightGhostBtn} !px-4 !py-2.5 text-xs`}>
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="nm-overline inline-flex items-center justify-center gap-2 rounded-[4px] border border-red-700/60 px-4 py-2.5 text-xs text-red-400 transition-[border-color,color,transform] duration-200 ease-night hover:border-red-500 hover:text-red-300 active:translate-y-[2px]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </Reveal>

        {error && (
          <div className="mt-6 rounded-[4px] border border-red-700/60 bg-red-950/40 px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-red-400">{error}</p>
          </div>
        )}

        {/* ── PLATFORM SCOREBOARD — 3D stadium board on desktop; flat
               odometer strip on mobile / reduced-motion / WebGL failure ── */}
        <section className="mt-8">
          <ScoreboardSetPiece
            cells={[
              { label: 'REVENUE (RS)', value: analytics?.platformRevenue || 0 },
              { label: 'BOOKINGS', value: analytics?.totalBookings || 0 },
              { label: 'ACTIVE TURFS', value: analytics?.totalTurfs || 0 },
              { label: 'NETWORK USERS', value: networkUsers },
            ]}
            srText={`Platform revenue ₹${(analytics?.platformRevenue || 0).toLocaleString('en-IN')}. ${analytics?.totalBookings || 0} total bookings. ${analytics?.totalTurfs || 0} active turfs. ${networkUsers} network users — ${analytics?.totalCustomers || 0} customers and ${analytics?.totalTurfOwners || 0} owners.`}
          >
            <div className="grid grid-cols-2 gap-y-8 rounded-[4px] border border-pitchline bg-pitch-700/80 px-6 py-7 lg:grid-cols-4 lg:divide-x lg:divide-pitchline/60">
              {platformStats.map((s, i) => (
                <div key={s.label} className={i > 0 ? 'lg:pl-7' : ''}>
                  <div className="font-mono text-2xl tabular-nums tracking-tight text-chalk-100 sm:text-3xl">
                    <CountUp value={s.value} />
                  </div>
                  <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </ScoreboardSetPiece>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
            <Mono className="text-chalk-100">{analytics?.totalCustomers || 0}</Mono> customers
            <span className="mx-2 text-pitchline">/</span>
            <Mono className="text-chalk-100">{analytics?.totalTurfOwners || 0}</Mono> owners
          </p>
        </section>

        <PitchDivider flag="right" className="my-4" />

        {/* ── Active turfs — the league table ── */}
        <Reveal delay={0.08}>
          <div className={`${nightCard} overflow-hidden`}>
            <div className="border-b border-pitchline/60 px-6 py-4">
              <p className="nm-overline text-chalk-400">The league table</p>
              <h2 className="mt-1 font-display text-2xl uppercase tracking-tight text-chalk-100">
                Active turfs
              </h2>
              <p className="mt-1 text-xs text-chalk-400">
                All publicly listed turf facilities currently on the platform
              </p>
            </div>
            {turfs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <h3 className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                  No active turfs
                </h3>
                <p className="mt-2 text-sm text-chalk-400">The pitch list is empty tonight.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-pitchline/60 hover:bg-transparent">
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">Turf name</TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">Location</TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">Owner</TableHead>
                    <TableHead className="font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turfs.map((turf) => (
                    <TableRow key={turf._id} className="border-pitchline/60 transition-colors duration-200 ease-night hover:bg-chalk-100/[0.03]">
                      <TableCell className="font-display text-base uppercase tracking-tight text-chalk-100">
                         {turf.name}
                      </TableCell>
                      <TableCell className="text-sm text-chalk-400">{turf.location?.city || '-'}, {turf.location?.state || '-'}</TableCell>
                      <TableCell>
                          <div>
                            <p className="text-sm text-chalk-100">{turf.contactInfo?.ownerName || turf.ownerId?.name || turf.ownerId?.email || 'Unknown Owner'}</p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">{turf.contactInfo?.businessName || turf.ownerId?.businessName || ''}</p>
                          </div>
                      </TableCell>
                      <TableCell>
                        <button
                          className={`${nightGhostBtn} !px-4 !py-2 text-[10px]`}
                          onClick={() => {
                            setSelectedTurf(turf);
                            setIsModalOpen(true);
                          }}
                        >
                          View more
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
        </Reveal>

        {/* View More Modal */}
        {selectedTurf && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl rounded-[4px] border-pitchline bg-pitch-800 p-6 text-chalk-100">
              <DialogHeader>
                <p className="nm-overline text-flood-500">Team sheet</p>
                <DialogTitle className="font-display text-3xl uppercase tracking-tight text-chalk-100">{selectedTurf.name}</DialogTitle>
                <DialogDescription className="text-chalk-400">Detailed turf information</DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <p className="nm-overline border-b border-pitchline/60 pb-2 text-chalk-400">Basic info</p>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Location</p>
                    <p className="text-sm text-chalk-100">{selectedTurf.location?.city || '-'}, {selectedTurf.location?.state || '-'}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Pricing</p>
                    <p className="text-sm text-chalk-100"><Mono>₹{selectedTurf.pricing || 0}</Mono> / hr</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Registered on</p>
                    <p className="text-sm text-chalk-100"><Mono>{selectedTurf.createdAt ? new Date(selectedTurf.createdAt).toLocaleDateString() : '-'}</Mono></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="nm-overline border-b border-pitchline/60 pb-2 text-chalk-400">Owner info</p>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Owner name</p>
                    <p className="text-sm text-chalk-100">{selectedTurf.contactInfo?.ownerName || selectedTurf.ownerId?.name || selectedTurf.ownerId?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Business name</p>
                    <p className="text-sm text-chalk-100">{selectedTurf.contactInfo?.businessName || selectedTurf.ownerId?.businessName || '-'}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Subscription plan</p>
                    <p className="flex items-center gap-2 text-sm capitalize text-chalk-100">
                      <StatusDot tone="lime" />
                      {selectedTurf.ownerId?.subscriptionPlan || 'Basic'}
                    </p>
                  </div>
                </div>

                <div className="mt-2 space-y-4 md:col-span-2">
                  <p className="nm-overline border-b border-pitchline/60 pb-2 text-chalk-400">Analytics</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[4px] border border-pitchline bg-pitch-700/80 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Total bookings</p>
                      <p className="mt-1 font-mono text-2xl tabular-nums tracking-tight text-chalk-100">{selectedTurf.totalBookings || 0}</p>
                    </div>
                    <div className="rounded-[4px] border border-flood-500/40 bg-pitch-700/80 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-flood-500">Total revenue</p>
                      <p className="mt-1 font-mono text-2xl tabular-nums tracking-tight text-chalk-100">₹{selectedTurf.totalRevenue?.toLocaleString('en-IN') || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button className={`${nightGhostBtn} !px-5 !py-2.5 text-xs`} onClick={() => setIsModalOpen(false)}>Close</button>
                <button className={`${nightPrimaryBtn} !px-5 !py-2.5 text-xs`} onClick={() => router.push(`/turf/${selectedTurf._id}`)}>Go to turf page</button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </NightShell>
  );
}
