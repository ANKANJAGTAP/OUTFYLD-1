'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, SlidersHorizontal, User, LogOut, FileText, ChevronDown, ListOrdered, Award, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BrowseHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function BrowseHeader({ searchQuery, onSearchChange, sortBy, onSortChange }: BrowseHeaderProps) {
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
          <Link href="/" className="flex items-center">
            <div className="mr-3">
              <Image 
                src="/images/logo.png" 
                alt="OutFyld Logo" 
                width={48} 
                height={48} 
                className="h-12 w-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-600">OutFyld</h1>
              <p className="text-xs text-gray-500">Browse Turfs</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4 flex-1 max-w-2xl mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search turfs, locations, or sports..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="distance">Nearest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4">
            {firebaseUser && user ? (
              // User is logged in
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent flex items-center gap-2">
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
                  <DropdownMenuContent align="end" className="w-56">
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