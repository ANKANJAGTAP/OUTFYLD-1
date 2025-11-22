'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function CareersPageNotifications() {
  const searchParams = useSearchParams();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Check for success parameter
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const job = searchParams.get('job');

    if (success === 'offer-accepted') {
      setNotification({
        type: 'success',
        title: 'Offer Accepted Successfully! 🎉',
        message: `Congratulations! You've accepted the offer for the ${job || 'position'}. Our HR team will contact you shortly with onboarding details.`
      });
    } else if (message === 'offer-already-accepted') {
      setNotification({
        type: 'info',
        title: 'Offer Already Accepted',
        message: 'You have already accepted this offer. Our team will reach out to you soon.'
      });
    } else if (error === 'application-not-found') {
      setNotification({
        type: 'error',
        title: 'Application Not Found',
        message: 'We could not find your application. Please contact us at admin@outfyld.in for assistance.'
      });
    } else if (error === 'offer-not-available') {
      setNotification({
        type: 'error',
        title: 'Offer Not Available',
        message: 'This offer is no longer available or has expired.'
      });
    } else if (error === 'server-error') {
      setNotification({
        type: 'error',
        title: 'Server Error',
        message: 'Something went wrong. Please try again or contact us at admin@outfyld.in.'
      });
    }

    // Clear notification after 10 seconds
    if (success || error || message) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top">
      <Alert
        variant={notification.type === 'error' ? 'destructive' : 'default'}
        className={`shadow-lg border-2 ${
          notification.type === 'success'
            ? 'bg-green-50 border-green-500'
            : notification.type === 'info'
            ? 'bg-blue-50 border-blue-500'
            : ''
        }`}
      >
        {notification.type === 'success' && (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        )}
        {notification.type === 'error' && <XCircle className="h-5 w-5" />}
        {notification.type === 'info' && (
          <AlertCircle className="h-5 w-5 text-blue-600" />
        )}
        <AlertTitle className="text-lg font-bold">{notification.title}</AlertTitle>
        <AlertDescription className="mt-2">{notification.message}</AlertDescription>
      </Alert>
    </div>
  );
}
