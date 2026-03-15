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
import { Shield, UserPlus, UserMinus, Users, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
              <p className="text-gray-600">View and manage administrator accounts</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{admins.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{allUsers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Eligible for Promotion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{allUsers.filter(u => u.role !== 'admin').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Current Admins */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Current Administrators</CardTitle>
                <CardDescription>All users with admin privileges</CardDescription>
              </div>
              <Button onClick={() => setShowPromoteDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Promote User to Admin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No admins found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell className="font-medium">
                        {admin.name}
                        {admin.uid === user?.uid && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.phone || '-'}</TableCell>
                      <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <Shield className="w-3 h-3 mr-1" /> Admin
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.uid !== user?.uid ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(admin as any);
                              setShowDemoteDialog(true);
                            }}
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Demote
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500">Current User</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">ℹ️ Admin Management Info</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <p>• All admins have equal permissions - there is no hierarchy</p>
            <p>• You can promote any user (customer or turf owner) to admin</p>
            <p>• Admins can demote other admins back to their original role</p>
            <p>• You cannot demote yourself - ask another admin to do it</p>
            <p>• At least one admin should always exist in the system</p>
          </CardContent>
        </Card>
      </div>

      {/* Promote User Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Promote User to Admin</DialogTitle>
            <DialogDescription>
              Select a user to give them administrator privileges
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {eligibleUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {searchQuery ? 'No users found matching your search' : 'All users are already admins'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleUsers.map((eligibleUser) => (
                      <TableRow key={eligibleUser._id}>
                        <TableCell className="font-medium">{eligibleUser.name}</TableCell>
                        <TableCell>{eligibleUser.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {eligibleUser.role === 'owner' ? 'Turf Owner' : 'Customer'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
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
                            <UserPlus className="w-4 h-4 mr-1" />
                            Promote
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote Admin Dialog */}
      <Dialog open={showDemoteDialog} onOpenChange={setShowDemoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demote Administrator</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove admin privileges from {selectedUser?.name}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                This action will remove all admin privileges. The user will revert to their original role.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDemoteDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDemoteAdmin}
              disabled={actionLoading}
            >
              {actionLoading ? 'Demoting...' : 'Confirm Demotion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
