'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';

export default function ParishionersPage() {
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');

  const menuItems = [
    {
      title: t('receipts') || 'Receipts',
      description: t('receiptsDescription') || 'Manage physical receipt files and records',
      href: `/${locale}/dashboard/parishioners/receipts`,
      icon: '📄',
    },
    {
      title: t('contracts') || 'Contracts',
      description: t('contractsDescription') || 'Manage parishioner contracts',
      href: `/${locale}/dashboard/parishioners/contracts`,
      icon: '📋',
    },
    {
      title: t('parishionerTypes') || 'Parishioner Types',
      description: t('parishionerTypesDescription') || 'Manage parishioner classifications',
      href: `/${locale}/dashboard/parishioners/types`,
      icon: '🏷️',
    },
    {
      title: t('birthdays') || 'Birthdays',
      description: t('birthdaysDescription') || 'View upcoming birthdays',
      href: `/${locale}/dashboard/parishioners/birthdays`,
      icon: '🎂',
    },
    {
      title: t('nameDays') || 'Name Days',
      description: t('nameDaysDescription') || 'View upcoming name days',
      href: `/${locale}/dashboard/parishioners/name-days`,
      icon: '📅',
    },
    {
      title: t('complexSearch') || 'Complex Search',
      description: t('complexSearchDescription') || 'Advanced search across parishioners',
      href: `/${locale}/dashboard/parishioners/search`,
      icon: '🔍',
    },
  ];

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: t('parishioners') || 'Parishioners' },
        ]}
        title={t('parishioners') || 'Parishioners'}
        description={t('parishionersDescription') || 'Manage parishioners, receipts, contracts, and related information'}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-text-secondary text-sm">{item.description}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}


