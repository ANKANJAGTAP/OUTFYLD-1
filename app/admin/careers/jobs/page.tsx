'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Shield, Plus, Edit, Trash2, X, Calendar, MapPin, Briefcase, Users, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  department: 'Frontend Intern' | 'Backend Intern' | 'Full Stack Developer Intern';
  location: string;
  employmentType: 'Internship' | 'Full-time' | 'Part-time';
  description: string;
  requirements: string[];
  stipend: {
    amount: string;
    type: string;
  };
  internshipYear?: string;
  openings: number;
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
  requirements: string;
  stipendAmount: string;
  stipendType: string;
  internshipYear: string;
  openings: number;
  deadline: string;
}

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
    requirements: '',
    stipendAmount: '',
    stipendType: '',
    internshipYear: '',
    openings: 1,
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
      requirements: '',
      stipendAmount: '',
      stipendType: '',
      internshipYear: '',
      openings: 1,
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
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
          stipend: {
            amount: formData.stipendAmount,
            type: formData.stipendType
          },
          internshipYear: formData.internshipYear || undefined,
          openings: formData.openings,
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
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
          stipend: {
            amount: formData.stipendAmount,
            type: formData.stipendType
          },
          internshipYear: formData.internshipYear || undefined,
          openings: formData.openings,
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
      requirements: job.requirements.join('\n'),
      stipendAmount: job.stipend.amount,
      stipendType: job.stipend.type,
      internshipYear: job.internshipYear || '',
      openings: job.openings,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Job Postings</h1>
                <p className="text-gray-600">Create, edit, and manage career opportunities</p>
              </div>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Post New Job
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{jobs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'open').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Closed Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {jobs.filter(j => j.status === 'closed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Job Postings</CardTitle>
            <CardDescription>Manage all career opportunities posted on OutFyld</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No jobs posted yet</p>
                <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Openings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job._id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.department}</Badge>
                        </TableCell>
                        <TableCell>{job.employmentType}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </div>
                        </TableCell>
                        <TableCell>{job.openings}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={job.status === 'open' ? 'default' : 'secondary'}
                            className={job.status === 'open' ? 'bg-green-600' : ''}
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleJobStatus(job)}
                            >
                              {job.status === 'open' ? 'Close' : 'Open'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(job)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => { setSelectedJob(job); setShowDeleteDialog(true); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Job Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post New Job</DialogTitle>
              <DialogDescription>
                Create a new job posting. It will be published immediately as &quot;Open&quot;.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Frontend Developer Intern"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department *</Label>
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
                  <Label htmlFor="employmentType">Employment Type *</Label>
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
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Remote / Mumbai"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="openings">Number of Openings *</Label>
                  <Input
                    id="openings"
                    type="number"
                    min="1"
                    value={formData.openings}
                    onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deadline">Application Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, what the candidate will do, team structure, etc."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stipendAmount">Stipend Amount *</Label>
                  <Input
                    id="stipendAmount"
                    value={formData.stipendAmount}
                    onChange={(e) => setFormData({ ...formData, stipendAmount: e.target.value })}
                    placeholder="e.g., 10k, 15-20k"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stipendType">Stipend Type *</Label>
                  <Input
                    id="stipendType"
                    value={formData.stipendType}
                    onChange={(e) => setFormData({ ...formData, stipendType: e.target.value })}
                    placeholder="e.g., Performance based, Fixed, Unpaid"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="internshipYear">Internship Year (Optional)</Label>
                <Input
                  id="internshipYear"
                  value={formData.internshipYear}
                  onChange={(e) => setFormData({ ...formData, internshipYear: e.target.value })}
                  placeholder="e.g., 2025, 2026"
                />
                <p className="text-xs text-gray-500 mt-1">Specify the year for which this internship is open</p>
              </div>

              <div>
                <Label htmlFor="requirements">Requirements (one per line) *</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Strong knowledge of React and Next.js&#10;Experience with TypeScript&#10;Good communication skills"
                  rows={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter each requirement on a new line</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Post Job
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Job Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Job Posting</DialogTitle>
              <DialogDescription>
                Update the job details. Changes will be reflected immediately.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Job Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department">Department *</Label>
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
                  <Label htmlFor="edit-employmentType">Employment Type *</Label>
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
                  <Label htmlFor="edit-location">Location *</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-openings">Number of Openings *</Label>
                  <Input
                    id="edit-openings"
                    type="number"
                    min="1"
                    value={formData.openings}
                    onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-deadline">Application Deadline (Optional)</Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Job Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-stipendAmount">Stipend Amount *</Label>
                  <Input
                    id="edit-stipendAmount"
                    value={formData.stipendAmount}
                    onChange={(e) => setFormData({ ...formData, stipendAmount: e.target.value })}
                    placeholder="e.g., 10k, 15-20k"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stipendType">Stipend Type *</Label>
                  <Input
                    id="edit-stipendType"
                    value={formData.stipendType}
                    onChange={(e) => setFormData({ ...formData, stipendType: e.target.value })}
                    placeholder="e.g., Performance based, Fixed, Unpaid"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-requirements">Requirements (one per line) *</Label>
                <Textarea
                  id="edit-requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  Update Job
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job Posting</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedJob?.title}&quot;?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
