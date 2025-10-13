'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Save, User, Building, IndianRupee, MapPin, LogOut } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

// Import our custom components
import { UpiUploader } from '@/components/owner/UpiUploader';
import { TurfImagesUploader } from '@/components/owner/TurfImagesUploader';
import { SportsSelection } from '@/components/owner/SportsSelection';
import { AmenitiesSelector } from '@/components/owner/AmenitiesSelector';
import { AboutSection } from '@/components/owner/AboutSection';
import { SlotManager } from '@/components/owner/SlotManager';
import BookingManager from '@/components/owner/BookingManager';

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
  phone: string;
  upiQrCode: CloudinaryImage | null;
  turfImages: CloudinaryImage[];
  sportsOffered: string[];
  customSport: string;
  amenities: string[];
  about: string;
  availableSlots: TimeSlot[];
  pricing: number;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

function TurfOwnerDashboard() {
  const { user, firebaseUser, logout, isVerifiedOwner } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState<OwnerFormData>({
    businessName: '',
    phone: '',
    upiQrCode: null,
    turfImages: [],
    sportsOffered: [],
    customSport: '',
    amenities: [],
    about: '',
    availableSlots: [],
    pricing: 0,
    location: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  // Load existing owner data on component mount
  useEffect(() => {
    const loadOwnerData = async () => {
      if (!firebaseUser) return;
      
      setLoading(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        
        // Check if we're editing an existing turf
        const urlParams = new URLSearchParams(window.location.search);
        const turfId = urlParams.get('turfId');
        
        if (turfId) {
          // Load specific turf for editing
          setIsEditMode(true);
          const turfResponse = await fetch(`/api/turfs/owner/${turfId}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });

          if (turfResponse.ok) {
            const turfData = await turfResponse.json();
            const turf = turfData.turf;
          
            setFormData({
              businessName: turf.name || turf.contactInfo?.businessName || '',
              phone: turf.contactInfo?.phone || '',
              upiQrCode: turf.paymentInfo?.upiQrCode || null,
              turfImages: turf.images || [],
              sportsOffered: turf.sportsOffered || [],
              customSport: turf.customSport || '',
              amenities: turf.amenities || [],
              about: turf.description || '',
              availableSlots: turf.availableSlots || [],
              pricing: turf.pricing || 0,
              location: {
                address: turf.location?.address || '',
                city: turf.location?.city || '',
                state: turf.location?.state || '',
                pincode: turf.location?.pincode || ''
              }
            });
          }
        } else {
          // Fallback to User collection
          const userResponse = await fetch('/api/owner/update', {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            const ownerData = userData.user;
            
            setFormData({
              businessName: ownerData.businessName || '',
              phone: ownerData.phone || '',
              upiQrCode: ownerData.upiQrCode || null,
              turfImages: ownerData.turfImages || [],
              sportsOffered: ownerData.sportsOffered || [],
              customSport: ownerData.customSport || '',
              amenities: ownerData.amenities || [],
              about: ownerData.about || '',
              availableSlots: ownerData.availableSlots || [],
              pricing: ownerData.pricing || 0,
              location: {
                address: ownerData.location?.address || '',
                city: ownerData.location?.city || '',
                state: ownerData.location?.state || '',
                pincode: ownerData.location?.pincode || ''
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading owner data:', error);
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
      console.error('Logout failed:', error);
    }
  };

  const validateForm = (): boolean => {
    // Reset previous messages
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!formData.upiQrCode) {
      setError('UPI QR code is required');
      return false;
    }

    if (formData.turfImages.length === 0) {
      setError('At least one turf image is required');
      return false;
    }

    if (formData.sportsOffered.length === 0) {
      setError('At least one sport must be selected');
      return false;
    }

    if (formData.sportsOffered.includes('Other') && !formData.customSport.trim()) {
      setError('Custom sport name is required when "Other" is selected');
      return false;
    }

    if (!formData.about.trim()) {
      setError('About section is required');
      return false;
    }

    if (formData.availableSlots.length === 0) {
      setError('At least one time slot is required');
      return false;
    }

    if (!formData.pricing || formData.pricing <= 0) {
      setError('Valid pricing is required');
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
      
      // First, save/update the user profile
      const userResponse = await fetch('/api/owner/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!userResponse.ok) {
        const userData = await userResponse.json();
        setError(userData.error || 'Failed to update user profile');
        return;
      }

      // Then, create/update the turf entry
      const urlParams = new URLSearchParams(window.location.search);
      const turfId = urlParams.get('turfId');
      
      const turfData = {
        name: formData.businessName || 'My Turf',
        description: formData.about,
        images: formData.turfImages,
        sportsOffered: formData.sportsOffered,
        customSport: formData.customSport,
        amenities: formData.amenities,
        availableSlots: formData.availableSlots,
        pricing: formData.pricing,
        location: formData.location,
        upiQrCode: formData.upiQrCode,
        ...(turfId && { turfId }) // Include turfId for updates
      };

      const turfMethod = turfId ? 'PUT' : 'POST';
      
      const turfResponse = await fetch('/api/turfs/manage', {
        method: turfMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(turfData),
      });

      if (!turfResponse.ok) {
        const turfError = await turfResponse.json();
        setError(turfError.error || 'Failed to save turf');
        return;
      }

      setSuccess(turfId ? 'Turf updated successfully!' : 'Turf created successfully!');
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/owner/dashboard';
      }, 1500);
      
    } catch (error) {
      console.error('Error saving owner data:', error);
      setError('An error occurred while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if owner is verified
  if (!isVerifiedOwner()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Account Not Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Verification Required</h3>
                <p className="text-gray-600 mb-4">
                  Your account is currently{' '}
                  {user?.verificationStatus === 'pending' && 'pending verification'}
                  {user?.verificationStatus === 'rejected' && 'not approved'}.
                </p>
                {user?.verificationStatus === 'pending' && (
                  <p className="text-sm text-gray-500 mb-4">
                    Please wait for the administrator to verify your payment and approve your account.
                    You will be notified once your account is approved.
                  </p>
                )}
                {user?.verificationStatus === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-700">
                      <strong>Rejection Reason:</strong> {user?.rejectionReason || 'No reason provided'}
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      Please contact support for more information or to reapply.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/owner/dashboard">
                  <Button variant="outline">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/">
                  <Button>
                    Go to Home
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/owner/dashboard">
                <Button variant="ghost" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Turf' : 'Add New Turf'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEditMode ? 'Update your turf details' : 'Create a new turf facility'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Owner
                </Badge>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="business-info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="business-info">Business Info</TabsTrigger>
            <TabsTrigger value="turf-details">Turf Details</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="business-info" className="space-y-6">
            {/* Basic Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="Your turf business name"
                      value={formData.businessName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessName: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="Contact phone number"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        phone: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pricing" className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Pricing per Hour *
                  </Label>
                  <Input
                    id="pricing"
                    type="number"
                    placeholder="Enter hourly rate"
                    value={formData.pricing || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: Number(e.target.value)
                    })}
                    className="max-w-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* UPI QR Code Upload */}
            <UpiUploader 
              value={formData.upiQrCode}
              onChange={(image) => setFormData({
                ...formData,
                upiQrCode: image
              })}
            />
          </TabsContent>

          <TabsContent value="turf-details" className="space-y-6">
            {/* Turf Images Upload */}
            <TurfImagesUploader 
              value={formData.turfImages}
              onChange={(images) => setFormData({
                ...formData,
                turfImages: images
              })}
            />

            {/* Sports Selection */}
            <SportsSelection 
              value={formData.sportsOffered}
              customSport={formData.customSport}
              onSportsChange={(sports) => setFormData({
                ...formData,
                sportsOffered: sports
              })}
              onCustomSportChange={(sport) => setFormData({
                ...formData,
                customSport: sport
              })}
            />

            {/* Amenities */}
            <AmenitiesSelector 
              value={formData.amenities}
              onChange={(amenities) => setFormData({
                ...formData,
                amenities
              })}
            />

            {/* About Section */}
            <AboutSection 
              value={formData.about}
              onChange={(about) => setFormData({
                ...formData,
                about
              })}
            />
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-6">
            {/* Time Slots Management */}
            <SlotManager 
              value={formData.availableSlots}
              onChange={(slots) => setFormData({
                ...formData,
                availableSlots: slots
              })}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={formData.location?.address || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        address: e.target.value
                      }
                    })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.location?.city || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          city: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={formData.location?.state || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          state: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="Pincode"
                      value={formData.location?.pincode || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          pincode: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <BookingManager 
              ownerId={user?.uid || ''} 
              turfId={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('turfId') || undefined : undefined}
              turfName={isEditMode ? formData.businessName : undefined}
            />
          </TabsContent>
        </Tabs>

        {/* Save Button - Only show when not in bookings tab */}
        <div className="flex justify-end pt-6">
          <Button 
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-green-500 hover:bg-green-600 min-w-[120px]"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
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
