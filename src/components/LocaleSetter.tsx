'use client';

import { useEffect } from 'react';

/**
 * LocaleSetter Component
 * 
 * Dynamically updates the HTML lang attribute based on the current locale.
 * This ensures proper language declaration for accessibility and SEO.
 * 
 * @param locale - The locale string (e.g., 'ro', 'en', 'it')
 */
export function LocaleSetter({ locale }: { locale: string }) {
  useEffect(() => {
    // Safety checks: ensure we're in browser environment and locale is valid
    if (typeof document === 'undefined') {
      console.warn('LocaleSetter: document is not available (SSR)');
      return;
    }

    if (!locale || typeof locale !== 'string') {
      console.warn('LocaleSetter: invalid locale provided', locale);
      return;
    }

    // Update the HTML lang attribute
    try {
      document.documentElement.lang = locale;
    } catch (error) {
      console.error('LocaleSetter: failed to set lang attribute', error);
    }
  }, [locale]);

  // This component doesn't render anything
  return null;
}

