'use client';

import { useGlobalLocation } from '@/contexts/LocationContext';

export function useGeolocation() {
  return useGlobalLocation();
}
