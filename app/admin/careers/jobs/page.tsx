'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NightShell } from '@/components/night/NightShell';
import { NightLoader } from '@/components/night/NightLoader';
import {
  nightCard,
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
import { Plus, Edit, Trash2, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  department: 'Frontend Intern' | 'Backend Intern' | 'Full Stack Developer Intern';
  location: string;
  employmentType: 'Internship' | 'Full-time' | 'Part-time';
  description: string;
  responsibilities: string[];
  requirements: string[];
  stipend: {
    amount: string;
    type: string;
  };
  internshipYear?: string;
  deadline?: string;
  status: 'open' | 'closed';
  postedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  applicationCount?: number;
}

interface JobFormData {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  responsibilities: string;
  requirements: string;
  stipendAmount: string;
  stipendType: string;
  internshipYear: string;
  deadline: string;
}

// ─── Night Match micro-styles (presentation only) ────────────────────

const fieldLabel =
  'mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400';
const helperText = 'mt-1.5 font-mono text-[10px] tracking-[0.02em] text-chalk-400/70';
const rowGhostBtn =
  'inline-flex items-center gap-1.5 rounded-[4px] border border-chalk-400/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500 disabled:pointer-events-none disabled:opacity-35';
const rowDangerBtn =
  'inline-flex items-center gap-1.5 rounded-[4px] border border-red-700/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red-400 transition-colors duration-200 ease-night hover:border-red-500 hover:text-red-300 disabled:pointer-events-none disabled:opacity-35';
const dangerBtn =
  'nm-overline inline-flex items-center justify-center gap-2 rounded-[4px] border border-red-700/50 px-6 py-3.5 text-red-400 transition-colors duration-200 ease-night hover:border-red-500 hover:text-red-300 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-35';
const squareTag =
  'inline-flex items-center rounded-[2px] border border-pitchline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400';

export default function ManageJobsPage() {
  const { user, firebaseUser, initialLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    department: '',
    location: '',
    employmentType: '',
    description: '',
    responsibilities: '',
    requirements: '',
    stipendAmount: '',
    stipendType: '',
    internshipYear: '',
    deadline: ''
  });

  useEffect(() => {
    if (!initialLoading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = await firebaseUser?.getIdToken();

      const response = await fetch('/api/admin/careers/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs);
      } else {
        setError(data.error || 'Failed to fetch jobs');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      location: '',
      employmentType: '',
      description: '',
      responsibilities: '',
      requirements: '',
      stipendAmount: '',
      stipendType: '',
      internshipYear: '',
      deadline: ''
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title || !formData.department || !formData.location ||
        !formData.employmentType || !formData.description || !formData.requirements.trim() ||
        !formData.stipendAmount.trim() || !formData.stipendType.trim()) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const token = await firebaseUser?.getIdToken();

      const response = await fetch('/api/admin/careers/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          department: formData.department,
          location: formData.location,
          employmentType: formData.employmentType,
          description: formData.description,
          responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
          stipend: {
            amount: formData.stipendAmount,
            type: formData.stipendType
          },
          internshipYear: formData.internshipYear || undefined,
          deadline: formData.deadline || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Job posted successfully!');
        setShowCreateDialog(false);
        resetForm();
        fetchJobs();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to create job');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setError(null);
    setSubmitting(true);

    try {
      const token = await firebaseUser?.getIdToken();

      const response = await fetch(`/api/admin/careers/jobs/${selectedJob._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          department: formData.department,
          location: formData.location,
          employmentType: formData.employmentType,
          description: formData.description,
          responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
          stipend: {
            amount: formData.stipendAmount,
            type: formData.stipendType
          },
          internshipYear: formData.internshipYear || undefined,
          deadline: formData.deadline || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Job updated successfully!');
        setShowEditDialog(false);
        setSelectedJob(null);
        resetForm();
        fetchJobs();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to update job');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedJob) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = await firebaseUser?.getIdToken();

      const response = await fetch(`/api/admin/careers/jobs/${selectedJob._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Job deleted successfully!');
        setShowDeleteDialog(false);
        setSelectedJob(null);
        fetchJobs();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to delete job');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (job: Job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      employmentType: job.employmentType,
      description: job.description,
      responsibilities: job.responsibilities ? job.responsibilities.join('\n') : '',
      requirements: job.requirements.join('\n'),
      stipendAmount: job.stipend.amount,
      stipendType: job.stipend.type,
      internshipYear: job.internshipYear || '',
      deadline: job.deadline ? job.deadline.split('T')[0] : ''
    });
    setShowEditDialog(true);
  };

  const toggleJobStatus = async (job: Job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';

    try {
      const token = await firebaseUser?.getIdToken();

      const response = await fetch(`/api/admin/careers/jobs/${job._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Job ${newStatus === 'open' ? 'opened' : 'closed'} successfully!`);
        fetchJobs();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to update job status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  if (initialLoading || loading) {
    return (
      <NightShell ambient={0.4}>
        <div className="flex min-h-screen items-center justify-center">
          <NightLoader label="Opening the scouting desk…" />
        </div>
      </NightShell>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const openCount = jobs.filter(j => j.status === 'open').length;
  const closedCount = jobs.filter(j => j.status === 'closed').length;

  return (
    <NightShell ambient={0.4}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal>
          <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
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
                Openings
              </h1>
              <p className="mt-3 max-w-md text-sm text-chalk-400">
                Create, edit and manage the career postings on OutFyld.
              </p>
            </div>
            <button
              onClick={() => { resetForm(); setShowCreateDialog(true); }}
              className={`${nightPrimaryBtn} shrink-0 self-start lg:self-auto`}
            >
              <Plus className="h-4 w-4" />
              Post new job
            </button>
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

        {/* Stats — scoreboard strip */}
        <Reveal delay={0.08}>
          <div className={`${nightCard} mb-8 grid grid-cols-3 gap-y-6 px-6 py-6 sm:divide-x sm:divide-pitchline/60`}>
            {[
              { label: 'Total postings', value: jobs.length, lime: false },
              { label: 'Open positions', value: openCount, lime: true },
              { label: 'Closed positions', value: closedCount, lime: false },
            ].map((s, i) => (
              <div key={s.label} className={i > 0 ? 'sm:pl-7' : ''}>
                <div className={`font-mono text-3xl tabular-nums tracking-tight sm:text-4xl ${s.lime ? 'text-flood-500' : 'text-chalk-100'}`}>
                  <CountUp value={s.value} />
                </div>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Jobs Table */}
        <Reveal delay={0.14}>
          <div className={`${nightCard} overflow-hidden`}>
            <div className="border-b border-pitchline/60 px-6 py-4">
              <Overline>All job postings</Overline>
              <p className="mt-1 text-xs text-chalk-400/80">
                Every career opportunity posted on OutFyld.
              </p>
            </div>
            {jobs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <h3 className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                  No postings on the board
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-chalk-400">
                  The scouting desk is quiet. Post the first opening.
                </p>
                <button
                  onClick={() => { resetForm(); setShowCreateDialog(true); }}
                  className={`${nightGhostBtn} mt-6`}
                >
                  <Plus className="h-4 w-4" />
                  Post your first job
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-pitchline/60 hover:bg-transparent">
                      <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Job title</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Department</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Type</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Location</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Status</TableHead>
                      <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Posted</TableHead>
                      <TableHead className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow
                        key={job._id}
                        className="border-pitchline/60 transition-colors duration-200 ease-night hover:bg-white/[0.03]"
                      >
                        <TableCell className="font-medium text-chalk-100">{job.title}</TableCell>
                        <TableCell>
                          <span className={squareTag}>{job.department}</span>
                        </TableCell>
                        <TableCell className="text-sm text-chalk-400">{job.employmentType}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-chalk-400">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                            <StatusDot tone={job.status === 'open' ? 'lime' : 'chalk'} />
                            {job.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Mono className="text-sm text-chalk-400">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </Mono>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleJobStatus(job)}
                              className={rowGhostBtn}
                            >
                              {job.status === 'open' ? 'Close' : 'Open'}
                            </button>
                            <button
                              onClick={() => openEditDialog(job)}
                              className={rowGhostBtn}
                              aria-label={`Edit ${job.title}`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedJob(job); setShowDeleteDialog(true); }}
                              className={rowDangerBtn}
                              aria-label={`Delete ${job.title}`}
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

        {/* Create Job Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Post new job
              </DialogTitle>
              <DialogDescription className="text-chalk-400">
                Create a new job posting. It will be published immediately as &quot;Open&quot;.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="title" className={fieldLabel}>Job title *</label>
                <NightInput
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Frontend Developer Intern"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="department" className={fieldLabel}>Department *</label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Frontend Intern">Frontend Intern</SelectItem>
                      <SelectItem value="Backend Intern">Backend Intern</SelectItem>
                      <SelectItem value="Full Stack Developer Intern">Full Stack Developer Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="employmentType" className={fieldLabel}>Employment type *</label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className={fieldLabel}>Location *</label>
                  <NightInput
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Remote / Mumbai"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="deadline" className={fieldLabel}>Application deadline (optional)</label>
                  <NightInput
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className={fieldLabel}>Job description *</label>
                <NightTextarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, what the candidate will do, team structure, etc."
                  rows={5}
                  required
                />
              </div>

              <div>
                <label htmlFor="responsibilities" className={fieldLabel}>Responsibilities *</label>
                <NightTextarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="Enter each responsibility on a new line&#10;- Design and develop user interfaces&#10;- Collaborate with backend team&#10;- Write clean, maintainable code"
                  rows={5}
                  required
                />
                <p className={helperText}>Enter each responsibility on a new line</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stipendAmount" className={fieldLabel}>Stipend amount *</label>
                  <NightInput
                    id="stipendAmount"
                    value={formData.stipendAmount}
                    onChange={(e) => setFormData({ ...formData, stipendAmount: e.target.value })}
                    placeholder="e.g., 10k, 15-20k"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="stipendType" className={fieldLabel}>Stipend type *</label>
                  <NightInput
                    id="stipendType"
                    value={formData.stipendType}
                    onChange={(e) => setFormData({ ...formData, stipendType: e.target.value })}
                    placeholder="e.g., Performance based*, Fixed, Unpaid"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="internshipYear" className={fieldLabel}>Internship year (optional)</label>
                <NightInput
                  id="internshipYear"
                  value={formData.internshipYear}
                  onChange={(e) => setFormData({ ...formData, internshipYear: e.target.value })}
                  placeholder="e.g., 2025, 2026"
                />
                <p className={helperText}>Specify the year for which this internship is open</p>
              </div>

              <div>
                <label htmlFor="requirements" className={fieldLabel}>Requirements (one per line) *</label>
                <NightTextarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Strong knowledge of React and Next.js&#10;Experience with TypeScript&#10;Good communication skills"
                  rows={6}
                  required
                />
                <p className={helperText}>Enter each requirement on a new line</p>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  className={nightGhostBtn}
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={nightPrimaryBtn}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Post job
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Job Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Edit job posting
              </DialogTitle>
              <DialogDescription className="text-chalk-400">
                Update the job details. Changes will be reflected immediately.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label htmlFor="edit-title" className={fieldLabel}>Job title *</label>
                <NightInput
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-department" className={fieldLabel}>Department *</label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Frontend Intern">Frontend Intern</SelectItem>
                      <SelectItem value="Backend Intern">Backend Intern</SelectItem>
                      <SelectItem value="Full Stack Developer Intern">Full Stack Developer Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="edit-employmentType" className={fieldLabel}>Employment type *</label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-location" className={fieldLabel}>Location *</label>
                  <NightInput
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-deadline" className={fieldLabel}>Application deadline (optional)</label>
                  <NightInput
                    id="edit-deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-description" className={fieldLabel}>Job description *</label>
                <NightTextarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-responsibilities" className={fieldLabel}>Responsibilities *</label>
                <NightTextarea
                  id="edit-responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  rows={5}
                  required
                />
                <p className={helperText}>Enter each responsibility on a new line</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-stipendAmount" className={fieldLabel}>Stipend amount *</label>
                  <NightInput
                    id="edit-stipendAmount"
                    value={formData.stipendAmount}
                    onChange={(e) => setFormData({ ...formData, stipendAmount: e.target.value })}
                    placeholder="e.g., 10k, 15-20k"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-stipendType" className={fieldLabel}>Stipend type *</label>
                  <NightInput
                    id="edit-stipendType"
                    value={formData.stipendType}
                    onChange={(e) => setFormData({ ...formData, stipendType: e.target.value })}
                    placeholder="e.g., Performance based*, Fixed, Unpaid"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-requirements" className={fieldLabel}>Requirements (one per line) *</label>
                <NightTextarea
                  id="edit-requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <DialogFooter>
                <button
                  type="button"
                  className={nightGhostBtn}
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={nightPrimaryBtn}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                  Update job
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl uppercase tracking-tight text-chalk-100">
                Delete job posting
              </DialogTitle>
              <DialogDescription className="text-chalk-400">
                Are you sure you want to delete &quot;{selectedJob?.title}&quot;?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button className={nightGhostBtn} onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </button>
              <button className={dangerBtn} onClick={handleDelete} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete job
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </NightShell>
  );
}
