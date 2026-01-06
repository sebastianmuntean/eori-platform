import { useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

/**
 * Hook for common catechesis page utilities
 */
export function useCatechesisPageHelpers() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  /**
   * Format date for display
   */
  const formatDate = useCallback((date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  }, [locale]);

  /**
   * Build base breadcrumbs for catechesis pages
   */
  const buildBaseBreadcrumbs = useCallback(() => [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
  ], [t, tCatechesis, locale]);

  /**
   * Build fetch parameters with common defaults
   */
  const buildFetchParams = useCallback((
    page: number,
    pageSize: number,
    filters: Record<string, any>
  ) => ({
    page,
    pageSize,
    ...filters,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  }), []);

  /**
   * Create a filter change handler that resets page to 1
   */
  const createFilterChangeHandler = useCallback((
    setFilter: (value: any) => void,
    setPage: (page: number) => void
  ) => {
    return (value: any) => {
      setFilter(value);
      setPage(1);
    };
  }, []);

  return {
    locale,
    t,
    tCatechesis,
    formatDate,
    buildBaseBreadcrumbs,
    buildFetchParams,
    createFilterChangeHandler,
  };
}

