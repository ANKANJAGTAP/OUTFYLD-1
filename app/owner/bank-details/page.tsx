'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, CheckCircle, AlertCircle } from 'lucide-react';

export default function BankDetailsPage() {
  const { user, initialLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingDetails, setExistingDetails] = useState<any>(null);

  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    accountType: '' as 'savings' | 'current' | '',
    panNumber: '',
    gstNumber: '',
  });

  // Redirect if not owner
  useEffect(() => {
    if (!initialLoading && (!user || user.role !== 'owner')) {
      router.push('/');
    }
  }, [user, initialLoading, router]);

  // Fetch existing bank details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`/api/owner/bank-details?uid=${user.uid}`);
        const data = await response.json();
        if (data.success && data.hasBankDetails) {
          setExistingDetails(data.bankDetails);
        }
      } catch (err) {
        console.error('Error fetching bank details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDetails();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.accountHolderName || !formData.accountNumber || !formData.ifscCode ||
        !formData.bankName || !formData.accountType || !formData.panNumber) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      setError('Account numbers do not match');
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode)) {
      setError('Invalid IFSC code format (e.g., SBIN0001234)');
      return;
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.panNumber)) {
      setError('Invalid PAN number format (e.g., ABCDE1234F)');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/owner/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUid: user?.uid,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode.toUpperCase(),
          bankName: formData.bankName,
          accountType: formData.accountType,
          panNumber: formData.panNumber.toUpperCase(),
          gstNumber: formData.gstNumber || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save bank details');
      }

      setSuccess(data.message);
      setExistingDetails(data.bankDetails);

      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Show existing bank details
  if (existingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-6 md:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Button onClick={() => router.push('/owner/dashboard')} variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Bank Details
                </CardTitle>
                <Badge className={existingDetails.bankDetailsVerified ? 'bg-green-600' : 'bg-yellow-500'}>
                  {existingDetails.bankDetailsVerified ? '✓ Verified' : 'Pending'}
                </Badge>
              </div>
              <CardDescription>Your linked bank account for receiving booking payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account Holder</span>
                  <span className="font-medium">{existingDetails.accountHolderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account Number</span>
                  <span className="font-medium font-mono">{existingDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">IFSC Code</span>
                  <span className="font-medium font-mono">{existingDetails.ifscCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bank</span>
                  <span className="font-medium">{existingDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <span className="font-medium capitalize">{existingDetails.accountType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">PAN</span>
                  <span className="font-medium font-mono">{existingDetails.panNumber}</span>
                </div>
              </div>

              {success && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button onClick={() => router.push('/owner/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
              <Button onClick={() => setExistingDetails(null)} variant="outline">
                Update Details
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 md:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Button onClick={() => router.push('/owner/dashboard')} variant="outline" size="sm">
            ← Back to Dashboard
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Add Bank Details
            </CardTitle>
            <CardDescription>
              Add your bank account to receive booking payments directly. 90% of each booking goes to your account.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Your bank details are securely stored and used only for transferring booking payments to your account.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="Enter name as per bank account"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  type="password"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmAccountNumber">Confirm Account Number *</Label>
                <Input
                  id="confirmAccountNumber"
                  value={formData.confirmAccountNumber}
                  onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value })}
                  placeholder="Re-enter account number"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="E.g., SBIN0001234"
                    required
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="E.g., State Bank of India"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value: 'savings' | 'current') =>
                    setFormData({ ...formData, accountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="current">Current Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="E.g., ABCDE1234F"
                    required
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="E.g., 27AAA..."
                    maxLength={15}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/owner/dashboard')}
                disabled={submitting}
              >
                Skip for Now
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Bank Details'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
