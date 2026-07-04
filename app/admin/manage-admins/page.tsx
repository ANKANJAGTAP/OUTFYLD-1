'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NightInput, nightCard, nightGhostBtn, nightPrimaryBtn, Overline, StatusDot, Mono } from '@/components/night/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Shield, UserPlus, UserMinus, ArrowLeft, XCircle } from 'lucide-react';
import Link from 'next/link';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import { CountUp } from '@/components/landing/night-match/CountUp';
import { Reveal } from '@/components/landing/night-match/Reveal';

interface Admin {
  _id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  role: string;
}

interface User {
  _id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'owner' | 'admin';
  createdAt: Date;
}

export default function ManageAdminsPage() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showDemoteDialog, setShowDemoteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  // Fetch admins and users
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all admins
      const adminsResponse = await fetch('/api/admin/manage-admins');
      if (!adminsResponse.ok) throw new Error('Failed to fetch admins');
      const adminsData = await adminsResponse.json();
      setAdmins(adminsData.admins || []);

      // Fetch all users for promotion
      const usersResponse = await fetch('/api/admin/all-users');
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      setAllUsers(usersData.users || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  // Handle promote user to admin
  const handlePromoteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/promote-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser._id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to promote user');
      }

      setSuccess(`${selectedUser.name} has been promoted to admin!`);
      await fetchData();
      setShowPromoteDialog(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle demote admin to original role
  const handleDemoteAdmin = async () => {
    if (!selectedUser) return;

    // Prevent demoting yourself
    if (selectedUser.uid === user?.uid) {
      setError('You cannot demote yourself!');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/demote-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: selectedUser._id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to demote admin');
      }

      setSuccess(`${selectedUser.name} has been demoted from admin role.`);
      await fetchData();
      setShowDemoteDialog(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users for promotion (exclude current admins)
  const eligibleUsers = allUsers.filter(u =>
    u.role !== 'admin' &&
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (initialLoading || loading) {
    return (
      <NightShell ambient={0.4}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Calling up the staff…" />
        </div>
      </NightShell>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const staffStats = [
    { label: 'Total admins', value: admins.length },
    { label: 'Total users', value: allUsers.length },
    { label: 'Eligible for promotion', value: allUsers.filter(u => u.role !== 'admin').length },
  ];

  const thClass = 'font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400';

  return (
    <NightShell ambient={0.4}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* ── masthead ── */}
        <Reveal>
          <Link
            href="/admin/dashboard"
            className="group mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-night group-hover:-translate-x-1" />
            Back to control room
          </Link>

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="nm-overline mb-3 text-flood-500">Control room</p>
              <h1 className="nm-display-l text-chalk-100">Staff list</h1>
              <p className="mt-2 text-sm text-chalk-400">
                View and manage administrator accounts
              </p>
            </div>
            <button onClick={() => setShowPromoteDialog(true)} className={`${nightPrimaryBtn} shrink-0`}>
              <UserPlus className="h-4 w-4" />
              Promote user to admin
            </button>
          </div>
        </Reveal>

        {error && (
          <div className="mt-6 rounded-[4px] border border-red-700/60 bg-red-950/40 px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-center gap-2 rounded-[4px] border border-flood-500/40 bg-pitch-700/80 px-4 py-3">
            <StatusDot tone="lime" />
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-flood-500">{success}</p>
          </div>
        )}

        {/* ── squad numbers ── */}
        <Reveal delay={0.08}>
          <div className="mt-8 grid grid-cols-3 gap-y-8 rounded-[4px] border border-pitchline bg-pitch-700/80 px-6 py-7 md:divide-x md:divide-pitchline/60">
            {staffStats.map((s, i) => (
              <div key={s.label} className={i > 0 ? 'md:pl-7' : ''}>
                <div className="font-mono text-2xl tabular-nums tracking-tight text-chalk-100 sm:text-3xl">
                  <CountUp value={s.value} />
                </div>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── current administrators ── */}
        <Reveal delay={0.12}>
          <div className={`${nightCard} mt-6 overflow-hidden`}>
            <div className="border-b border-pitchline/60 px-6 py-4">
              <p className="nm-overline text-chalk-400">On the touchline</p>
              <h2 className="mt-1 font-display text-2xl uppercase tracking-tight text-chalk-100">
                Current administrators
              </h2>
              <p className="mt-1 text-xs text-chalk-400">All users with admin privileges</p>
            </div>
            {admins.length === 0 ? (
              <p className="py-12 text-center font-mono text-xs uppercase tracking-[0.14em] text-chalk-400">
                No admins found
              </p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-pitchline/60 hover:bg-transparent">
                    <TableHead className={thClass}>Name</TableHead>
                    <TableHead className={thClass}>Email</TableHead>
                    <TableHead className={thClass}>Phone</TableHead>
                    <TableHead className={thClass}>Added on</TableHead>
                    <TableHead className={thClass}>Status</TableHead>
                    <TableHead className={`${thClass} text-right`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin._id} className="border-pitchline/60 transition-colors duration-200 ease-night hover:bg-chalk-100/[0.03]">
                      <TableCell className="text-sm text-chalk-100">
                        {admin.name}
                        {admin.uid === user?.uid && (
                          <Overline tone="lime" className="ml-2 border border-flood-500/40 px-1.5 py-0.5 text-[9px]">
                            You
                          </Overline>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-chalk-400">{admin.email}</TableCell>
                      <TableCell className="text-sm text-chalk-400"><Mono>{admin.phone || '-'}</Mono></TableCell>
                      <TableCell className="text-sm text-chalk-400"><Mono>{new Date(admin.createdAt).toLocaleDateString()}</Mono></TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                          <StatusDot tone="lime" />
                          Admin
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.uid !== user?.uid ? (
                          <button
                            className="nm-overline inline-flex items-center justify-center gap-2 rounded-[4px] border border-red-700/60 px-4 py-2 text-[10px] text-red-400 transition-[border-color,color,transform] duration-200 ease-night hover:border-red-500 hover:text-red-300 active:translate-y-[2px]"
                            onClick={() => {
                              setSelectedUser(admin as any);
                              setShowDemoteDialog(true);
                            }}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            Demote
                          </button>
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Current user</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
        </Reveal>

        {/* ── house rules ── */}
        <Reveal delay={0.16}>
          <div className={`${nightCard} mt-6 px-6 py-5`}>
            <p className="nm-overline flex items-center gap-2 text-flood-500">
              <Shield className="h-4 w-4" />
              House rules
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-chalk-400">
              <li>All admins have equal permissions - there is no hierarchy</li>
              <li>You can promote any user (customer or turf owner) to admin</li>
              <li>Admins can demote other admins back to their original role</li>
              <li>You cannot demote yourself - ask another admin to do it</li>
              <li>At least one admin should always exist in the system</li>
            </ul>
          </div>
        </Reveal>
      </div>

      {/* Promote User Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-[4px] border-pitchline bg-pitch-800 text-chalk-100">
          <DialogHeader>
            <p className="nm-overline text-flood-500">Call-up</p>
            <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">Promote user to admin</DialogTitle>
            <DialogDescription className="text-chalk-400">
              Select a user to give them administrator privileges
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="search" className="nm-overline block text-chalk-400">Search users</label>
              <NightInput
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-96 overflow-y-auto rounded-[4px] border border-pitchline">
              {eligibleUsers.length === 0 ? (
                <p className="py-8 text-center font-mono text-xs uppercase tracking-[0.12em] text-chalk-400">
                  {searchQuery ? 'No users found matching your search' : 'All users are already admins'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-pitchline/60 hover:bg-transparent">
                      <TableHead className={thClass}>Name</TableHead>
                      <TableHead className={thClass}>Email</TableHead>
                      <TableHead className={thClass}>Role</TableHead>
                      <TableHead className={`${thClass} text-right`}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleUsers.map((eligibleUser) => (
                      <TableRow key={eligibleUser._id} className="border-pitchline/60 transition-colors duration-200 ease-night hover:bg-chalk-100/[0.03]">
                        <TableCell className="text-sm text-chalk-100">{eligibleUser.name}</TableCell>
                        <TableCell className="text-sm text-chalk-400">{eligibleUser.email}</TableCell>
                        <TableCell>
                          <Overline className="text-[9px]">
                            {eligibleUser.role === 'owner' ? 'Arena Owner' : 'Customer'}
                          </Overline>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            className={`${nightPrimaryBtn} !px-4 !py-2 text-[10px]`}
                            onClick={() => {
                              setSelectedUser(eligibleUser);
                              setShowPromoteDialog(false);
                              // Show confirmation
                              setTimeout(() => {
                                if (window.confirm(`Promote ${eligibleUser.name} to admin?`)) {
                                  setSelectedUser(eligibleUser);
                                  handlePromoteUser();
                                }
                              }, 100);
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Promote
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <DialogFooter>
            <button className={`${nightGhostBtn} !px-5 !py-2.5 text-xs`} onClick={() => setShowPromoteDialog(false)}>
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote Admin Dialog */}
      <Dialog open={showDemoteDialog} onOpenChange={setShowDemoteDialog}>
        <DialogContent className="rounded-[4px] border-pitchline bg-pitch-800 text-chalk-100">
          <DialogHeader>
            <p className="nm-overline text-red-400">Sending off</p>
            <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">Demote administrator</DialogTitle>
            <DialogDescription className="text-chalk-400">
              Are you sure you want to remove admin privileges from {selectedUser?.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-start gap-3 rounded-[4px] border border-red-700/60 bg-red-950/40 px-4 py-3">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-400">
                This action will remove all admin privileges. The user will revert to their original role.
              </p>
            </div>
          </div>

          <DialogFooter>
            <button className={`${nightGhostBtn} !px-5 !py-2.5 text-xs`} onClick={() => setShowDemoteDialog(false)} disabled={actionLoading}>
              Cancel
            </button>
            <button
              className="nm-overline inline-flex items-center justify-center gap-2 rounded-[4px] bg-red-700 px-5 py-2.5 text-xs text-chalk-100 transition-[background-color,transform] duration-200 ease-night hover:bg-red-600 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-35"
              onClick={handleDemoteAdmin}
              disabled={actionLoading}
            >
              {actionLoading ? 'Demoting...' : 'Confirm demotion'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NightShell>
  );
}
