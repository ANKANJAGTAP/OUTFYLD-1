'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Award, Gift, ArrowLeft, Trophy, Star, History as HistoryIcon, CircleDollarSign, Calendar, MapPin, Info } from 'lucide-react';
import React, { useState, useEffect } from 'react';

function PlayerLoyaltyContent() {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLoyaltyData = async () => {
      try {
        const response = await fetch(`/api/loyalty/customer/${user.uid}`);
        const result = await response.json();
        
        if (result.success) {
          setLoyaltyData(result.data);
        }
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltyData();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  const loyaltyStats = {
    currentPoints: loyaltyData?.currentPoints || 0,
    tier: loyaltyData?.tier || 'Bronze',
    pointsToNextTier: loyaltyData?.pointsToNextTier || 0,
    nextTier: loyaltyData?.nextTier || 'Silver',
    progressValue: loyaltyData?.progressValue || 0
  };

  const recentTransactions = loyaltyData?.recentTransactions?.map((tx: any, index: number) => ({
    id: tx._id || index,
    type: tx.type,
    amount: tx.type === 'earned' ? `+${tx.amount}` : `-${tx.amount}`,
    description: tx.description,
    date: new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <a href="/dashboard/player">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border hover:bg-green-50">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-500" />
              Loyalty Rewards
            </h1>
            <p className="text-sm text-gray-500">Track your points, check your tier, and redeem rewards.</p>
          </div>
        </div>

        {/* Loyalty Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <Card className="md:col-span-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-sm">
             <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-green-900">Points Balance</CardTitle>
                 <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 font-semibold">
                   <Trophy className="h-3 w-3 mr-1" />
                   {loyaltyStats.tier}
                 </Badge>
               </div>
             </CardHeader>
             <CardContent>
               <div className="flex items-end gap-2 mb-6">
                 <span className="text-5xl font-extrabold text-green-700">{loyaltyStats.currentPoints}</span>
                 <span className="text-lg text-green-600 font-medium mb-1">pts</span>
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between text-sm text-gray-600 font-medium">
                   <span>{loyaltyStats.tier}</span>
                   <span>{loyaltyStats.nextTier}</span>
                 </div>
                 <Progress value={loyaltyStats.progressValue} className="h-2 bg-green-100" />
                 <p className="text-xs text-gray-500">
                   Earn <strong className="text-green-700">{loyaltyStats.pointsToNextTier} more points</strong> to unlock {loyaltyStats.nextTier} tier benefits.
                 </p>
               </div>
             </CardContent>
           </Card>

           <Card className="flex flex-col justify-between shadow-sm border-gray-200">
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Gift className="h-5 w-5 text-purple-500" /> 
                   Use Points
                 </CardTitle>
                 <CardDescription>Apply points as discount on your bookings</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="bg-gray-50 border rounded-lg p-4 text-center">
                   <span className="block text-2xl font-bold text-gray-900 mb-1">₹{Math.floor(loyaltyStats.currentPoints / 10)}</span>
                   <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available Discount</span>
                 </div>
                 <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                   <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                   <p>You can apply your loyalty points for a discount during the checkout step of your next booking.</p>
                 </div>
               </CardContent>
            </Card>
        </div>

        {/* Ways to earn & History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

           <Card className="shadow-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2 text-lg">
                 <Star className="h-5 w-5 text-blue-500" />
                 Ways to Earn
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-50 rounded-full">
                     <Calendar className="h-4 w-4 text-blue-600" />
                   </div>
                   <div>
                     <p className="font-medium text-sm text-gray-900">Book a Turf</p>
                     <p className="text-xs text-gray-500">10 points per ₹100 spent</p>
                   </div>
                 </div>
                 <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">+ Points</Badge>
               </div>
               
               <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-50 rounded-full">
                     <Star className="h-4 w-4 text-orange-500" />
                   </div>
                   <div>
                     <p className="font-medium text-sm text-gray-900">Leave a Review</p>
                     <p className="text-xs text-gray-500">Share your experience after playing</p>
                   </div>
                 </div>
                 <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">+50 Points</Badge>
               </div>
             </CardContent>
           </Card>

           <Card className="shadow-sm">
             <CardHeader>
               <CardTitle className="flex items-center gap-2 text-lg">
                 <HistoryIcon className="h-5 w-5 text-gray-700" />
                 Points History
               </CardTitle>
               <CardDescription>Recent point transactions</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{tx.date}</p>
                      </div>
                      <span className={`text-sm font-bold ${tx.type === 'earned' ? 'text-green-600' : 'text-gray-900'}`}>
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
             </CardContent>
           </Card>

        </div>

      </main>
    </div>
  );
}

export default function PlayerLoyaltyPage() {
  return (
    <ProtectedRoute requireRole="customer">
      <PlayerLoyaltyContent />
    </ProtectedRoute>
  );
}
