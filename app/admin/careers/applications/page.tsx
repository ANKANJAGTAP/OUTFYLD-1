'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import {
  nightCard,
  nightCardHover,
  nightPrimaryBtn,
  nightGhostBtn,
  NightInput,
  NightTextarea,
  Overline,
  StatusDot,
  Mono,
} from '@/components/night/ui';
import { Reveal } from '@/components/landing/night-match/Reveal';
import { CountUp } from '@/components/landing/night-match/CountUp';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  ArrowLeft,
  Download,
  ExternalLink,
  Trash2,
  Search,
  Filter,
  Loader2,
  Eye,
  Edit,
  Calendar,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  GraduationCap,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    department: string;
    employmentType: string;
    status: string;
  };
  fullName: string;
  email: string;
  phone: string;
  college?: string;
  availability?: string;
  resume: {
    url: string;
    fileName: string;
  };
  coverLetter?: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl?: string;
  status: 'submitted' | 'under_review' | 'shortlisted_email_sent' | 'offer_sent' | 'offer_accepted' | 'rejected' | 'hired';
  appliedDate: string;
  offerAccepted?: boolean;
  offerAcceptedAt?: string;
  adminNotes?: string;
  reviewedBy?: {
    name: string;
    email: string;
  };
  reviewedAt?: string;
  source: string;
  createdAt: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentAmount?: number;
  paymentTransactionId?: string;
  paymentDate?: string;
  paymentReceiptUrl?: string;
  joiningLetterPdfUrl?: string;
  offerLetterId?: string;
  offerLetterGeneratedAt?: string; // Track when offer was successfully sent
}

// ─── Night Match micro-styles (presentation only) ────────────────────

const headerBtn =
  'nm-overline inline-flex items-center justify-center gap-2 rounded-[4px] border border-chalk-400/30 px-4 py-2.5 text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500 disabled:pointer-events-none disabled:opacity-35';
const rowGhostBtn =
  'inline-flex items-center gap-1.5 rounded-[4px] border border-chalk-400/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500 disabled:pointer-events-none disabled:opacity-35';
const rowLimeBtn =
  'inline-flex items-center gap-1.5 rounded-[4px] border border-flood-500/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-flood-500 transition-[border-color,box-shadow] duration-200 ease-night hover:border-flood-500 hover:shadow-flood disabled:pointer-events-none disabled:opacity-35';
const rowDangerBtn =
  'inline-flex items-center gap-1.5 rounded-[4px] border border-red-700/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red-400 transition-colors duration-200 ease-night hover:border-red-500 hover:text-red-300 disabled:pointer-events-none disabled:opacity-35';
const dangerBtn =
  'nm-overline inline-flex items-center justify-center gap-2 rounded-[4px] border border-red-700/50 px-6 py-3.5 text-red-400 transition-colors duration-200 ease-night hover:border-red-500 hover:text-red-300 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-35';
const tableHeadCell = 'font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400';
const squareTag =
  'inline-flex items-center rounded-[2px] border border-pitchline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400';
const infoLabel = 'block font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400';
const fieldLabel = `mb-1.5 ${infoLabel}`;
const limeUnderlineLink =
  'inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-flood-500 underline decoration-flood-500/40 underline-offset-4 transition-[text-decoration-color] duration-200 ease-night hover:decoration-flood-500';
const statusLine =
  'flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400';

// Status → dot tone + broadcast label (no pills, no emoji)
const STATUS_META: Record<string, { label: string; tone: 'lime' | 'chalk' | 'red' }> = {
  submitted: { label: 'Submitted', tone: 'chalk' },
  under_review: { label: 'Under review', tone: 'chalk' },
  shortlisted_email_sent: { label: 'Shortlisted', tone: 'lime' },
  offer_sent: { label: 'Offer sent', tone: 'lime' },
  offer_accepted: { label: 'Offer accepted', tone: 'lime' },
  rejected: { label: 'Rejected', tone: 'red' },
  hired: { label: 'Hired', tone: 'lime' },
};

function StatusText({ status, className = '' }: { status: string; className?: string }) {
  const meta = STATUS_META[status] || { label: status.replace(/_/g, ' '), tone: 'chalk' as const };
  return (
    <span className={`${statusLine} ${className}`}>
      <StatusDot tone={meta.tone} />
      {meta.label}
    </span>
  );
}

