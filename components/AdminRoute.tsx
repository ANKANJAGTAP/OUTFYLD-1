'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/auth/login');
      } else if (user.role !== 'admin') {
        // Logged in but not admin, redirect to home
        router.push('/');
      }
    }
  }, [user, initialLoading, router]);

  // Show loading state while checking authentication
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is admin
  if (user && user.role === 'admin') {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
