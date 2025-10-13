'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock, 
  User, 
  MapPin,
  CheckCircle,
  XCircle,
  ArrowRight,
  QrCode,
  Upload,
  Bell,
  Eye
} from 'lucide-react';

export default function BookingFlowDemo() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Browse & Select Turf",
      description: "Customer browses available turfs and clicks 'Book Now'",
      icon: <Eye className="w-6 h-6" />,
      details: [
        "Customer visits /browse page",
        "Views available turfs with ratings, pricing, location",
        "Clicks 'Book Now' on desired turf",
        "Redirected to /book/[turfId] page"
      ]
    },
    {
      id: 2,
      title: "View Turf Details & Select Slot",
      description: "Customer views detailed turf information and selects available time slot",
      icon: <Calendar className="w-6 h-6" />,
      details: [
        "Displays turf images, amenities, sports offered",
        "Shows available time slots by day",
        "Booked slots are disabled and marked",
        "Customer selects desired slot",
        "Clicks 'Proceed to Payment'"
      ]
    },
    {
      id: 3,
      title: "QR Code Payment",
      description: "Customer scans UPI QR code and makes payment",
      icon: <QrCode className="w-6 h-6" />,
      details: [
        "Payment modal opens with turf owner's UPI QR code",
        "Customer scans QR with their UPI app",
        "Makes payment of exact amount",
        "Takes screenshot of payment confirmation"
      ]
    },
    {
      id: 4,
      title: "Upload Payment Screenshot",
      description: "Customer uploads payment confirmation screenshot",
      icon: <Upload className="w-6 h-6" />,
      details: [
        "Customer clicks 'I've Made Payment'",
        "Uploads screenshot of payment confirmation",
        "System validates image format and size",
        "Booking request is created with 'pending' status"
      ]
    },
    {
      id: 5,
      title: "Owner Notification",
      description: "Turf owner receives notification of new booking request",
      icon: <Bell className="w-6 h-6" />,
      details: [
        "Owner sees new booking in dashboard 'Bookings' tab",
        "Views customer details and payment screenshot",
        "Can approve or reject the booking",
        "Payment screenshot is displayed for verification"
      ]
    },
    {
      id: 6,
      title: "Booking Approval/Rejection",
      description: "Owner approves or rejects the booking request",
      icon: <CheckCircle className="w-6 h-6" />,
      details: [
        "Owner clicks 'Approve' or 'Reject'",
        "If approved: slot becomes unavailable for others",
        "If rejected: slot remains available",
        "Booking status updates in database",
        "Customer can track status in their dashboard"
      ]
    }
  ];

  const mockTurfData = {
    businessName: "Green Valley Sports Complex",
    location: "MG Road, Sangli, Maharashtra - 416416",
    pricing: 800,
    sports: ["Football", "Cricket", "Badminton"],
    amenities: ["Floodlights", "Parking", "Washroom"],
    availableSlots: [
      { day: "Monday", time: "06:00 - 08:00", available: true },
      { day: "Monday", time: "08:00 - 10:00", available: false },
      { day: "Monday", time: "18:00 - 20:00", available: true },
    ]
  };

  const mockBookingData = {
    customer: {
      name: "Rahul Sharma",
      email: "rahul@example.com",
      phone: "+91 98765 43210"
    },
    slot: {
      day: "Monday",
      time: "18:00 - 20:00"
    },
    amount: 800,
    status: "pending"
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Turf Booking Flow
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This demonstrates the complete end-to-end booking process from customer selection 
            to owner approval, including UPI payment integration with screenshot verification.
          </p>
        </div>

        {/* Flow Steps */}
        <div className="grid gap-6 mb-8">
          {steps.map((step) => (
            <Card 
              key={step.id} 
              className={`transition-all duration-300 ${
                currentStep === step.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    currentStep === step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentStep === step.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step.id}
                      </span>
                      {step.title}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">{step.description}</p>
                  </div>
                  {currentStep === step.id && (
                    <Badge className="bg-blue-600">Current</Badge>
                  )}
                </div>
              </CardHeader>
              {currentStep === step.id && (
                <CardContent>
                  <div className="ml-16">
                    <h4 className="font-medium text-gray-900 mb-2">Process Details:</h4>
                    <ul className="space-y-1">
                      {step.details.map((detail, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <ArrowRight className="w-3 h-3 text-blue-600" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Demo Data Sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Mock Turf Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Sample Turf Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium">{mockTurfData.businessName}</h3>
                  <p className="text-sm text-gray-600">{mockTurfData.location}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Pricing:</span>
                  <span className="text-lg font-bold text-green-600">₹{mockTurfData.pricing}</span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Sports:</h4>
                  <div className="flex gap-1 flex-wrap">
                    {mockTurfData.sports.map((sport) => (
                      <Badge key={sport} variant="secondary">{sport}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Available Slots:</h4>
                  <div className="space-y-1">
                    {mockTurfData.availableSlots.map((slot, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{slot.day}: {slot.time}</span>
                        {slot.available ? (
                          <Badge variant="outline" className="text-green-600">Available</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">Booked</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mock Booking Request */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Sample Booking Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Customer Details:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Name: {mockBookingData.customer.name}</p>
                    <p>Email: {mockBookingData.customer.email}</p>
                    <p>Phone: {mockBookingData.customer.phone}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium">Booking Details:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Day: {mockBookingData.slot.day}</p>
                    <p>Time: {mockBookingData.slot.time}</p>
                    <p>Amount: ₹{mockBookingData.amount}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    {mockBookingData.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Endpoints Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Booking Management:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/bookings/create</code> - Create booking</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/bookings/owner/[id]</code> - Owner bookings</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/bookings/customer/[id]</code> - Customer bookings</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">PUT /api/bookings/update-status</code> - Approve/Reject</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Turf Management:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/turfs/[id]</code> - Get turf with availability</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /browse</code> - Browse turfs</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /book/[id]</code> - Booking page</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            variant="outline"
          >
            Previous Step
          </Button>
          <Button 
            onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
            disabled={currentStep === 6}
          >
            Next Step
          </Button>
        </div>

        {/* Key Features */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Key Features Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Customer Features
                </h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Browse and filter turfs</li>
                  <li>• View detailed turf information</li>
                  <li>• Real-time slot availability</li>
                  <li>• UPI QR code payment</li>
                  <li>• Payment screenshot upload</li>
                  <li>• Booking status tracking</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Owner Features
                </h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Booking request notifications</li>
                  <li>• Payment screenshot verification</li>
                  <li>• Approve/reject bookings</li>
                  <li>• Customer contact details</li>
                  <li>• Revenue tracking</li>
                  <li>• Slot management</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  System Features
                </h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Real-time availability updates</li>
                  <li>• Cloudinary image storage</li>
                  <li>• MongoDB data persistence</li>
                  <li>• Responsive UI design</li>
                  <li>• Error handling & validation</li>
                  <li>• Status-based workflows</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}