export default function ManageApplicationsPage() {
  const { user, firebaseUser, initialLoading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [otherApplications, setOtherApplications] = useState<Application[]>([]);
  const [loadingOtherApps, setLoadingOtherApps] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null); // Track which application is sending email

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicatePositions, setDuplicatePositions] = useState<{id: string, title: string}[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string[]>([]);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);

  // Bulk email states
  const [showBulkShortlistDialog, setShowBulkShortlistDialog] = useState(false);
  const [showBulkOfferDialog, setShowBulkOfferDialog] = useState(false);
  const [bulkEmailProgress, setBulkEmailProgress] = useState({ current: 0, total: 0 });
  const [bulkEmailResults, setBulkEmailResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const [isBulkSending, setIsBulkSending] = useState(false);

  const [updateForm, setUpdateForm] = useState({
    status: '',
    adminNotes: ''
  });

  useEffect(() => {
    if (!initialLoading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage]);

  useEffect(() => {
    if (user?.role === 'admin') {
      setCurrentPage(1); // Reset to page 1 when filter changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = await firebaseUser?.getIdToken();

      let url = `/api/admin/careers/applications?limit=100&page=${currentPage}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
        setTotalCount(data.pagination?.total || data.applications.length);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError(data.error || 'Failed to fetch applications');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    setError(null);
    setSubmitting(true);

    try {
      const token = await firebaseUser?.getIdToken();

      const response = await fetch(`/api/admin/careers/applications/${selectedApplication._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updateForm.status || selectedApplication.status,
          adminNotes: updateForm.adminNotes
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Application updated successfully!');
        setShowDetailDialog(false);
        setSelectedApplication(null);
        fetchApplications();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to update application');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedApplication) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = await firebaseUser?.getIdToken();

      const response = await fetch(`/api/admin/careers/applications/${selectedApplication._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Application deleted successfully!');
        setShowDeleteDialog(false);
        setSelectedApplication(null);
        fetchApplications();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to delete application');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendShortlistEmail = async (applicationId: string) => {
    setSendingEmail(applicationId);
    setError(null);

    try {
      const token = await firebaseUser?.getIdToken();

      const response = await fetch(`/api/admin/careers/applications/${applicationId}/send-shortlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Shortlist notification email sent successfully!');
        fetchApplications(); // Refresh the list
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to send shortlist email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSendOfferEmail = async (applicationId: string) => {
    setSendingEmail(applicationId);
    setError(null);

    try {
      const token = await firebaseUser?.getIdToken();

      const response = await fetch(`/api/admin/careers/applications/${applicationId}/send-offer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Offer letter email sent successfully!');
        fetchApplications(); // Refresh the list
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to send offer letter');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleOpenDuplicateDialog = async () => {
    try {
      setError(null);
      setShowDuplicateDialog(true);

      const token = await firebaseUser?.getIdToken();

      const response = await fetch('/api/admin/careers/applications/duplicate-positions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDuplicatePositions(data.positions);
        if (data.positions.length === 0) {
          setError('No duplicate candidates found');
          setShowDuplicateDialog(false);
        }
      } else {
        setError(data.error || 'Failed to fetch duplicate positions');
        setShowDuplicateDialog(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setShowDuplicateDialog(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (selectedPosition.length === 0) {
      setError('Please select at least one position to keep');
      return;
    }

    try {
      setRemovingDuplicates(true);
      setError(null);

      const token = await firebaseUser?.getIdToken();

      const response = await fetch('/api/admin/careers/applications/remove-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetJobIds: selectedPosition
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`${data.message}`);
        setTimeout(() => setSuccess(null), 5000);
        setShowDuplicateDialog(false);
        setSelectedPosition([]);
        fetchApplications();
      } else {
        setError(data.error || 'Failed to remove duplicates');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setRemovingDuplicates(false);
    }
  };

  const handleBulkShortlistConfirm = () => {
    const eligibleApps = applications; // All applications on current page
    setBulkEmailProgress({ current: 0, total: eligibleApps.length });
    setBulkEmailResults({ success: 0, failed: 0, errors: [] });
    setShowBulkShortlistDialog(true);
  };

  const handleBulkShortlist = async () => {
    setIsBulkSending(true);
    const eligibleApps = applications;
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < eligibleApps.length; i++) {
      const app = eligibleApps[i];
      setBulkEmailProgress({ current: i + 1, total: eligibleApps.length });

      try {
        const token = await firebaseUser?.getIdToken();
        const response = await fetch(`/api/admin/careers/applications/${app._id}/send-shortlist`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push(`${app.fullName}: ${data.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        failedCount++;
        errors.push(`${app.fullName}: ${err.message || 'Network error'}`);
      }
    }

    setBulkEmailResults({ success: successCount, failed: failedCount, errors });
    setIsBulkSending(false);
    fetchApplications(); // Refresh the list
  };

  const handleBulkOfferConfirm = () => {
    // Only include applications that are shortlisted but haven't had offer letters generated yet
    const eligibleApps = applications.filter(app =>
      app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt
    );
    setBulkEmailProgress({ current: 0, total: eligibleApps.length });
    setBulkEmailResults({ success: 0, failed: 0, errors: [] });
    setShowBulkOfferDialog(true);
  };

  const handleBulkOffer = async () => {
    setIsBulkSending(true);
    // Only process applications that haven't had offer letters generated yet
    const eligibleApps = applications.filter(app =>
      app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt
    );
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < eligibleApps.length; i++) {
      const app = eligibleApps[i];
      setBulkEmailProgress({ current: i + 1, total: eligibleApps.length });

      try {
        const token = await firebaseUser?.getIdToken();
        const response = await fetch(`/api/admin/careers/applications/${app._id}/send-offer`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push(`${app.fullName}: ${data.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        failedCount++;
        errors.push(`${app.fullName}: ${err.message || 'Network error'}`);
      }
    }

    setBulkEmailResults({ success: successCount, failed: failedCount, errors });
    setIsBulkSending(false);
    fetchApplications(); // Refresh the list
  };

  const handleExportCSV = async () => {
    try {
      const token = await firebaseUser?.getIdToken();

      let url = '/api/admin/careers/applications/export';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        setSuccess('Applications exported successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to export applications');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const openDetailDialog = (application: Application) => {
    setSelectedApplication(application);
    setUpdateForm({
      status: application.status,
      adminNotes: application.adminNotes || ''
    });
    setShowDetailDialog(true);
    // Fetch other applications by the same email or phone
    fetchOtherApplications(application.email, application.phone, application._id);
  };

  const fetchOtherApplications = async (email: string, phone: string, currentApplicationId: string) => {
    try {
      setLoadingOtherApps(true);
      const token = await firebaseUser?.getIdToken();

      const response = await fetch(`/api/admin/careers/applications?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out the current application
        const others = data.applications.filter((app: Application) => app._id !== currentApplicationId);
        setOtherApplications(others);
      } else {
        setOtherApplications([]);
      }
    } catch (err) {
      console.error('Error fetching other applications:', err);
      setOtherApplications([]);
    } finally {
      setLoadingOtherApps(false);
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  // Filter applications by search term
  const filteredApplications = applications.filter(app =>
    app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.jobId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (initialLoading || loading) {
    return (
      <NightShell ambient={0.4}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Pulling the scouting files…" />
        </div>
      </NightShell>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const pendingOfferCount = applications.filter(app => app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt).length;

  const statTiles: { label: string; value: number; filter: string; lime?: boolean }[] = [
    { label: 'Total applications', value: totalCount, filter: 'all', lime: true },
    { label: 'New', value: applications.filter(a => a.status === 'submitted').length, filter: 'submitted' },
    { label: 'Under review', value: applications.filter(a => a.status === 'under_review').length, filter: 'under_review' },
    { label: 'Shortlist sent', value: applications.filter(a => a.status === 'shortlisted_email_sent').length, filter: 'shortlisted_email_sent' },
    { label: 'Offer sent', value: applications.filter(a => a.status === 'offer_sent').length, filter: 'offer_sent' },
    { label: 'Hired', value: applications.filter(a => a.status === 'hired').length, filter: 'hired' },
  ];

  return (
    <NightShell ambient={0.4}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal>
          <div className="mb-10 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <Link
                href="/admin/dashboard"
                className="group mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-400 transition-colors duration-200 ease-night hover:text-flood-500"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-night group-hover:-translate-x-1" />
                Back to control room
              </Link>
              <p className="nm-overline mb-3 text-flood-500">Scouting desk</p>
              <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-chalk-100 sm:text-6xl">
                Applications
              </h1>
              <p className="mt-3 max-w-md text-sm text-chalk-400">
                Review candidates, run the shortlist and send out the offers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleBulkShortlistConfirm} className={headerBtn}>
                <Mail className="h-4 w-4" />
                Send shortlist to all
              </button>
              <button
                onClick={handleBulkOfferConfirm}
                className={headerBtn}
                disabled={pendingOfferCount === 0}
              >
                <CheckCircle2 className="h-4 w-4" />
                Send offer to all
                {pendingOfferCount > 0 && (
                  <Mono className="text-flood-500">({pendingOfferCount})</Mono>
                )}
              </button>
              <button onClick={handleOpenDuplicateDialog} className={headerBtn}>
                <Users className="h-4 w-4" />
                Remove duplicates
              </button>
              <button onClick={handleExportCSV} className={headerBtn}>
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </Reveal>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-[4px] border border-red-700/50 bg-red-950/30 px-4 py-3 text-sm text-red-300" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-[4px] border border-flood-500/40 bg-flood-500/10 px-4 py-3 text-sm text-flood-500" role="status">
            {success}
          </div>
        )}

        {/* Stats — clickable scoreboard filters */}
        <Reveal delay={0.08}>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {statTiles.map((tile) => (
              <button
                key={tile.filter}
                type="button"
                onClick={() => setStatusFilter(tile.filter)}
                className={`${nightCard} ${nightCardHover} cursor-pointer px-5 py-4 text-left ${
                  statusFilter === tile.filter ? 'border-flood-500/60 shadow-flood' : ''
                }`}
              >
                <div className={`font-mono text-3xl tabular-nums tracking-tight ${tile.lime ? 'text-flood-500' : 'text-chalk-100'}`}>
                  <CountUp value={tile.value} />
                </div>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                  {tile.label}
                </p>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Search & Filters */}
        <Reveal delay={0.12}>
          <div className={`${nightCard} mb-6 px-5 py-5`}>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-chalk-400" />
                  <NightInput
                    placeholder="Search by name, email, or job title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="shortlisted_email_sent">Shortlist Email Sent</SelectItem>
                    <SelectItem value="offer_sent">Offer Sent</SelectItem>
                    <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Applications Table */}
        <Reveal delay={0.16}>
          <div className={`${nightCard} overflow-hidden`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-pitchline/60 px-6 py-4">
              <Overline>
                Applications
                <Mono className="text-chalk-100">({filteredApplications.length})</Mono>
              </Overline>
              {statusFilter !== 'all' && (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-flood-500">
                  Filtered by: {getStatusLabel(statusFilter)}
                </span>
              )}
            </div>
            {filteredApplications.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <h3 className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                  No applications found
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-chalk-400">
                  Nothing in the scouting files for this view.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-pitchline/60 hover:bg-transparent">
                      <TableHead className={tableHeadCell}>Applicant</TableHead>
                      <TableHead className={tableHeadCell}>Job title</TableHead>
                      <TableHead className={tableHeadCell}>Department</TableHead>
                      <TableHead className={tableHeadCell}>Applied on</TableHead>
                      <TableHead className={tableHeadCell}>Status</TableHead>
                      <TableHead className={`${tableHeadCell} text-right`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow
                        key={application._id}
                        className="border-pitchline/60 transition-colors duration-200 ease-night hover:bg-white/[0.03]"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-chalk-100">{application.fullName}</div>
                            <div className="text-sm text-chalk-400">{application.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-chalk-100">{application.jobId?.title || 'N/A'}</div>
                            <div className="text-sm text-chalk-400">{application.jobId?.employmentType}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={squareTag}>{application.jobId?.department}</span>
                        </TableCell>
                        <TableCell>
                          <Mono className="block text-sm text-chalk-100">
                            {format(new Date(application.appliedDate), 'dd MMM yyyy')}
                          </Mono>
                          <Mono className="text-xs text-chalk-400">
                            {format(new Date(application.appliedDate), 'HH:mm')}
                          </Mono>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <StatusText status={application.status} />
                            {application.status === 'offer_accepted' && (
                              <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-flood-500">
                                <StatusDot tone="lime" />
                                Offer accepted
                              </span>
                            )}
                            {application.status === 'hired' && application.paymentStatus === 'completed' && (
                              <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-flood-500">
                                <StatusDot tone="lime" />
                                Payment completed
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {/* Send Shortlist Email Button - visible if not yet shortlisted */}
                            {!['shortlisted_email_sent', 'offer_sent', 'offer_accepted', 'hired'].includes(application.status) && (
                              <button
                                onClick={() => handleSendShortlistEmail(application._id)}
                                disabled={sendingEmail === application._id}
                                className={rowLimeBtn}
                              >
                                {sendingEmail === application._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                                Shortlist
                              </button>
                            )}

                            {/* Send Offer Letter Button - visible only for 'shortlisted_email_sent' status */}
                            {application.status === 'shortlisted_email_sent' && (
                              <button
                                onClick={() => handleSendOfferEmail(application._id)}
                                disabled={sendingEmail === application._id}
                                className={rowLimeBtn}
                              >
                                {sendingEmail === application._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                Send offer
                              </button>
                            )}

                            <button
                              onClick={() => openDetailDialog(application)}
                              className={rowGhostBtn}
                              aria-label={`View application from ${application.fullName}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedApplication(application); setShowDeleteDialog(true); }}
                              className={rowDangerBtn}
                              aria-label={`Delete application from ${application.fullName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Reveal>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className={`${nightCard} mt-6 px-6 py-4`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                Showing <Mono className="text-chalk-100">{applications.length > 0 ? ((currentPage - 1) * 100) + 1 : 0}</Mono> to{' '}
                <Mono className="text-chalk-100">{Math.min(currentPage * 100, totalCount)}</Mono> of{' '}
                <Mono className="text-chalk-100">{totalCount}</Mono> applications
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={rowGhostBtn}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`inline-flex h-8 w-10 items-center justify-center rounded-[4px] font-mono text-[11px] tabular-nums transition-colors duration-200 ease-night ${
                          currentPage === pageNum
                            ? 'bg-flood-500 text-pitch-900'
                            : 'border border-chalk-400/30 text-chalk-100 hover:border-flood-500 hover:text-flood-500'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  className={rowGhostBtn}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Application Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Application details
              </DialogTitle>
              <DialogDescription className="text-chalk-400">
                Review applicant information and update status
              </DialogDescription>
            </DialogHeader>

            {selectedApplication && (
              <div className="space-y-6">
                {/* Job Info */}
                <div className="rounded-[4px] border border-pitchline bg-pitch-800/60 p-4">
                  <span className={infoLabel}>Applied for</span>
                  <p className="mt-1 font-display text-xl uppercase tracking-tight text-chalk-100">
                    {selectedApplication.jobId?.title}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className={squareTag}>{selectedApplication.jobId?.department}</span>
                    <span className={squareTag}>{selectedApplication.jobId?.employmentType}</span>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={infoLabel}>Full name</span>
                    <p className="mt-1 font-medium text-chalk-100">{selectedApplication.fullName}</p>
                  </div>
                  <div>
                    <span className={infoLabel}>Email</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-chalk-400" />
                      <p className="font-medium text-chalk-100">{selectedApplication.email}</p>
                    </div>
                  </div>
                  <div>
                    <span className={infoLabel}>Phone</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-chalk-400" />
                      <Mono className="font-medium text-chalk-100">{selectedApplication.phone}</Mono>
                    </div>
                  </div>
                  <div>
                    <span className={infoLabel}>Applied on</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-chalk-400" />
                      <Mono className="font-medium text-chalk-100">
                        {format(new Date(selectedApplication.appliedDate), 'dd MMM yyyy, HH:mm')}
                      </Mono>
                    </div>
                  </div>
                </div>

                {/* College & Availability */}
                {(selectedApplication.college || selectedApplication.availability) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedApplication.college && (
                      <div>
                        <span className={infoLabel}>College/University</span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <GraduationCap className="h-3 w-3 text-chalk-400" />
                          <p className="font-medium text-chalk-100">{selectedApplication.college}</p>
                        </div>
                      </div>
                    )}
                    {selectedApplication.availability && (
                      <div>
                        <span className={infoLabel}>Availability</span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-chalk-400" />
                          <p className="font-medium text-chalk-100">{selectedApplication.availability}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Links */}
                <div className="space-y-2">
                  <span className={infoLabel}>Professional links</span>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href={selectedApplication.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={limeUnderlineLink}
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={selectedApplication.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={limeUnderlineLink}
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {selectedApplication.portfolioUrl && (
                      <a
                        href={selectedApplication.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={limeUnderlineLink}
                      >
                        <Globe className="h-4 w-4" />
                        Portfolio
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Other Applications by Same Candidate */}
                {loadingOtherApps ? (
                  <div className="flex items-center justify-center rounded-[4px] border border-pitchline bg-pitch-800/60 p-4">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-chalk-400" />
                    <span className="text-sm text-chalk-400">Loading other applications...</span>
                  </div>
                ) : otherApplications.length > 0 && (
                  <div className="rounded-[4px] border border-flood-500/30 bg-pitch-800/60 p-4">
                    <p className="nm-overline mb-3 flex items-center gap-2 text-flood-500">
                      <FileText className="h-4 w-4" />
                      This candidate has also applied to:
                    </p>
                    <div className="space-y-2">
                      {otherApplications.map((app) => (
                        <div
                          key={app._id}
                          className="flex items-center justify-between rounded-[4px] border border-pitchline bg-pitch-700/80 p-3 transition-colors duration-200 ease-night hover:border-flood-500/40"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-chalk-100">{app.jobId?.title}</p>
                            <div className="mt-1.5 flex gap-2">
                              <span className={squareTag}>{app.jobId?.department}</span>
                              <span className={squareTag}>{app.jobId?.employmentType}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <StatusText status={app.status} className="justify-end" />
                              <Mono className="mt-1 block text-xs text-chalk-400">
                                {format(new Date(app.appliedDate), 'dd MMM yyyy')}
                              </Mono>
                            </div>
                            <button
                              onClick={() => {
                                setShowDetailDialog(false);
                                setTimeout(() => openDetailDialog(app), 100);
                              }}
                              className={rowGhostBtn}
                              aria-label={`View application for ${app.jobId?.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {otherApplications.some(app => app.status === 'hired' || app.status === 'offer_accepted' || app.status === 'offer_sent' || app.status === 'shortlisted_email_sent') && (
                      <div className="mt-3 rounded-[4px] border border-red-700/40 bg-red-950/20 p-3">
                        <p className="text-sm text-chalk-400">
                          <span className="nm-overline mr-2 text-red-400">Note:</span>
                          This candidate is already {' '}
                          {otherApplications.find(app => app.status === 'hired')
                            ? `hired for "${otherApplications.find(app => app.status === 'hired')?.jobId?.title}"`
                            : otherApplications.find(app => app.status === 'offer_accepted')
                            ? `has accepted offer for "${otherApplications.find(app => app.status === 'offer_accepted')?.jobId?.title}"`
                            : otherApplications.find(app => app.status === 'offer_sent')
                            ? `has been sent an offer for "${otherApplications.find(app => app.status === 'offer_sent')?.jobId?.title}"`
                            : `shortlisted for "${otherApplications.find(app => app.status === 'shortlisted_email_sent')?.jobId?.title}"`
                          }.
                          Please consider this before making a decision.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Offer Acceptance Status */}
                {(selectedApplication.status === 'offer_sent' || selectedApplication.status === 'offer_accepted') && (
                  <div className={`rounded-[4px] border p-4 ${
                    selectedApplication.offerAccepted || selectedApplication.status === 'offer_accepted'
                      ? 'border-flood-500/40 bg-flood-500/5'
                      : 'border-pitchline bg-pitch-800/60'
                  }`}>
                    <span className={infoLabel}>Offer status</span>
                    {selectedApplication.offerAccepted || selectedApplication.status === 'offer_accepted' ? (
                      <div className="mt-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-flood-500" />
                        <div>
                          <p className="font-semibold text-flood-500">Offer accepted</p>
                          {selectedApplication.offerAcceptedAt && (
                            <Mono className="text-sm text-chalk-400">
                              Accepted on {format(new Date(selectedApplication.offerAcceptedAt!), 'dd MMM yyyy, HH:mm')}
                            </Mono>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-chalk-400" />
                        <p className="font-medium text-chalk-100">Awaiting candidate response</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Information (Admin Only) */}
                {selectedApplication.status === 'hired' && selectedApplication.paymentStatus && (
                  <div className={`rounded-[4px] border p-4 ${
                    selectedApplication.paymentStatus === 'completed'
                      ? 'border-flood-500/40 bg-flood-500/5'
                      : selectedApplication.paymentStatus === 'pending'
                      ? 'border-pitchline bg-pitch-800/60'
                      : 'border-red-700/50 bg-red-950/20'
                  }`}>
                    <span className={infoLabel}>Payment information</span>
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-chalk-400">Payment status:</span>
                        <span className={statusLine}>
                          <StatusDot tone={
                            selectedApplication.paymentStatus === 'completed' ? 'lime' :
                            selectedApplication.paymentStatus === 'pending' ? 'chalk' : 'red'
                          } />
                          {selectedApplication.paymentStatus === 'completed' ? 'Completed' :
                           selectedApplication.paymentStatus === 'pending' ? 'Pending' :
                           'Failed'}
                        </span>
                      </div>

                      {selectedApplication.paymentStatus === 'completed' && (
                        <>
                          {selectedApplication.paymentDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-chalk-400">Payment date &amp; time:</span>
                              <Mono className="font-medium text-chalk-100">
                                {format(new Date(selectedApplication.paymentDate), 'dd MMMM yyyy, hh:mm a')}
                              </Mono>
                            </div>
                          )}

                          {selectedApplication.paymentTransactionId && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-chalk-400">Transaction ID:</span>
                              <code className="rounded-[2px] border border-pitchline bg-pitch-800 px-2 py-1 font-mono text-xs text-chalk-100">
                                {selectedApplication.paymentTransactionId}
                              </code>
                            </div>
                          )}

                          {selectedApplication.paymentAmount && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-chalk-400">Payment amount:</span>
                              <Mono className="text-lg font-bold text-flood-500">
                                ₹{selectedApplication.paymentAmount.toFixed(2)}
                              </Mono>
                            </div>
                          )}

                          {selectedApplication.paymentReceiptUrl && (
                            <div className="mt-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <a
                                  href={selectedApplication.paymentReceiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={limeUnderlineLink}
                                >
                                  <FileText className="h-4 w-4" />
                                  Download receipt
                                  <Download className="h-3 w-3" />
                                </a>
                                <button
                                  onClick={() => window.open(selectedApplication.paymentReceiptUrl, '_blank', 'noopener,noreferrer')}
                                  className={rowGhostBtn}
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Joining Letter */}
                    {selectedApplication.joiningLetterPdfUrl && (
                      <div className="mt-4 rounded-[4px] border border-pitchline bg-pitch-800/60 p-4">
                        <span className={`${infoLabel} flex items-center gap-2`}>
                          <FileText className="h-4 w-4 text-flood-500" />
                          Joining letter
                        </span>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <a
                            href={selectedApplication.joiningLetterPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={limeUnderlineLink}
                          >
                            <FileText className="h-4 w-4" />
                            {selectedApplication.offerLetterId ? `Joining-Letter-${selectedApplication.offerLetterId}.pdf` : 'Joining-Letter.pdf'}
                            <Download className="h-3 w-3" />
                          </a>
                          <button
                            onClick={() => window.open(selectedApplication.joiningLetterPdfUrl, '_blank', 'noopener,noreferrer')}
                            className={rowGhostBtn}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resume */}
                <div>
                  <span className={infoLabel}>Resume</span>
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={selectedApplication.resume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center gap-2 rounded-[4px] border border-flood-500/30 bg-pitch-800/60 p-3 transition-[border-color,box-shadow] duration-200 ease-night hover:border-flood-500 hover:shadow-flood"
                    >
                      <FileText className="h-5 w-5 text-flood-500" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-flood-500 underline decoration-flood-500/40 underline-offset-4">
                        {selectedApplication.resume.fileName}
                      </span>
                      <ExternalLink className="ml-auto h-4 w-4 text-flood-500" />
                    </a>
                    <button
                      onClick={() => window.open(selectedApplication.resume.url, '_blank', 'noopener,noreferrer')}
                      className={rowGhostBtn}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <span className={infoLabel}>Cover letter</span>
                    <p className="mt-2 whitespace-pre-wrap rounded-[4px] border border-pitchline bg-pitch-800/60 p-3 text-sm text-chalk-100/90">
                      {selectedApplication.coverLetter}
                    </p>
                  </div>
                )}

                {/* Update Status Form */}
                <form onSubmit={handleUpdateStatus} className="space-y-4 border-t border-pitchline pt-4">
                  <div>
                    <label htmlFor="status" className={fieldLabel}>Update status</label>
                    <Select
                      value={updateForm.status}
                      onValueChange={(value) => setUpdateForm({ ...updateForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="shortlisted_email_sent">Shortlist Email Sent</SelectItem>
                        <SelectItem value="offer_sent">Offer Sent</SelectItem>
                        <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="adminNotes" className={fieldLabel}>Admin notes (internal)</label>
                    <NightTextarea
                      id="adminNotes"
                      value={updateForm.adminNotes}
                      onChange={(e) => setUpdateForm({ ...updateForm, adminNotes: e.target.value })}
                      placeholder="Add internal notes about this candidate..."
                      rows={3}
                    />
                  </div>

                  {selectedApplication.adminNotes && selectedApplication.reviewedBy && (
                    <div className="rounded-[4px] border border-pitchline bg-pitch-800/60 p-3 text-sm">
                      <p className="nm-overline text-chalk-400">Previous notes</p>
                      <p className="mt-2 text-chalk-100/90">{selectedApplication.adminNotes}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400">
                        By {selectedApplication.reviewedBy.name} on{' '}
                        {selectedApplication.reviewedAt && format(new Date(selectedApplication.reviewedAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <button type="button" className={nightGhostBtn} onClick={() => setShowDetailDialog(false)}>
                      Close
                    </button>
                    <button type="submit" disabled={submitting} className={nightPrimaryBtn}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                      Update application
                    </button>
                  </DialogFooter>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Delete application
              </DialogTitle>
              <DialogDescription className="text-chalk-400">
                Are you sure you want to delete this application from {selectedApplication?.fullName}?
                This will also delete the resume from Cloudinary. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button className={nightGhostBtn} onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </button>
              <button className={dangerBtn} onClick={handleDelete} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete application
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Duplicates Dialog */}
        <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Remove duplicate applications
              </DialogTitle>
              <DialogDescription className="text-chalk-400">
                Select which job position to keep for candidates who applied to multiple positions.
                All other applications from the same candidate (matched by email or phone) will be permanently deleted.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <span className={infoLabel}>Positions to keep</span>
                <div className="max-h-64 space-y-3 overflow-y-auto rounded-[4px] border border-pitchline bg-pitch-800/60 p-4">
                  {duplicatePositions.map((position) => (
                    <div key={position.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`position-${position.id}`}
                        checked={selectedPosition.includes(position.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPosition([...selectedPosition, position.id]);
                          } else {
                            setSelectedPosition(selectedPosition.filter(id => id !== position.id));
                          }
                        }}
                        className="h-4 w-4 accent-flood-500"
                      />
                      <label
                        htmlFor={`position-${position.id}`}
                        className="cursor-pointer text-sm font-medium leading-none text-chalk-100"
                      >
                        {position.title}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
                  <Mono className="text-chalk-100">{duplicatePositions.length}</Mono> position(s) have duplicate candidates •{' '}
                  <Mono className="text-flood-500">{selectedPosition.length}</Mono> selected
                </p>
              </div>

              {selectedPosition.length > 0 && (
                <div className="rounded-[4px] border border-pitchline bg-pitch-800/60 p-3 text-sm text-chalk-400">
                  All applications from candidates who applied to multiple positions will be removed,
                  except for their applications to the selected position(s).
                </div>
              )}
            </div>

            <DialogFooter>
              <button
                className={nightGhostBtn}
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setSelectedPosition([]);
                }}
              >
                Cancel
              </button>
              <button
                className={dangerBtn}
                onClick={handleRemoveDuplicates}
                disabled={removingDuplicates || selectedPosition.length === 0}
              >
                {removingDuplicates ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove duplicates
                  </>
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Shortlist Dialog */}
        <Dialog open={showBulkShortlistDialog} onOpenChange={(open) => {
          if (!isBulkSending) setShowBulkShortlistDialog(open);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Send shortlist email to all
              </DialogTitle>
              <DialogDescription className="text-chalk-400">
                {!isBulkSending && bulkEmailProgress.current === 0 ? (
                  <>Send shortlist notification emails to all <strong className="text-chalk-100">{applications.length}</strong> applications on this page?</>
                ) : (
                  'Sending shortlist emails...'
                )}
              </DialogDescription>
            </DialogHeader>

            {isBulkSending && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                    <span>Progress</span>
                    <Mono className="text-chalk-100">{bulkEmailProgress.current} / {bulkEmailProgress.total}</Mono>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-[2px] bg-pitch-800">
                    <div
                      className="h-full bg-flood-500 shadow-flood transition-all duration-300 ease-night"
                      style={{ width: `${(bulkEmailProgress.current / bulkEmailProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {!isBulkSending && bulkEmailProgress.current > 0 && (
              <div className="space-y-4 py-4">
                <div className={`rounded-[4px] border p-4 ${bulkEmailResults.failed === 0 ? 'border-flood-500/40 bg-flood-500/5' : 'border-red-700/40 bg-red-950/20'}`}>
                  <p className="nm-overline mb-3 text-chalk-400">Summary</p>
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-flood-500">
                      <StatusDot tone="lime" />
                      Successfully sent: <Mono>{bulkEmailResults.success}</Mono>
                    </p>
                    {bulkEmailResults.failed > 0 && (
                      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-red-400">
                        <StatusDot tone="red" />
                        Failed: <Mono>{bulkEmailResults.failed}</Mono>
                      </p>
                    )}
                  </div>
                </div>

                {bulkEmailResults.errors.length > 0 && (
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    <p className="nm-overline mb-2 text-red-400">Errors</p>
                    {bulkEmailResults.errors.map((error, index) => (
                      <div key={index} className="rounded-[2px] bg-red-950/30 p-2 text-xs text-red-300">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {!isBulkSending && bulkEmailProgress.current === 0 ? (
                <>
                  <button className={nightGhostBtn} onClick={() => setShowBulkShortlistDialog(false)}>
                    Cancel
                  </button>
                  <button className={nightPrimaryBtn} onClick={handleBulkShortlist}>
                    <Mail className="h-4 w-4" />
                    Send to {applications.length} applicants
                  </button>
                </>
              ) : !isBulkSending ? (
                <button className={nightPrimaryBtn} onClick={() => {
                  setShowBulkShortlistDialog(false);
                  setBulkEmailProgress({ current: 0, total: 0 });
                  setBulkEmailResults({ success: 0, failed: 0, errors: [] });
                }}>
                  Close
                </button>
              ) : (
                <button className={nightPrimaryBtn} disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Offer Dialog */}
        <Dialog open={showBulkOfferDialog} onOpenChange={(open) => {
          if (!isBulkSending) setShowBulkOfferDialog(open);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Send offer letter to all
              </DialogTitle>
              <DialogDescription className="text-chalk-400">
                {!isBulkSending && bulkEmailProgress.current === 0 ? (
                  <>Send offer letter emails to <strong className="text-chalk-100">{pendingOfferCount}</strong> remaining applications with status &quot;Shortlisted Email Sent&quot;?</>
                ) : (
                  'Sending offer letters...'
                )}
              </DialogDescription>
            </DialogHeader>

            {isBulkSending && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                    <span>Progress</span>
                    <Mono className="text-chalk-100">{bulkEmailProgress.current} / {bulkEmailProgress.total}</Mono>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-[2px] bg-pitch-800">
                    <div
                      className="h-full bg-flood-500 shadow-flood transition-all duration-300 ease-night"
                      style={{ width: `${(bulkEmailProgress.current / bulkEmailProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {!isBulkSending && bulkEmailProgress.current > 0 && (
              <div className="space-y-4 py-4">
                <div className={`rounded-[4px] border p-4 ${bulkEmailResults.failed === 0 ? 'border-flood-500/40 bg-flood-500/5' : 'border-red-700/40 bg-red-950/20'}`}>
                  <p className="nm-overline mb-3 text-chalk-400">Summary</p>
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-flood-500">
                      <StatusDot tone="lime" />
                      Successfully sent: <Mono>{bulkEmailResults.success}</Mono>
                    </p>
                    {bulkEmailResults.failed > 0 && (
                      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-red-400">
                        <StatusDot tone="red" />
                        Failed: <Mono>{bulkEmailResults.failed}</Mono>
                      </p>
                    )}
                  </div>
                </div>

                {bulkEmailResults.errors.length > 0 && (
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    <p className="nm-overline mb-2 text-red-400">Errors</p>
                    {bulkEmailResults.errors.map((error, index) => (
                      <div key={index} className="rounded-[2px] bg-red-950/30 p-2 text-xs text-red-300">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {!isBulkSending && bulkEmailProgress.current === 0 ? (
                <>
                  <button className={nightGhostBtn} onClick={() => setShowBulkOfferDialog(false)}>
                    Cancel
                  </button>
                  <button className={nightPrimaryBtn} onClick={handleBulkOffer} disabled={pendingOfferCount === 0}>
                    <CheckCircle2 className="h-4 w-4" />
                    Send to {pendingOfferCount} applicants
                  </button>
                </>
              ) : !isBulkSending ? (
                <button className={nightPrimaryBtn} onClick={() => {
                  setShowBulkOfferDialog(false);
                  setBulkEmailProgress({ current: 0, total: 0 });
                  setBulkEmailResults({ success: 0, failed: 0, errors: [] });
                }}>
                  Close
                </button>
              ) : (
                <button className={nightPrimaryBtn} disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </NightShell>
  );
}
