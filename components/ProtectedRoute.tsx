'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'customer' | 'owner';
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  fallbackPath?: string;
}

/**
 * Protected Route wrapper component
 * Handles authentication and authorization for protected pages
 */
export default function ProtectedRoute({
  children,
  requireRole,
  requireAuth = true,
  requireEmailVerified = true,
  fallbackPath = '/auth/login'
}: ProtectedRouteProps) {
  const { firebaseUser, user, initialLoading, isEmailVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for initial auth check to complete
    if (initialLoading) return;

    // If auth is required but user is not logged in
    if (requireAuth && !firebaseUser) {
      router.push(fallbackPath);
      return;
    }

    // If email verification is required but email is not verified
    if (requireEmailVerified && firebaseUser && !isEmailVerified()) {
      router.push('/auth/verify-email');
      return;
    }

    // If user is logged in but MongoDB user data is not found
    if (firebaseUser && requireAuth && !user) {
      console.error('User authenticated with Firebase but not found in MongoDB');
      router.push('/auth/profile-setup');
      return;
    }

    // If specific role is required but user doesn't have it
    if (requireRole && user && user.role !== requireRole) {
      // Redirect to appropriate dashboard based on actual role
      if (user.role === 'owner') {
        router.push('/owner/dashboard');
      } else {
        router.push('/');
      }
      return;
    }
  }, [
    firebaseUser,
    user,
    initialLoading,
    requireAuth,
    requireRole,
    requireEmailVerified,
    fallbackPath,
    router,
    isEmailVerified
  ]);

  // Show loading spinner while checking authentication
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-4" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if authentication is required but user is not authenticated
  if (requireAuth && !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-gray-600">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if email verification is required but not verified
  if (requireEmailVerified && firebaseUser && !isEmailVerified()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-8 w-8 text-yellow-500 mb-4" />
            <p className="text-gray-600">Please verify your email to continue...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if role mismatch
  if (requireRole && user && user.role !== requireRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-gray-600">Access denied. Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 */
export function withProtectedRoute<T extends object>(
  Component: React.ComponentType<T>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const ProtectedComponent = (props: T) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;

  return ProtectedComponent;
}