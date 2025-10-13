'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Mail, Lock, User, Phone, Building, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

// Define user types
type UserRole = 'customer' | 'owner';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [ownerForm, setOwnerForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, role: UserRole) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const formData = role === 'customer' ? customerForm : ownerForm;
      
      // Validate form
      if (!formData.acceptTerms) {
        throw new Error('You must accept the terms and conditions');
      }
      
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (formData.password.length < 6) {
        throw new Error('Password should be at least 6 characters');
      }

      // Prepare registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        phone: formData.phone,
        businessName: role === 'owner' ? ownerForm.businessName : undefined,
      };

      // Register user using AuthContext
      await register(registrationData);
      
      setSuccess('Registration successful! Please check your email to verify your account before logging in.');
      
      // Reset form
      if (role === 'customer') {
        setCustomerForm({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          acceptTerms: false
        });
      } else {
        setOwnerForm({
          name: '',
          email: '',
          phone: '',
          businessName: '',
          password: '',
          confirmPassword: '',
          acceptTerms: false
        });
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-4">
            <div className="bg-green-500 rounded-lg p-2 mr-3">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-600">OutFyld</h1>
              <p className="text-xs text-gray-500">Sangli & Miraj</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Join OutFyld</h2>
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="owner">Turf Owner</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customer">
                <form onSubmit={(e) => handleSubmit(e, 'customer')} className="space-y-4">
                  <div>
                    <Label htmlFor="customer-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="customer-name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customer-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="customer-email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customer-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="customer-phone"
                        placeholder="+91 98765 43210"
                        className="pl-10"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="customer-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="customer-password"
                        type="password"
                        placeholder="Create a strong password"
                        className="pl-10"
                        value={customerForm.password}
                        onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customer-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-40" />
                      <Input
                        id="customer-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={customerForm.confirmPassword}
                        onChange={(e) => setCustomerForm({...customerForm, confirmPassword: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="customer-terms"
                      checked={customerForm.acceptTerms}
                      onCheckedChange={(checked) => setCustomerForm({...customerForm, acceptTerms: checked as boolean})}
                      required
                    />
                    <Label htmlFor="customer-terms" className="text-sm">
                      I agree to the{' '}
                      <Link href="/terms" className="text-green-600 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-green-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600" 
                    size="lg"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Customer Account'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="owner">
                <form onSubmit={(e) => handleSubmit(e, 'owner')} className="space-y-4">
                  <div>
                    <Label htmlFor="owner-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="owner-name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={ownerForm.name}
                        onChange={(e) => setOwnerForm({...ownerForm, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="owner-business">Business/Turf Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="owner-business"
                        placeholder="Green Field Sports Complex"
                        className="pl-10"
                        value={ownerForm.businessName}
                        onChange={(e) => setOwnerForm({...ownerForm, businessName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="owner-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="owner-email"
                        type="email"
                        placeholder="owner@example.com"
                        className="pl-10"
                        value={ownerForm.email}
                        onChange={(e) => setOwnerForm({...ownerForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="owner-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="owner-phone"
                        placeholder="+91 98765 43210"
                        className="pl-10"
                        value={ownerForm.phone}
                        onChange={(e) => setOwnerForm({...ownerForm, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="owner-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="owner-password"
                        type="password"
                        placeholder="Create a strong password"
                        className="pl-10"
                        value={ownerForm.password}
                        onChange={(e) => setOwnerForm({...ownerForm, password: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="owner-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="owner-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={ownerForm.confirmPassword}
                        onChange={(e) => setOwnerForm({...ownerForm, confirmPassword: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="owner-terms"
                      checked={ownerForm.acceptTerms}
                      onCheckedChange={(checked) => setOwnerForm({...ownerForm, acceptTerms: checked as boolean})}
                      required
                    />
                    <Label htmlFor="owner-terms" className="text-sm">
                      I agree to the{' '}
                      <Link href="/terms" className="text-green-600 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-green-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600" 
                    size="lg"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Owner Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-green-600 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}