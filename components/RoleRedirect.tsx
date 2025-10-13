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
    const publicRoutes = ['/', '/browse', '/book', '/about', '/contact', '/feedback'];
    const authRoutes = ['/auth/login', '/auth/register', '/auth/verify-email', '/auth/profile-setup'];
    const ownerRoutes = ['/owner/dashboard', '/owner/turfs', '/owner/subscription', '/dashboard/turf-owner'];
    const customerRoutes = ['/dashboard/player'];
    const adminRoutes = ['/admin/dashboard', '/admin/settings', '/admin/manage-admins', '/admin/setup'];

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

      // Protect admin routes from non-admins
      if (adminRoutes.some(route => pathname.startsWith(route)) && user.role !== 'admin') {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'owner') {
          router.push('/owner/dashboard');
        } else if (user.role === 'customer') {
          router.push('/dashboard/player');
        } else {
          router.push('/');
        }
        return;
      }

      // Protect owner routes from non-owners
      if (ownerRoutes.some(route => pathname.startsWith(route)) && user.role !== 'owner') {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'customer') {
          router.push('/dashboard/player');
        } else {
          router.push('/');
        }
        return;
      }

      // Protect customer routes from non-customers
      if (customerRoutes.some(route => pathname.startsWith(route)) && user.role !== 'customer') {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'owner') {
          router.push('/owner/dashboard');
        } else {
          router.push('/');
        }
        return;
      }
    } 
    // If user is not authenticated
    else if (!firebaseUser && !initialLoading) {
      // Redirect from protected routes to login
      const protectedRoutes = [...ownerRoutes, ...customerRoutes, ...adminRoutes];
      if (protectedRoutes.some(route => pathname.startsWith(route))) {
        router.push('/auth/login');
        return;
      }
    }
  }, [firebaseUser, user, initialLoading, pathname, router]);

  return <>{children}</>;
}