'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface RoleRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that handles role-based redirections
 * - Customers: redirect to home page (/) after login
 * - Owners: redirect to owner dashboard (/owner/dashboard) after login
 * - Protects auth pages from authenticated users
 * - Redirects unauthorized users from protected pages
 */
export default function RoleRedirect({ children }: RoleRedirectProps) {
  const { user, firebaseUser, initialLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while loading
    if (initialLoading) return;

    // Routes that don't require authentication
    const publicRoutes = ['/', '/browse', '/book'];
    const authRoutes = ['/auth/login', '/auth/register'];
    const ownerRoutes = ['/owner/dashboard', '/owner/turfs', '/owner/subscription'];
    const customerRoutes = ['/dashboard/player'];

    // If user is authenticated
    if (firebaseUser && user) {
      // Redirect from auth pages to appropriate dashboard
      if (authRoutes.some(route => pathname.startsWith(route))) {
        if (user.role === 'owner') {
          // Redirect owners to their dashboard (dashboard will check subscription)
          router.push('/owner/dashboard');
          return;
        } else if (user.role === 'customer') {
          router.push('/dashboard/player');
          return;
        }
      }

      // Protect owner routes from customers
      if (ownerRoutes.some(route => pathname.startsWith(route)) && user.role !== 'owner') {
        router.push('/dashboard/player');
        return;
      }

      // Protect customer routes from owners
      if (customerRoutes.some(route => pathname.startsWith(route)) && user.role !== 'customer') {
        router.push('/owner/dashboard');
        return;
      }
    } 
    // If user is not authenticated
    else if (!firebaseUser && !initialLoading) {
      // Redirect from protected routes to login
      const protectedRoutes = [...ownerRoutes, ...customerRoutes];
      if (protectedRoutes.some(route => pathname.startsWith(route))) {
        router.push('/auth/login');
        return;
      }
    }
  }, [firebaseUser, user, initialLoading, pathname, router]);

  return <>{children}</>;
}