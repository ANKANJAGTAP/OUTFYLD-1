'use client';

// This file is kept for backward compatibility but
// toast functionality is now handled by sonner via
// the <Toaster /> component in app/layout.tsx.
//
// Import { toast } from 'sonner' in any component
// to show toast notifications.

export function ToastProvider() {
  // Sonner's Toaster is rendered in layout.tsx — nothing needed here
  return null;
}