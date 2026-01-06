'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { safeNavigate } from '@/lib/utils/url-validation';

export interface NavigationOptions {
  openExternalInNewTab?: boolean;
}

/**
 * Hook for safe navigation with URL validation
 * Provides a navigate function that validates URLs before navigation
 * Handles internal URLs (router.push) and external URLs (window.open)
 * 
 * @returns Object with navigate function
 */
export function useSafeNavigation() {
  const router = useRouter();
  
  const navigate = useCallback((link: string, options?: NavigationOptions) => {
    safeNavigate(link, router, options);
  }, [router]);
  
  return { navigate };
}






