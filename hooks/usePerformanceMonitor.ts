'use client';

import { useEffect } from 'react';
import { logAppEvent } from '@/lib/firebase/logger';

interface PerformanceOptions {
  thresholdMs?: number;
}

export const usePerformanceMonitor = (
  context: string,
  options: PerformanceOptions = {}
) => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return;
    }

    const threshold = options.thresholdMs ?? 3000;

    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    const duration =
      navigation?.duration ??
      navigation?.domComplete ??
      navigation?.loadEventEnd ??
      performance.now();

    const severity = duration > threshold ? 'warn' : 'info';

    const metadata: Record<string, any> = {
      context,
      duration,
      threshold,
      ttfb: navigation?.responseStart ?? null,
      domContentLoaded: navigation?.domContentLoadedEventEnd ?? null,
      effectiveType: (navigator as any)?.connection?.effectiveType ?? null,
      downlink: (navigator as any)?.connection?.downlink ?? null,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      deviceMemory: (navigator as any)?.deviceMemory ?? null,
    };

    void logAppEvent('system:performance', {
      severity,
      metadata,
    });
  }, [context, options.thresholdMs]);
};

