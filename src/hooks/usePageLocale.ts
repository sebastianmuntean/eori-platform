/**
 * Custom hook for extracting locale and constructing href from current pathname
 * Eliminates duplication in page components
 */

import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface UsePageLocaleReturn {
  locale: string;
  href: string;
}

/**
 * Hook that extracts locale from params and constructs href from current pathname
 * @returns Object with locale and href
 */
export function usePageLocale(): UsePageLocaleReturn {
  const params = useParams();
  const pathname = usePathname();
  
  const locale = (params.locale as string) || 'ro';
  
  // Use pathname directly as href (it already includes locale)
  const href = useMemo(() => pathname, [pathname]);
  
  return {
    locale,
    href,
  };
}


