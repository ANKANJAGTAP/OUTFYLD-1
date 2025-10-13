'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, MapPin, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, firebaseUser, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="bg-green-500 rounded-lg p-1.5 md:p-2 mr-2 md:mr-3">
              <MapPin className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-green-600">OutFyld</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Sangli & Miraj</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link href="/browse" className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors">
              Browse Turfs
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors">
              Contact
            </Link>
          </nav>

          <div className="hidden lg:flex items-center space-x-3">
            {firebaseUser && user ? (
              // User is logged in
              <div className="flex items-center space-x-2 xl:space-x-3">
                <div className="text-right hidden xl:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <div className="flex items-center justify-end space-x-2">
                    <Badge 
                      variant="secondary" 
                      className={user.role === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                    >
                      {user.role === 'owner' ? 'Owner' : user.role === 'admin' ? 'Admin' : 'Customer'}
                    </Badge>
                  </div>
                </div>
                
                {user.role === 'owner' && (
                  <Link href="/owner/dashboard">
                    <Button variant="outline" size="sm" className="text-xs">
                      <User className="h-4 w-4 lg:mr-1" />
                      <span className="hidden lg:inline">Dashboard</span>
                    </Button>
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link href="/admin/dashboard">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Shield className="h-4 w-4 lg:mr-1" />
                      <span className="hidden lg:inline">Admin</span>
                    </Button>
                  </Link>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  disabled={loading}
                  className="text-gray-600 hover:text-red-600 text-xs"
                >
                  <LogOut className="h-4 w-4 lg:mr-1" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </div>
            ) : (
              // User is not logged in
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="text-xs">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-xs">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 bg-white">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all px-4 py-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/browse" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all px-4 py-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Turfs
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all px-4 py-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all px-4 py-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                {firebaseUser && user ? (
                  // Mobile: User is logged in
                  <>
                    <div className="text-center py-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`mt-1 ${user.role === 'owner' ? 'bg-blue-100 text-blue-800' : user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {user.role === 'owner' ? 'Owner' : user.role === 'admin' ? 'Admin' : 'Customer'}
                      </Badge>
                    </div>
                    
                    {user.role === 'owner' && (
                      <Link href="/owner/dashboard" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          Owner Dashboard
                        </Button>
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link href="/admin/dashboard" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-red-600 hover:bg-red-50"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      disabled={loading}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  // Mobile: User is not logged in
                  <>
                    <Link href="/auth/login">
                      <Button variant="outline" size="sm" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm" className="w-full bg-green-500 hover:bg-green-600">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}