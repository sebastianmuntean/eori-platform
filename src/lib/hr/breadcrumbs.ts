'use client';

import { useTranslations } from 'next-intl';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Hook to build breadcrumb items for HR pages
 * Centralizes breadcrumb logic to avoid duplication
 * 
 * @param locale - Current locale string
 * @param currentPageLabel - Label for the current page (last breadcrumb item)
 * @param currentPageHref - Optional href for the current page
 * @returns Array of breadcrumb items
 * 
 * @example
 * const breadcrumbs = useHRBreadcrumbs(locale, t('employees'));
 */
export function useHRBreadcrumbs(
  locale: string,
  currentPageLabel: string,
  currentPageHref?: string
): BreadcrumbItem[] {
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  return [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    {
      label: tMenu('hr') || 'Resurse Umane',
      href: `/${locale}/dashboard/hr`,
    },
    currentPageHref
      ? { label: currentPageLabel, href: currentPageHref }
      : { label: currentPageLabel },
  ];
}

