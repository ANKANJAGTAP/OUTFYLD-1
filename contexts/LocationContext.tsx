'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GeolocationState {
  lat: number;
  lng: number;
}

interface LocationContextType {
  location: GeolocationState | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | null | string;
  isDenied: boolean;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null | string>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [storedDenied, setStoredDenied] = useState(false);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions?.query) return null;

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionState(result.state);
      return result;
    } catch {
      return null;
    }
  }, []);

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
        setStoredDenied(false);
        localStorage.removeItem('locationPermissionDenied');
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied.',
          2: 'Location unavailable.',
          3: 'Location request timed out.'
        };
        setError(messages[err.code] || 'Failed to get location.');
        setLoading(false);
        if (err.code === 1) {
          setPermissionState('denied');
          setStoredDenied(true);
          localStorage.setItem('locationPermissionDenied', 'true');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;

    const syncPermission = async () => {
      const status = await checkPermission();
      if (!status) return;

      permissionStatus = status;
      permissionStatus.onchange = () => {
        setPermissionState(permissionStatus!.state);

        if (permissionStatus!.state === 'granted') {
          setError(null);
          setStoredDenied(false);
          localStorage.removeItem('locationPermissionDenied');
          requestLocation();
        }

        if (permissionStatus!.state === 'denied') {
          setError('Location permission denied.');
          setLocation(null);
          setStoredDenied(true);
          localStorage.setItem('locationPermissionDenied', 'true');
        }
      };
    };

    const handleFocus = () => {
      checkPermission();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPermission();
      }
    };

    syncPermission();
    // Only check on actual focus/visibility events, not every 5 seconds
    // The native permissionStatus.onchange listener handles real-time updates
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkPermission, requestLocation]);

  useEffect(() => {
    setIsMounted(true);
    const deniedFlag = localStorage.getItem('locationPermissionDenied');
    if (deniedFlag === 'true') {
      setStoredDenied(true);
      setPermissionState((prev) => prev ?? 'denied');
      setError((prev) => prev ?? 'Location permission denied.');
    }

    // Ask for location on first load automatically if we haven't asked
    const hasAskedBefore = localStorage.getItem('hasAskedLocation');

    if (!hasAskedBefore) {
      localStorage.setItem('hasAskedLocation', 'true');
      requestLocation();
    } else {
      // If we asked before, silently check on load in case they granted or denied it
      if (navigator.permissions?.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          setPermissionState(result.state);

          if (result.state === 'granted') {
            requestLocation();
          }

          if (result.state === 'denied') {
            setError('Location permission denied.');
            setLocation(null);
            setStoredDenied(true);
            localStorage.setItem('locationPermissionDenied', 'true');
          }
        });
      }
    }
  }, [requestLocation]);

  const isDenied = permissionState === 'denied' || error === 'Location permission denied.' || storedDenied;

  return (
    <LocationContext.Provider value={{ location, error, loading, permissionState, isDenied, requestLocation }}>
      {children}
      
      {/* Global floating banner */}
      {isMounted && isDenied && (
        <div
          className="fixed bottom-6 right-6 z-[2147483647] pointer-events-auto"
          aria-live="polite"
          style={{ zIndex: 2147483647 }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-red-200 p-4 max-w-sm flex items-start space-x-3">
            <div className="bg-red-100 p-2 rounded-full text-red-600 flex-shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm pl-1">Location Access Required</h4>
              <p className="text-xs text-gray-600 mt-1 mb-2 pl-1">
                We need location access to find the nearest turfs. If you previously denied it, please allow it in your browser settings.
              </p>
              <div className="flex space-x-2 pl-1">
                <Button size="sm" variant="default" className="h-8 text-xs font-medium" onClick={requestLocation}>
                  Grant Location Permission
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </LocationContext.Provider>
  );
}

export function useGlobalLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useGlobalLocation must be used within a LocationProvider');
  }
  return context;
}
