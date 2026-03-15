'use client';

import { useState, useCallback } from 'react';

interface GeolocationState {
  lat: number;
  lng: number;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied. Please enable it in browser settings.',
          2: 'Location unavailable. Please try again.',
          3: 'Location request timed out. Please try again.'
        };
        setError(messages[err.code] || 'Failed to get location.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { location, error, loading, requestLocation };
}