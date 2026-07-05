'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerUpdater — eliminates the "stale UI after a deploy" bug.
 *
 * When a new build ships, a browser that still holds the previous build's
 * service worker keeps serving the OLD cached app shell (e.g. the pre-Night
 * Match light header) until the user manually navigates. With skipWaiting +
 * clientsClaim (see next.config.js) the freshly-installed worker activates and
 * takes control immediately, which fires `controllerchange`. We listen for
 * that and reload ONCE so the page re-renders from the new build.
 *
 * Guards:
 *  - Only reloads when a controller ALREADY existed at load time — i.e. a real
 *    UPDATE, never the first-ever install (which would reload every new visitor
 *    and risk a loop).
 *  - `refreshing` latch prevents a double reload.
 */
export function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    // A controller present now means this page is already under a service
    // worker — so any future controllerchange is an update, not a first install.
    const hadController = !!navigator.serviceWorker.controller;
    if (!hadController) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () =>
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  return null;
}
