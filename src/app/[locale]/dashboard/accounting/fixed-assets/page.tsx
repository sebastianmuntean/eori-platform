'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslations } from 'next-intl';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { NavigationCardGrid } from '@/components/ui/NavigationCardGrid';
import { NavigationItem } from '@/components/ui/NavigationCard';

export default function FixedAssetsPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.FIXED_ASSETS_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const navigationItems: NavigationItem[] = [
    {
      title: tMenu('fixedAssetsManagement') || 'Mijloace fixe si obiecte de inventar',
      description: tMenu('fixedAssetsManagementDesc') || 'Gestionare mijloace fixe si obiecte de inventar',
      href: `/${locale}/dashboard/accounting/fixed-assets/manage`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      title: tMenu('inventoryRegisters') || 'Registre de inventor',
      description: tMenu('inventoryRegistersDesc') || 'Acces la registrele de inventar pe categorii',
      href: `/${locale}/dashboard/accounting/fixed-assets/registers`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      subItems: [
        { title: tMenu('buildings') || 'Cladiri', href: `/${locale}/dashboard/accounting/fixed-assets/registers/buildings` },
        { title: tMenu('land') || 'Terenuri', href: `/${locale}/dashboard/accounting/fixed-assets/registers/land` },
        { title: tMenu('transport') || 'Mijloace de transport', href: `/${locale}/dashboard/accounting/fixed-assets/registers/transport` },
        { title: tMenu('preciousObjects') || 'Obiecte din materiale prețioase', href: `/${locale}/dashboard/accounting/fixed-assets/registers/precious-objects` },
        { title: tMenu('religiousObjects') || 'Obiecte de cult', href: `/${locale}/dashboard/accounting/fixed-assets/registers/religious-objects` },
        { title: tMenu('furniture') || 'Mobilier, aparatura, decorațiuni', href: `/${locale}/dashboard/accounting/fixed-assets/registers/furniture` },
        { title: tMenu('religiousBooks') || 'Cărți de cult', href: `/${locale}/dashboard/accounting/fixed-assets/registers/religious-books` },
        { title: tMenu('libraryBooks') || 'Cărți de bibliotecă', href: `/${locale}/dashboard/accounting/fixed-assets/registers/library-books` },
        { title: tMenu('culturalGoods') || 'Registrul pentru evidenta analitica a bunurilor culturale', href: `/${locale}/dashboard/accounting/fixed-assets/registers/cultural-goods` },
        { title: tMenu('modernizations') || 'Modernizari', href: `/${locale}/dashboard/accounting/fixed-assets/registers/modernizations` },
      ],
    },
    {
      title: tMenu('exitsFromManagement') || 'Ieșiri din gestiune',
      description: tMenu('exitsFromManagementDesc') || 'Vizualizare mijloace fixe scoase din gestiune',
      href: `/${locale}/dashboard/accounting/fixed-assets/exits`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      title: tMenu('inventoryNumbersRegister') || 'Registrul numerelor de inventar',
      description: tMenu('inventoryNumbersRegisterDesc') || 'Registru complet al numerelor de inventar',
      href: `/${locale}/dashboard/accounting/fixed-assets/inventory-numbers`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
    },
    {
      title: tMenu('inventoryLists') || 'Liste de inventar',
      description: tMenu('inventoryListsDesc') || 'Liste și rapoarte de inventar',
      href: `/${locale}/dashboard/accounting/fixed-assets/inventory-lists`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      title: tMenu('inventoryTables') || 'Tabele de inventar',
      description: tMenu('inventoryTablesDesc') || 'Tabele și statistici de inventar',
      href: `/${locale}/dashboard/accounting/fixed-assets/inventory-tables`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
          { label: tMenu('fixedAssets') || 'Mijloace fixe si obiecte de inventar' },
        ]}
        title={tMenu('fixedAssets') || 'Mijloace fixe si obiecte de inventar'}
        description={tMenu('fixedAssetsDescription') || 'Gestionare și raportare pentru mijloace fixe și obiecte de inventar'}
      />

      <NavigationCardGrid items={navigationItems} />  
    </PageContainer>
  );
}


