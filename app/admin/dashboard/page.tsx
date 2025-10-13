'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Shield, CheckCircle, XCircle, Clock, IndianRupee, User, Building, Mail, Phone, LogOut } from 'lucide-react';
import Link from 'next/link';

interface TurfOwner {
  _id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  subscriptionPlan?: 'basic' | 'premium';
  subscriptionAmount?: number;
  paymentScreenshot?: {
    url: string;
    public_id: string;
  };
  verificationStatus: 'pending' | 'approved' | 'rejected';
  paymentVerified: boolean;
  paymentDetails?: {
    amount?: number;
    date?: Date;
    transactionId?: string;
    method?: string;
  };
  rejectionReason?: string;
  createdAt: Date;
}

export default function AdminDashboard() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();
  const [owners, setOwners] = useState<TurfOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<TurfOwner | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  
  // Payment verification form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    transactionId: '',
    method: 'UPI',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Rejection form
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Revoke form
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeAction, setRevokeAction] = useState<'suspend' | 'revoke'>('suspend');
  
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  // Fetch pending turf owners
  const fetchOwners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/owners');
      if (!response.ok) throw new Error('Failed to fetch owners');
      const data = await response.json();
      setOwners(data.owners || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOwners();
    }
  }, [user]);

  // Handle verify owner
  const handleVerifyOwner = async () => {
    if (!selectedOwner) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/verify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: selectedOwner._id,
          paymentDetails: {
            amount: parseFloat(paymentForm.amount),
            transactionId: paymentForm.transactionId,
            method: paymentForm.method,
            date: new Date(paymentForm.date),
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to verify owner');
      
      await fetchOwners();
      setShowVerifyDialog(false);
      setSelectedOwner(null);
      setPaymentForm({
        amount: '',
        transactionId: '',
        method: 'UPI',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject owner
  const handleRejectOwner = async () => {
    if (!selectedOwner || !rejectionReason.trim()) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/reject-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: selectedOwner._id,
          rejectionReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to reject owner');
      
      await fetchOwners();
      setShowRejectDialog(false);
      setSelectedOwner(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle revoke/suspend owner membership
  const handleRevokeOwner = async () => {
    if (!selectedOwner || !revokeReason.trim()) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/revoke-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: selectedOwner._id,
          reason: revokeReason,
          action: revokeAction,
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${revokeAction} owner`);
      
      await fetchOwners();
      setShowRevokeDialog(false);
      setSelectedOwner(null);
      setRevokeReason('');
      setRevokeAction('suspend');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (initialLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const pendingOwners = owners.filter(o => o.verificationStatus === 'pending');
  const approvedOwners = owners.filter(o => o.verificationStatus === 'approved');
  const rejectedOwners = owners.filter(o => o.verificationStatus === 'rejected');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-4 md:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm md:text-base text-gray-600">Manage turf owner verifications</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/manage-admins">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Shield className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Manage </span>Admins
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <User className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Go to </span>Home
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              className="text-xs sm:text-sm"
            >
              <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                Pending Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-yellow-600">{pendingOwners.length}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Approved Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-green-600">{approvedOwners.length}</div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 flex items-center">
                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                Rejected Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-red-600">{rejectedOwners.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Owners Table */}
        <Card className="mb-6 md:mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardTitle className="text-lg md:text-xl">Pending Verifications</CardTitle>
            <CardDescription className="text-sm">Turf owners awaiting verification and payment confirmation</CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {pendingOwners.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending verifications</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">Name</TableHead>
                      <TableHead className="text-xs md:text-sm hidden lg:table-cell">Business Name</TableHead>
                      <TableHead className="text-xs md:text-sm">Plan</TableHead>
                      <TableHead className="text-xs md:text-sm">Amount</TableHead>
                      <TableHead className="text-xs md:text-sm hidden md:table-cell">Payment</TableHead>
                      <TableHead className="text-xs md:text-sm hidden xl:table-cell">Phone</TableHead>
                      <TableHead className="text-xs md:text-sm hidden xl:table-cell">Registered</TableHead>
                      <TableHead className="text-xs md:text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOwners.map((owner) => (
                      <TableRow key={owner._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-xs md:text-sm">{owner.name}</TableCell>
                        <TableCell className="text-xs md:text-sm hidden lg:table-cell">{owner.businessName || '-'}</TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {owner.subscriptionPlan ? (
                            <Badge variant={owner.subscriptionPlan === 'premium' ? 'default' : 'secondary'} className="text-xs">
                              {owner.subscriptionPlan === 'premium' ? 'Premium' : 'Basic'}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {owner.subscriptionAmount ? `₹${owner.subscriptionAmount}/mo` : '-'}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell">
                          {owner.paymentScreenshot ? (
                            <a 
                              href={owner.paymentScreenshot.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              View
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden xl:table-cell">{owner.phone || '-'}</TableCell>
                        <TableCell className="text-xs md:text-sm hidden xl:table-cell">{new Date(owner.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col lg:flex-row gap-1 lg:gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="default"
                              className="text-xs"
                              onClick={() => {
                                setSelectedOwner(owner);
                                // Pre-fill subscription amount if available
                                if (owner.subscriptionAmount) {
                                  setPaymentForm(prev => ({
                                    ...prev,
                                    amount: owner.subscriptionAmount!.toString()
                                  }));
                                }
                                setShowVerifyDialog(true);
                              }}
                            >
                              <CheckCircle className="w-3 h-3 lg:mr-1" /> <span className="hidden lg:inline">Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              onClick={() => {
                                setSelectedOwner(owner);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="w-3 h-3 lg:mr-1" /> <span className="hidden lg:inline">Reject</span>
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

        {/* Approved Owners Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Approved Owners</CardTitle>
            <CardDescription>Verified turf owners who can list their properties</CardDescription>
          </CardHeader>
          <CardContent>
            {approvedOwners.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No approved owners yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Approved On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedOwners.map((owner) => (
                    <TableRow key={owner._id}>
                      <TableCell className="font-medium">{owner.name}</TableCell>
                      <TableCell>{owner.businessName || '-'}</TableCell>
                      <TableCell>
                        {owner.paymentDetails?.amount ? (
                          <span className="flex items-center">
                            <IndianRupee className="w-4 h-4" />
                            {owner.paymentDetails.amount}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{owner.paymentDetails?.transactionId || '-'}</TableCell>
                      <TableCell>{owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{getStatusBadge(owner.verificationStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedOwner(owner);
                            setShowRevokeDialog(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Rejected Owners Table */}
        {rejectedOwners.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rejected Applications</CardTitle>
              <CardDescription>Applications that were not approved</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedOwners.map((owner) => (
                    <TableRow key={owner._id}>
                      <TableCell className="font-medium">{owner.name}</TableCell>
                      <TableCell>{owner.businessName || '-'}</TableCell>
                      <TableCell>{owner.email}</TableCell>
                      <TableCell>{owner.rejectionReason || '-'}</TableCell>
                      <TableCell>{getStatusBadge(owner.verificationStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verify Owner Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Turf Owner</DialogTitle>
            <DialogDescription>
              Confirm payment details to approve {selectedOwner?.name} as a verified turf owner
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 5000"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="e.g., TXN123456789"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <select
                id="method"
                title="Payment Method"
                className="w-full border border-gray-300 rounded-md p-2"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleVerifyOwner} disabled={actionLoading || !paymentForm.amount || !paymentForm.transactionId}>
              {actionLoading ? 'Approving...' : 'Approve & Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Owner Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedOwner?.name}&apos;s application
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a clear reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectOwner} 
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke/Suspend Owner Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Owner Membership</DialogTitle>
            <DialogDescription>
              This will revoke {selectedOwner?.name}&apos;s access to add turfs. Choose action type and provide a reason.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <select
                id="action"
                title="Action Type"
                className="w-full border border-gray-300 rounded-md p-2"
                value={revokeAction}
                onChange={(e) => setRevokeAction(e.target.value as 'suspend' | 'revoke')}
              >
                <option value="suspend">Suspend (Temporary - can be re-approved)</option>
                <option value="revoke">Revoke (Permanent - reject completely)</option>
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Suspend:</strong> Sets owner status to &quot;pending&quot; - they can view dashboard but cannot add turfs. You can re-approve them later.
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                <strong>Revoke:</strong> Sets owner status to &quot;rejected&quot; - completely revokes access. More permanent action.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="revoke-reason">Reason for {revokeAction === 'suspend' ? 'Suspension' : 'Revocation'}</Label>
              <Textarea
                id="revoke-reason"
                placeholder="e.g., Policy violation, fraudulent activity, payment issues..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRevokeOwner} 
              disabled={actionLoading || !revokeReason.trim()}
            >
              {actionLoading ? `${revokeAction === 'suspend' ? 'Suspending' : 'Revoking'}...` : `${revokeAction === 'suspend' ? 'Suspend' : 'Revoke'} Membership`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
