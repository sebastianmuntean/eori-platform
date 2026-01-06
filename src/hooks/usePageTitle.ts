import { useEffect } from 'react';

/**
 * Hook to set the page title in the format: "{pageName} - EORI"
 * 
 * @param pageName - The name of the page (typically from translations)
 * @example
 * ```tsx
 * const t = useTranslations('menu');
 * usePageTitle(t('dashboard'));
 * // Sets document.title to "Dashboard - EORI"
 * ```
 */
export function usePageTitle(pageName: string | undefined | null) {
  useEffect(() => {
    if (typeof document !== 'undefined' && pageName) {
      document.title = `${pageName} - EORI`;
    }
  }, [pageName]);
}






