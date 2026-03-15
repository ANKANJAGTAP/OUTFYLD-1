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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700';
      case 'shortlisted_email_sent':
        return 'bg-cyan-100 text-cyan-700';
      case 'offer_sent':
        return 'bg-green-100 text-green-700';
      case 'offer_accepted':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'hired':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
                <p className="text-gray-600">Review and manage candidate applications</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleBulkShortlistConfirm} variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Send Shortlist to All
            </Button>
            <Button 
              onClick={handleBulkOfferConfirm} 
              variant="outline"
              disabled={applications.filter(app => app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt).length === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Send Offer to All
              {applications.filter(app => app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt).length > 0 && (
                <span className="ml-1">({applications.filter(app => app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt).length})</span>
              )}
            </Button>
            <Button onClick={handleOpenDuplicateDialog} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Remove Duplicates
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
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

        {/* Stats & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('all')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('submitted')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {applications.filter(a => a.status === 'submitted').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('under_review')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {applications.filter(a => a.status === 'under_review').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('shortlisted_email_sent')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Shortlist Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">
                {applications.filter(a => a.status === 'shortlisted_email_sent').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('offer_sent')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Offer Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {applications.filter(a => a.status === 'offer_sent').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('hired')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Hired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {applications.filter(a => a.status === 'hired').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
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
                    <Filter className="w-4 h-4 mr-2" />
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
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
            <CardDescription>
              {statusFilter !== 'all' && `Filtered by: ${getStatusLabel(statusFilter)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.fullName}</div>
                            <div className="text-sm text-gray-500">{application.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.jobId?.title || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{application.jobId?.employmentType}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{application.jobId?.department}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div>{format(new Date(application.appliedDate), 'dd MMM yyyy')}</div>
                          <div className="text-xs text-gray-500">{format(new Date(application.appliedDate), 'HH:mm')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={getStatusColor(application.status)}>
                              {getStatusLabel(application.status)}
                            </Badge>
                            {application.status === 'offer_accepted' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                ✓ Offer Accepted
                              </Badge>
                            )}
                            {application.status === 'hired' && application.paymentStatus === 'completed' && (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                                ✓ Payment Completed
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {/* Send Shortlist Email Button - visible if not yet shortlisted */}
                            {!['shortlisted_email_sent', 'offer_sent', 'offer_accepted', 'hired'].includes(application.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendShortlistEmail(application._id)}
                                disabled={sendingEmail === application._id}
                                className="bg-cyan-50 border-cyan-300 hover:bg-cyan-100 text-cyan-700"
                              >
                                {sendingEmail === application._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                                <span className="ml-1">Shortlist</span>
                              </Button>
                            )}
                            
                            {/* Send Offer Letter Button - visible only for 'shortlisted_email_sent' status */}
                            {application.status === 'shortlisted_email_sent' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendOfferEmail(application._id)}
                                disabled={sendingEmail === application._id}
                                className="bg-green-50 border-green-300 hover:bg-green-100 text-green-700"
                              >
                                {sendingEmail === application._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span className="ml-1">Send Offer</span>
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailDialog(application)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => { setSelectedApplication(application); setShowDeleteDialog(true); }}
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {applications.length > 0 ? ((currentPage - 1) * 100) + 1 : 0} to {Math.min(currentPage * 100, totalCount)} of {totalCount} applications
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
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
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Review applicant information and update status
              </DialogDescription>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6">
                {/* Job Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Applied For</h3>
                  <p className="text-lg font-medium">{selectedApplication.jobId?.title}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge>{selectedApplication.jobId?.department}</Badge>
                    <Badge variant="outline">{selectedApplication.jobId?.employmentType}</Badge>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Full Name</Label>
                    <p className="font-medium">{selectedApplication.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <p className="font-medium">{selectedApplication.email}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Phone</Label>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <p className="font-medium">{selectedApplication.phone}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Applied On</Label>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <p className="font-medium">{format(new Date(selectedApplication.appliedDate), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                  </div>
                </div>

                {/* College & Availability */}
                {(selectedApplication.college || selectedApplication.availability) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedApplication.college && (
                      <div>
                        <Label className="text-gray-600">College/University</Label>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-gray-400" />
                          <p className="font-medium">{selectedApplication.college}</p>
                        </div>
                      </div>
                    )}
                    {selectedApplication.availability && (
                      <div>
                        <Label className="text-gray-600">Availability</Label>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <p className="font-medium">{selectedApplication.availability}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Links */}
                <div className="space-y-2">
                  <Label className="text-gray-600">Professional Links</Label>
                  <div className="flex flex-wrap gap-2">
                    <a 
                      href={selectedApplication.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href={selectedApplication.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-gray-700 hover:underline text-sm"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {selectedApplication.portfolioUrl && (
                      <a 
                        href={selectedApplication.portfolioUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-purple-600 hover:underline text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        Portfolio
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Other Applications by Same Candidate */}
                {loadingOtherApps ? (
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Loading other applications...</span>
                  </div>
                ) : otherApplications.length > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      This candidate has also applied to:
                    </h3>
                    <div className="space-y-2">
                      {otherApplications.map((app) => (
                        <div 
                          key={app._id} 
                          className="flex items-center justify-between bg-white p-3 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{app.jobId?.title}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{app.jobId?.department}</Badge>
                              <Badge variant="outline" className="text-xs">{app.jobId?.employmentType}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <Badge className={`
                                ${app.status === 'hired' || app.status === 'offer_accepted' 
                                  ? 'bg-green-600' 
                                  : app.status === 'offer_sent'
                                  ? 'bg-emerald-600'
                                  : app.status === 'shortlisted_email_sent'
                                  ? 'bg-cyan-600'
                                  : app.status === 'under_review' 
                                  ? 'bg-blue-600' 
                                  : app.status === 'submitted'
                                  ? 'bg-gray-600'
                                  : 'bg-red-600'}
                              `}>
                                {app.status === 'hired' && '✅ Hired'}
                                {app.status === 'offer_accepted' && '✅ Offer Accepted'}
                                {app.status === 'offer_sent' && '📧 Offer Sent'}
                                {app.status === 'shortlisted_email_sent' && '⭐ Shortlisted'}
                                {app.status === 'under_review' && '🔍 Under Review'}
                                {app.status === 'submitted' && '📋 Submitted'}
                                {app.status === 'rejected' && '❌ Rejected'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(app.appliedDate), 'dd MMM yyyy')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowDetailDialog(false);
                                setTimeout(() => openDetailDialog(app), 100);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {otherApplications.some(app => app.status === 'hired' || app.status === 'offer_accepted' || app.status === 'offer_sent' || app.status === 'shortlisted_email_sent') && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                        <p className="text-sm text-yellow-800">
                          <strong>⚠️ Note:</strong> This candidate is already {' '}
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
                  <div className={`p-4 rounded-lg border-2 ${
                    selectedApplication.offerAccepted || selectedApplication.status === 'offer_accepted'
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    <Label className="text-gray-600">Offer Status</Label>
                    {selectedApplication.offerAccepted || selectedApplication.status === 'offer_accepted' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-700">Offer Accepted ✓</p>
                          {selectedApplication.offerAcceptedAt && (
                            <p className="text-sm text-green-600">
                              Accepted on {format(new Date(selectedApplication.offerAcceptedAt!), 'dd MMM yyyy, HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <p className="font-medium text-yellow-700">Awaiting candidate response</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Information (Admin Only) */}
                {selectedApplication.status === 'hired' && selectedApplication.paymentStatus && (
                  <div className={`p-4 rounded-lg border-2 ${
                    selectedApplication.paymentStatus === 'completed' 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : selectedApplication.paymentStatus === 'pending'
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <Label className="text-gray-600">Payment Information</Label>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment Status:</span>
                        <Badge className={
                          selectedApplication.paymentStatus === 'completed' 
                            ? 'bg-emerald-600' 
                            : selectedApplication.paymentStatus === 'pending'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }>
                          {selectedApplication.paymentStatus === 'completed' ? '✓ Completed' : 
                           selectedApplication.paymentStatus === 'pending' ? 'Pending' : 
                           'Failed'}
                        </Badge>
                      </div>
                      
                      {selectedApplication.paymentStatus === 'completed' && (
                        <>
                          {selectedApplication.paymentDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Payment Date & Time:</span>
                              <span className="font-medium text-emerald-700">
                                {format(new Date(selectedApplication.paymentDate), 'dd MMMM yyyy, hh:mm a')}
                              </span>
                            </div>
                          )}
                          
                          {selectedApplication.paymentTransactionId && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Transaction ID:</span>
                              <code className="text-xs bg-white px-2 py-1 rounded border">
                                {selectedApplication.paymentTransactionId}
                              </code>
                            </div>
                          )}
                          
                          {selectedApplication.paymentAmount && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Payment Amount:</span>
                              <span className="font-bold text-emerald-700 text-lg">
                                ₹{selectedApplication.paymentAmount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          {selectedApplication.paymentReceiptUrl && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2">
                                <a 
                                  href={selectedApplication.paymentReceiptUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 p-2 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors flex-1"
                                >
                                  <FileText className="w-4 h-4 text-emerald-700" />
                                  <span className="font-medium text-emerald-700">Download Receipt</span>
                                  <Download className="w-3 h-3 text-emerald-700" />
                                </a>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(selectedApplication.paymentReceiptUrl, '_blank', 'noopener,noreferrer')}
                                  className="flex items-center gap-1 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                                >
                                  <Eye className="w-4 h-4 text-emerald-700" />
                                  <span className="text-emerald-700">View</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Joining Letter */}
                    {selectedApplication.joiningLetterPdfUrl && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <Label className="text-gray-700 font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-700" />
                          Joining Letter
                        </Label>
                        <div className="flex items-center gap-2 mt-3">
                          <a 
                            href={selectedApplication.joiningLetterPdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-2 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors flex-1"
                          >
                            <FileText className="w-4 h-4 text-purple-700" />
                            <span className="font-medium text-purple-700">
                              {selectedApplication.offerLetterId ? `Joining-Letter-${selectedApplication.offerLetterId}.pdf` : 'Joining-Letter.pdf'}
                            </span>
                            <Download className="w-3 h-3 text-purple-700" />
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedApplication.joiningLetterPdfUrl, '_blank', 'noopener,noreferrer')}
                            className="flex items-center gap-1 bg-purple-50 border-purple-300 hover:bg-purple-100"
                          >
                            <Eye className="w-4 h-4 text-purple-700" />
                            <span className="text-purple-700">View</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resume */}
                <div>
                  <Label className="text-gray-600">Resume</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <a 
                      href={selectedApplication.resume.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex-1"
                    >
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-600">{selectedApplication.resume.fileName}</span>
                      <ExternalLink className="w-4 h-4 text-blue-600 ml-auto" />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedApplication.resume.url, '_blank', 'noopener,noreferrer')}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </div>
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <Label className="text-gray-600">Cover Letter</Label>
                    <p className="mt-2 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedApplication.coverLetter}
                    </p>
                  </div>
                )}

                {/* Update Status Form */}
                <form onSubmit={handleUpdateStatus} className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="status">Update Status</Label>
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
                    <Label htmlFor="adminNotes">Admin Notes (Internal)</Label>
                    <Textarea
                      id="adminNotes"
                      value={updateForm.adminNotes}
                      onChange={(e) => setUpdateForm({ ...updateForm, adminNotes: e.target.value })}
                      placeholder="Add internal notes about this candidate..."
                      rows={3}
                    />
                  </div>

                  {selectedApplication.adminNotes && selectedApplication.reviewedBy && (
                    <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                      <p className="font-medium">Previous Notes:</p>
                      <p className="text-gray-700 mt-1">{selectedApplication.adminNotes}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        By {selectedApplication.reviewedBy.name} on{' '}
                        {selectedApplication.reviewedAt && format(new Date(selectedApplication.reviewedAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowDetailDialog(false)}>
                      Close
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                      Update Application
                    </Button>
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
              <DialogTitle>Delete Application</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this application from {selectedApplication?.fullName}?
                This will also delete the resume from Cloudinary. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Duplicates Dialog */}
        <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Duplicate Applications</DialogTitle>
              <DialogDescription>
                Select which job position to keep for candidates who applied to multiple positions. 
                All other applications from the same candidate (matched by email or phone) will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Positions to Keep</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
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
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`position-${position.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {position.title}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {duplicatePositions.length} position(s) have duplicate candidates • {selectedPosition.length} selected
                </p>
              </div>
              
              {selectedPosition.length > 0 && (
                <Alert>
                  <AlertDescription>
                    All applications from candidates who applied to multiple positions will be removed, 
                    except for their applications to the selected position(s).
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setSelectedPosition([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRemoveDuplicates} 
                disabled={removingDuplicates || selectedPosition.length === 0}
              >
                {removingDuplicates ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Duplicates
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Shortlist Dialog */}
        <Dialog open={showBulkShortlistDialog} onOpenChange={(open) => {
          if (!isBulkSending) setShowBulkShortlistDialog(open);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Shortlist Email to All</DialogTitle>
              <DialogDescription>
                {!isBulkSending && bulkEmailProgress.current === 0 ? (
                  <>Send shortlist notification emails to all <strong>{applications.length}</strong> applications on this page?</>
                ) : (
                  'Sending shortlist emails...'
                )}
              </DialogDescription>
            </DialogHeader>

            {isBulkSending && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{bulkEmailProgress.current} / {bulkEmailProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(bulkEmailProgress.current / bulkEmailProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {!isBulkSending && bulkEmailProgress.current > 0 && (
              <div className="space-y-4 py-4">
                <Alert className={bulkEmailResults.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                  <AlertDescription>
                    <div className="font-medium mb-2">Summary:</div>
                    <div className="space-y-1">
                      <div className="text-green-700">✓ Successfully sent: {bulkEmailResults.success}</div>
                      {bulkEmailResults.failed > 0 && (
                        <div className="text-red-700">✗ Failed: {bulkEmailResults.failed}</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {bulkEmailResults.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    <div className="font-medium text-sm text-red-700 mb-2">Errors:</div>
                    {bulkEmailResults.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
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
                  <Button variant="outline" onClick={() => setShowBulkShortlistDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkShortlist}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send to {applications.length} Applicants
                  </Button>
                </>
              ) : !isBulkSending ? (
                <Button onClick={() => {
                  setShowBulkShortlistDialog(false);
                  setBulkEmailProgress({ current: 0, total: 0 });
                  setBulkEmailResults({ success: 0, failed: 0, errors: [] });
                }}>
                  Close
                </Button>
              ) : (
                <Button disabled>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </Button>
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
              <DialogTitle>Send Offer Letter to All</DialogTitle>
              <DialogDescription>
                {!isBulkSending && bulkEmailProgress.current === 0 ? (
                  <>Send offer letter emails to <strong>{applications.filter(app => app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt).length}</strong> remaining applications with status "Shortlisted Email Sent"?</>
                ) : (
                  'Sending offer letters...'
                )}
              </DialogDescription>
            </DialogHeader>

            {isBulkSending && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{bulkEmailProgress.current} / {bulkEmailProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(bulkEmailProgress.current / bulkEmailProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {!isBulkSending && bulkEmailProgress.current > 0 && (
              <div className="space-y-4 py-4">
                <Alert className={bulkEmailResults.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                  <AlertDescription>
                    <div className="font-medium mb-2">Summary:</div>
                    <div className="space-y-1">
                      <div className="text-green-700">✓ Successfully sent: {bulkEmailResults.success}</div>
                      {bulkEmailResults.failed > 0 && (
                        <div className="text-red-700">✗ Failed: {bulkEmailResults.failed}</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {bulkEmailResults.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    <div className="font-medium text-sm text-red-700 mb-2">Errors:</div>
                    {bulkEmailResults.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
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
                  <Button variant="outline" onClick={() => setShowBulkOfferDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkOffer} disabled={applications.filter(app => app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt).length === 0}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Send to {applications.filter(app => app.status === 'shortlisted_email_sent' && !app.offerLetterGeneratedAt).length} Applicants
                  </Button>
                </>
              ) : !isBulkSending ? (
                <Button onClick={() => {
                  setShowBulkOfferDialog(false);
                  setBulkEmailProgress({ current: 0, total: 0 });
                  setBulkEmailResults({ success: 0, failed: 0, errors: [] });
                }}>
                  Close
                </Button>
              ) : (
                <Button disabled>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
