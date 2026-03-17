'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, ArrowLeft, ChevronDown, FileText, ListOrdered, LogOut, MapPin, Shield, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHoverDropdown } from '@/hooks/useHoverDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function BookingHeader() {
  const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();
  const { user, firebaseUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <Link href="/browse" className="flex items-center text-gray-600 hover:text-green-600">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Browse
            </Link>
            
            <div className="h-6 border-l border-gray-300"></div>
            
            <Link href="/" className="flex items-center">
              <div className="bg-green-500 rounded-lg p-2 mr-3">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-600">TurfBook</h1>
                <p className="text-xs text-gray-500">Book Your Slot</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {firebaseUser && user ? (
              // User is logged in
              <div className="flex items-center space-x-3">
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto hover:bg-transparent flex items-center gap-2"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className={user.role === 'owner' ? 'bg-blue-100 text-blue-800' : user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}
                        >
                          {user.role === 'owner' ? 'Owner' : user.role === 'admin' ? 'Admin' : 'Customer'}
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    
                    {user.role === 'owner' && (
                      <DropdownMenuItem onClick={() => router.push('/owner/dashboard')}>
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>Owner Dashboard</span>
                      </DropdownMenuItem>
                    )}

                    {user.role === 'customer' && (
                      <>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/player')}>
                          <ListOrdered className="mr-2 h-4 w-4" />
                          <span>Player Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/player/profile')}>
                          <User className="mr-2 h-4 w-4" />
                          <span>My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/player/bookings')}>
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Booking History</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/player/loyalty')}>
                          <Award className="mr-2 h-4 w-4" />
                          <span>Loyalty Points</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // User is not logged in
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}