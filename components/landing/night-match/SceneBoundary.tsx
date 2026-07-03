'use client';

import { Component, ReactNode } from 'react';

/**
 * Isolates the R3F canvas so any WebGL/reconciler failure degrades to the
 * CSS poster instead of taking down the homepage. Renders nothing on error
 * (the poster underneath remains visible).
 */
export class SceneBoundary extends Component<
  { children: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
