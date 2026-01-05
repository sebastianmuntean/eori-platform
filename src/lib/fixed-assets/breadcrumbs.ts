'use client';

import { useTranslations } from 'next-intl';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Hook to build breadcrumb items for fixed assets pages
 * Centralizes breadcrumb logic to avoid duplication
 */
export function useFixedAssetsBreadcrumbs(
  locale: string,
  categoryLabel?: string,
  categoryHref?: string
): BreadcrumbItem[] {
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  return [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    {
      label: t('accounting') || 'Accounting',
      href: `/${locale}/dashboard/accounting`,
    },
    {
      label: tMenu('fixedAssets') || 'Mijloace fixe',
      href: `/${locale}/dashboard/accounting/fixed-assets`,
    },
    ...(categoryLabel && categoryHref
      ? [{ label: categoryLabel, href: categoryHref }]
      : []),
  ];
}

