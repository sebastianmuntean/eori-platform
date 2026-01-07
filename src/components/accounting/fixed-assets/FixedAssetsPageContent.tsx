'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/ui/PageContainer';
import { NavigationCardGrid } from '@/components/ui/NavigationCardGrid';
import { NavigationItem } from '@/components/ui/NavigationCard';
import { NAVIGATION_ITEMS_CONFIG, REGISTER_SUB_ITEMS } from './fixedAssetsNavigationConfig';

interface FixedAssetsPageContentProps {
  locale: string;
}

/**
 * Helper function to get translation with fallback
 * Reduces repetition and improves maintainability
 */
function getTranslation(t: (key: string) => string, key: string, fallback: string): string {
  return t(key) || fallback;
}

/**
 * Fixed Assets page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function FixedAssetsPageContent({ locale }: FixedAssetsPageContentProps) {
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  // Base path for fixed assets routes
  const basePath = useMemo(() => `/${locale}/dashboard/accounting/fixed-assets`, [locale]);

  // Helper function to build register sub-item paths
  const buildRegisterPath = useMemo(
    () => (register: string) => `${basePath}/registers/${register}`,
    [basePath]
  );

  // Build register sub-items with translations
  const registerSubItems = useMemo(
    () =>
      REGISTER_SUB_ITEMS.map((item) => ({
        title: getTranslation(tMenu, item.translationKey, item.fallback),
        href: buildRegisterPath(item.route),
      })),
    [tMenu, buildRegisterPath]
  );

  // Memoized navigation items to prevent recreation on every render
  const navigationItems: NavigationItem[] = useMemo(
    () =>
      NAVIGATION_ITEMS_CONFIG.map((config) => {
        const item: NavigationItem = {
          title: getTranslation(tMenu, config.translationKey, config.titleFallback),
          description: getTranslation(tMenu, config.descriptionKey, config.descriptionFallback),
          href: `${basePath}/${config.route}`,
          icon: <config.icon />,
        };

        // Add sub-items for registers
        if (config.hasSubItems) {
          item.subItems = registerSubItems;
        }

        return item;
      }),
    [tMenu, basePath, registerSubItems]
  );

  // Memoized breadcrumbs
  const breadcrumbs = useMemo(
    () => [
      { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
      { label: getTranslation(t, 'accounting', 'Accounting'), href: `/${locale}/dashboard/accounting` },
      { label: getTranslation(tMenu, 'fixedAssets', 'Mijloace fixe si obiecte de inventar') },
    ],
    [t, tMenu, locale]
  );

  const pageTitle = getTranslation(tMenu, 'fixedAssets', 'Mijloace fixe si obiecte de inventar');
  const pageDescription = getTranslation(
    tMenu,
    'fixedAssetsDescription',
    'Gestionare și raportare pentru mijloace fixe și obiecte de inventar'
  );

  return (
    <PageContainer>
      <PageHeader breadcrumbs={breadcrumbs} title={pageTitle} description={pageDescription} />

      <NavigationCardGrid items={navigationItems} />
    </PageContainer>
  );
}

