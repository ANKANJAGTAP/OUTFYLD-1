'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, X, MapPin, User, LogOut, Shield, ChevronDown, ListOrdered, FileText, Award } from 'lucide-react';
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

export function LandingHeader({ home = false }: { home?: boolean }) {
  const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, firebaseUser, logout, loading, initialLoading } = useAuth();
  const router = useRouter();
  // Every page that renders this header is now a Night Match (dark) surface, so
  // the theme is unconditionally dark. It used to be derived from usePathname(),
  // but that hook resolves to '' during Vercel's static/ISR prerender — which
  // baked the OLD light header into the production HTML while the hero rendered
  // dark. `home` is passed explicitly (only the homepage floats a transparent
  // bar over its hero); no render-context-dependent hook drives the theme.
  const isHome = home;
  const isNight = true;

  // Handle scroll to change header background on home page
  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Night Match: the homepage header is a dark floodlit bar in BOTH states
  // (transparent at top, solid pitch once scrolled) so it sits on the dark page.
  const headerClasses = isHome
    ? `fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-pitch-900/90 backdrop-blur-md border-b border-pitchline'
          : 'bg-gradient-to-b from-black/70 to-transparent border-transparent'
      }`
    : isNight
      ? 'sticky top-0 z-50 bg-pitch-900/90 backdrop-blur-md border-b border-pitchline'
      : 'sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-green-100 shadow-sm';

  const textClasses = isNight ? 'text-chalk-100 hover:text-flood-500' : 'text-gray-700 hover:text-green-600';
  const logoTextClasses = isNight ? 'text-chalk-100' : 'text-green-600';
  const userTextClasses = isNight ? 'text-chalk-100' : 'text-gray-900';
  const iconClasses = isNight ? 'text-chalk-400' : 'text-gray-500';
  const buttonVariant = isNight ? 'secondary' : 'outline';
  const mobileLinkCls = isNight
    ? 'text-chalk-100 hover:text-flood-500 hover:bg-white/5 transition-all px-4 py-2 rounded-md'
    : 'text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all px-4 py-2 rounded-md';
  const mobileItemCls = isNight
    ? 'w-full justify-start h-12 text-base font-medium transition-colors text-chalk-100 hover:bg-white/5 hover:text-flood-500'
    : 'w-full justify-start h-12 text-base font-medium transition-colors hover:bg-green-50 hover:text-green-700';
  const ddItemCls = isNight
    ? 'cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-white/5 focus:text-flood-500'
    : 'cursor-pointer rounded-lg px-3 py-2.5 transition-colors focus:bg-green-50 focus:text-green-700';

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="mr-2 md:mr-3">
              <Image
                src="/images/logo.png"
                alt="OutFyld Logo"
                width={48}
                height={48}
                priority
                className={`h-10 w-10 md:h-12 md:w-12 object-contain ${isNight ? 'brightness-0 invert' : ''}`}
              />
            </div>
            <div>
              <h1 className={`text-xl md:text-2xl font-bold ${logoTextClasses}`}>OutFyld</h1>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <Link href="/" className={`text-sm font-medium transition-colors ${textClasses}`}>
              Home
            </Link>
            {user?.role !== 'owner' && (
              <Link href="/browse" className={`text-sm font-medium transition-colors ${textClasses}`}>
                Browse Arenas
              </Link>
            )}
            <Link href="/about" className={`text-sm font-medium transition-colors ${textClasses}`}>
              About
            </Link>
            <Link href="/contact" className={`text-sm font-medium transition-colors ${textClasses}`}>
              Contact
            </Link>
          </nav>

          <div className="hidden lg:flex items-center space-x-3">
            {initialLoading ? (
               // Show skeleton loader while determining auth state
               <div className="flex items-center space-x-3">
                  <div className="h-9 w-20 bg-chalk-100/10 animate-pulse rounded-md"></div>
                  <div className="h-9 w-20 bg-chalk-100/10 animate-pulse rounded-md"></div>
               </div>
            ) : firebaseUser && user ? (
              // User is logged in
              <div className="flex items-center space-x-3">
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto hover:bg-transparent flex items-center gap-2 focus-visible:ring-0 focus-visible:outline-none focus:ring-0 border-none outline-none"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="text-right hidden sm:block">
                        <p className={`text-sm font-medium ${userTextClasses}`}>
                          {user.name}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 ${iconClasses}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className={`w-64 p-2 rounded-xl shadow-lg ${isNight ? 'border-pitchline' : 'border-gray-100'}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <DropdownMenuLabel className={`font-semibold px-3 py-2 ${isNight ? 'text-chalk-100' : 'text-gray-900'}`}>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    
                    {user.role === 'admin' && (
                      <DropdownMenuItem 
                        onClick={() => router.push('/admin/dashboard')}
                        className={ddItemCls}
                      >
                        <Shield className="mr-3 h-5 w-5" />
                        <span className="text-base">Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    
                    {user.role === 'owner' && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => router.push('/owner/dashboard')}
                          className={ddItemCls}
                        >
                          <MapPin className="mr-3 h-5 w-5" />
                          <span className="text-base">Owner Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push('/owner/profile')}
                          className={ddItemCls}
                        >
                          <User className="mr-3 h-5 w-5" />
                          <span className="text-base">My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push('/owner/bank-details')}
                          className={ddItemCls}
                        >
                          <FileText className="mr-3 h-5 w-5" />
                          <span className="text-base">Payment Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push('/owner/analytics')}
                          className={ddItemCls}
                        >
                          <ListOrdered className="mr-3 h-5 w-5" />
                          <span className="text-base">Analytics</span>
                        </DropdownMenuItem>
                      </>
                    )}

                    {user.role === 'customer' && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => router.push('/dashboard/player')}
                          className={ddItemCls}
                        >
                          <ListOrdered className="mr-3 h-5 w-5" />
                          <span className="text-base">Player Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push('/dashboard/player/profile')}
                          className={ddItemCls}
                        >
                          <User className="mr-3 h-5 w-5" />
                          <span className="text-base">My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push('/dashboard/player/bookings')}
                          className={ddItemCls}
                        >
                          <FileText className="mr-3 h-5 w-5" />
                          <span className="text-base">Booking History</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push('/dashboard/player/loyalty')}
                          className={ddItemCls}
                        >
                          <Award className="mr-3 h-5 w-5" />
                          <span className="text-base">Loyalty Points</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem 
                      className="cursor-pointer rounded-lg px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors" 
                      onClick={handleLogout} 
                      disabled={loading}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      <span className="text-base font-medium">Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // User is not logged in
              <>
                <Link href="/auth/login">
                  <Button variant={buttonVariant as any} size="sm" className={`text-xs ${isNight ? 'bg-transparent border border-chalk-400/30 text-chalk-100 hover:border-flood-500 hover:text-flood-500 hover:bg-transparent' : ''}`}>
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className={`text-xs ${isNight ? 'bg-flood-500 text-pitch-900 hover:bg-flood-600 font-semibold' : 'bg-green-500 hover:bg-green-600'}`}>
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className={`lg:hidden p-2 rounded-md transition-colors ${isNight ? 'hover:bg-white/10 text-chalk-100' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className={`lg:hidden py-4 border-t ${isNight ? 'border-pitchline bg-pitch-900' : 'border-gray-200 bg-white'}`}>
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className={mobileLinkCls}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {user?.role !== 'owner' && (
                <Link 
                  href="/browse" 
                  className={mobileLinkCls}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Browse Arenas
                </Link>
              )}
              <Link 
                href="/about" 
                className={mobileLinkCls}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className={mobileLinkCls}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              <div className={`flex flex-col space-y-2 pt-4 border-t ${isNight ? 'border-pitchline' : 'border-gray-200'}`}>
                {initialLoading ? (
                  // Mobile skeleton loader
                  <>
                    <div className="h-9 w-full bg-chalk-100/10 animate-pulse rounded-md"></div>
                    <div className="h-9 w-full bg-chalk-100/10 animate-pulse rounded-md"></div>
                  </>
                ) : firebaseUser && user ? (
                  // Mobile: User is logged in
                  <>
                    <div className={`text-center py-4 rounded-xl mb-2 ${isNight ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <p className={`text-lg font-semibold ${isNight ? 'text-chalk-100' : 'text-gray-900'}`}>
                        {user.name}
                      </p>
                    </div>
                    
                    {user.role === 'owner' && (
                      <>
                        <Link href="/owner/dashboard" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className={mobileItemCls}>
                            <MapPin className="h-5 w-5 mr-3" />
                            Owner Dashboard
                          </Button>
                        </Link>
                        <Link href="/owner/profile" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className={mobileItemCls}>
                            <User className="h-5 w-5 mr-3" />
                            My Profile
                          </Button>
                        </Link>
                        <Link href="/owner/bank-details" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className={mobileItemCls}>
                            <FileText className="h-5 w-5 mr-3" />
                            Payment Details
                          </Button>
                        </Link>
                        <Link href="/owner/analytics" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className={mobileItemCls}>
                            <ListOrdered className="h-5 w-5 mr-3" />
                            Analytics
                          </Button>
                        </Link>
                      </>
                    )}

                    {user.role === 'admin' && (
                      <Link href="/admin/dashboard" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className={mobileItemCls}>
                          <Shield className="h-5 w-5 mr-3" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}

                    {user.role === 'customer' && (
                      <>
                        <Link href="/dashboard/player" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className={mobileItemCls}>
                            <ListOrdered className="h-5 w-5 mr-3" />
                            Player Dashboard
                          </Button>
                        </Link>
                        <Link href="/dashboard/player/profile" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className={mobileItemCls}>
                            <User className="h-5 w-5 mr-3" />
                            My Profile
                          </Button>
                        </Link>
                        <Link href="/dashboard/player/bookings" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className={mobileItemCls}>
                            <FileText className="h-5 w-5 mr-3" />
                            Booking History
                          </Button>
                        </Link>
                        <Link href="/dashboard/player/loyalty" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="ghost" className={mobileItemCls}>
                            <Award className="h-5 w-5 mr-3" />
                            Loyalty Points
                          </Button>
                        </Link>
                      </>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start h-12 text-base font-semibold mt-2 ${isNight ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      disabled={loading}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </Button>
                  </>
                ) : (
                  // Mobile: User is not logged in
                  <>
                    <Link href="/auth/login">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full bg-transparent border border-chalk-400/30 text-chalk-100 hover:border-flood-500 hover:text-flood-500 hover:bg-transparent"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm" className="w-full bg-flood-500 text-pitch-900 font-semibold hover:bg-flood-600">
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