'use client';

import { useSidebar } from '@/hooks/useSidebar';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  subItems?: MenuItem[];
}


const defaultIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

export function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobile, toggleCollapse } = useSidebar();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('menu');

  // Build menu groups with translations - memoized to prevent dependency issues
  const translatedMenuGroups: MenuGroup[] = useMemo(() => [
    {
      label: t('management'),
      items: [
        { label: t('dashboard'), href: `/${locale}/dashboard` },
        {
          label: t('dataStatistics'),
          href: `/${locale}/dashboard/data-statistics`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          label: 'Chat',
          href: `/${locale}/dashboard/chat`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
        },
        // TODO: Create these pages
        // { label: t('entities'), href: `/${locale}/dashboard/modules/entities` },
        // { label: t('reports'), href: `/${locale}/dashboard/modules/reports` },
      ],
    },
    {
      label: t('registratura'),
      items: [
        {
          label: t('registrulGeneral'),
          href: `/${locale}/dashboard/registry/general-register`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          label: t('onlineForms'),
          href: `/${locale}/dashboard/registry/online-forms`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          label: t('mappingDatasets'),
          href: `/${locale}/dashboard/registry/online-forms/mapping-datasets`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          ),
        },
        {
          label: t('configuration'),
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          subItems: [
            {
              label: t('registers'),
              href: `/${locale}/dashboard/registry/register-configurations`,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
          ],
        },
      ],
    },
    {
      label: t('pangare') || 'Pangare',
      items: [
        {
          label: t('pangar') || 'Pangar',
          href: `/${locale}/dashboard/pangare/pangar`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          ),
        },
        {
          label: t('warehouses') || 'Gestiuni',
          href: `/${locale}/dashboard/accounting/warehouses`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          label: t('products') || 'Produse',
          href: `/${locale}/dashboard/pangare/produse`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          label: t('stockMovements') || 'Mișcări Stoc',
          href: `/${locale}/dashboard/accounting/stock-movements`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          ),
        },
        {
          label: t('stockLevels') || 'Niveluri Stoc',
          href: `/${locale}/dashboard/accounting/stock-levels`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          label: t('inventar') || 'Inventar',
          href: `/${locale}/dashboard/pangare/inventar`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
        },
        {
          label: t('fixedAssets') || 'Mijloace fixe si obiecte de inventar',
          href: `/${locale}/dashboard/accounting/fixed-assets`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          subItems: [
            {
              label: t('fixedAssetsManagement') || 'Gestionare',
              href: `/${locale}/dashboard/accounting/fixed-assets/manage`,
            },
            {
              label: t('buildings') || 'Cladiri',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/buildings`,
            },
            {
              label: t('land') || 'Terenuri',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/land`,
            },
            {
              label: t('transport') || 'Mijloace de transport',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/transport`,
            },
            {
              label: t('preciousObjects') || 'Obiecte din materiale prețioase',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/precious-objects`,
            },
            {
              label: t('religiousObjects') || 'Obiecte de cult',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/religious-objects`,
            },
            {
              label: t('furniture') || 'Mobilier, aparatura, decorațiuni',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/furniture`,
            },
            {
              label: t('religiousBooks') || 'Cărți de cult',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/religious-books`,
            },
            {
              label: t('libraryBooks') || 'Cărți de bibliotecă',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/library-books`,
            },
            {
              label: t('culturalGoods') || 'Registrul pentru evidenta analitica a bunurilor culturale',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/cultural-goods`,
            },
            {
              label: t('modernizations') || 'Modernizari',
              href: `/${locale}/dashboard/accounting/fixed-assets/registers/modernizations`,
            },
            {
              label: t('exitsFromManagement') || 'Ieșiri din gestiune',
              href: `/${locale}/dashboard/accounting/fixed-assets/exits`,
            },
            {
              label: t('inventoryNumbersRegister') || 'Registrul numerelor de inventar',
              href: `/${locale}/dashboard/accounting/fixed-assets/inventory-numbers`,
            },
            {
              label: t('inventoryLists') || 'Liste de inventar',
              href: `/${locale}/dashboard/accounting/fixed-assets/inventory-lists`,
            },
            {
              label: t('inventoryTables') || 'Tabele de inventar',
              href: `/${locale}/dashboard/accounting/fixed-assets/inventory-tables`,
            },
          ],
        },
      ],
    },
    {
      label: t('accounting'),
      items: [
        {
          label: t('payments'),
          href: `/${locale}/dashboard/accounting/payments`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          label: t('donations'),
          href: `/${locale}/dashboard/accounting/donations`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ),
        },
        {
          label: t('invoices'),
          href: `/${locale}/dashboard/accounting/invoices`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          label: t('contracts'),
          href: `/${locale}/dashboard/accounting/contracts`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          label: t('suppliers'),
          href: `/${locale}/dashboard/accounting/suppliers`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          label: t('clients'),
          href: `/${locale}/dashboard/accounting/clients`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: t('administration'),
      items: [
        {
          label: t('eparhii'),
          href: `/${locale}/dashboard/administration/dioceses`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          label: t('protopopiate'),
          href: `/${locale}/dashboard/administration/deaneries`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          label: t('parohii'),
          href: `/${locale}/dashboard/administration/parishes`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
        {
          label: t('departamente'),
          href: `/${locale}/dashboard/administration/departments`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
      ],
    },
    {
      label: t('setari'),
      items: [
        {
          label: t('utilizatori'),
          href: `/${locale}/dashboard/administration/users`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          label: t('emailTemplates'),
          href: `/${locale}/dashboard/administration/email-templates`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      label: t('superadmin'),
      items: [
        {
          label: t('overview'),
          href: `/${locale}/dashboard/superadmin`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          label: t('roles'),
          href: `/${locale}/dashboard/superadmin/roles`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          label: t('permissions'),
          href: `/${locale}/dashboard/superadmin/permissions`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
        },
        {
          label: t('userRoles'),
          href: `/${locale}/dashboard/superadmin/user-roles`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          label: t('rolePermissions'),
          href: `/${locale}/dashboard/superadmin/role-permissions`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
        {
          label: t('emailTemplates'),
          href: `/${locale}/dashboard/superadmin/email-templates`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
    },
  ], [locale, t]);

  // Expand all groups by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(translatedMenuGroups.map((g) => g.label))
  );

  // Track expanded sub-items
  const [expandedSubItems, setExpandedSubItems] = useState<Set<string>>(
    new Set()
  );

  // Auto-expand sub-items if current path matches
  useEffect(() => {
    const toExpand = new Set<string>();
    translatedMenuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some((subItem) => 
            subItem.href && (pathname === subItem.href || pathname.startsWith(subItem.href + '/'))
          );
          if (hasActiveSubItem) {
            toExpand.add(item.label);
          }
        }
      });
    });
    if (toExpand.size > 0) {
      setExpandedSubItems((prev) => {
        const newSet = new Set(prev);
        toExpand.forEach((label) => newSet.add(label));
        return newSet;
      });
    }
  }, [pathname, translatedMenuGroups]);

  const toggleGroup = (groupLabel: string) => {
    console.log('Step 2: Toggling menu group:', groupLabel);
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
        console.log('✓ Group collapsed');
      } else {
        newSet.add(groupLabel);
        console.log('✓ Group expanded');
      }
      return newSet;
    });
  };

  const toggleSubItem = (itemLabel: string) => {
    setExpandedSubItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemLabel)) {
        newSet.delete(itemLabel);
      } else {
        newSet.add(itemLabel);
      }
      return newSet;
    });
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50',
          'bg-bg-secondary border-r border-border',
          'flex flex-col flex-shrink-0',
          'transition-all duration-300',
          isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          'flex items-center border-b border-border',
          isCollapsed ? 'justify-center p-4' : 'justify-between p-4'
        )}>
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-text-primary">{t('menu')}</h2>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
          )}
          <button
            onClick={() => {
              console.log('Step 3: Toggling sidebar collapse');
              toggleCollapse();
            }}
            className="hidden lg:block p-1 rounded hover:bg-bg-tertiary transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={cn(
                'w-5 h-5 text-text-secondary transition-transform',
                isCollapsed && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {translatedMenuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              {!isCollapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
                >
                  <span>{group.label}</span>
                  <svg
                    className={cn(
                      'w-4 h-4 transition-transform',
                      expandedGroups.has(group.label) && 'rotate-90'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
              {(isCollapsed || expandedGroups.has(group.label)) && (
                <ul className={cn('space-y-1', isCollapsed && 'mt-2')}>
                  {group.items.map((item, itemIndex) => {
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isSubItemExpanded = expandedSubItems.has(item.label);
                    const active = isActive(item.href);
                    const hasActiveSubItem = hasSubItems && item.subItems?.some(subItem => isActive(subItem.href));

                    return (
                      <li key={itemIndex}>
                        {hasSubItems ? (
                          <>
                            <button
                              onClick={() => {
                                if (!isCollapsed) {
                                  toggleSubItem(item.label);
                                }
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                                'hover:bg-bg-tertiary',
                                (active || hasActiveSubItem)
                                  ? 'bg-primary text-white'
                                  : 'text-text-secondary hover:text-text-primary',
                                isCollapsed && 'justify-center'
                              )}
                            >
                              <span className="flex-shrink-0">
                                {item.icon || defaultIcon}
                              </span>
                              {!isCollapsed && (
                                <>
                                  <span className="flex-1 text-left">{item.label}</span>
                                  {item.badge && (
                                    <Badge variant="primary" size="sm">
                                      {item.badge}
                                    </Badge>
                                  )}
                                  <svg
                                    className={cn(
                                      'w-4 h-4 transition-transform',
                                      isSubItemExpanded && 'rotate-90'
                                    )}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </>
                              )}
                            </button>
                            {!isCollapsed && isSubItemExpanded && (
                              <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                                {item.subItems.map((subItem, subItemIndex) => {
                                  const subActive = isActive(subItem.href);
                                  return (
                                    <li key={subItemIndex}>
                                      <Link
                                        href={subItem.href || '#'}
                                        onClick={closeMobile}
                                        className={cn(
                                          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                                          'hover:bg-bg-tertiary',
                                          subActive
                                            ? 'bg-primary text-white'
                                            : 'text-text-secondary hover:text-text-primary'
                                        )}
                                      >
                                        <span className="flex-shrink-0">
                                          {subItem.icon || defaultIcon}
                                        </span>
                                        <span className="flex-1">{subItem.label}</span>
                                        {subItem.badge && (
                                          <Badge variant="primary" size="sm">
                                            {subItem.badge}
                                          </Badge>
                                        )}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href || '#'}
                            onClick={closeMobile}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                              'hover:bg-bg-tertiary',
                              active
                                ? 'bg-primary text-white'
                                : 'text-text-secondary hover:text-text-primary',
                              isCollapsed && 'justify-center'
                            )}
                          >
                            <span className="flex-shrink-0">
                              {item.icon || defaultIcon}
                            </span>
                            {!isCollapsed && (
                              <>
                                <span className="flex-1">{item.label}</span>
                                {item.badge && (
                                  <Badge variant="primary" size="sm">
                                    {item.badge}
                                  </Badge>
                                )}
                              </>
                            )}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

