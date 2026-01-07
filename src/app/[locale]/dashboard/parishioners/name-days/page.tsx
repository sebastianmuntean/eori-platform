'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';
import { PageContainer } from '@/components/ui/PageContainer';
import { NameDaysPageContent } from '@/components/parishioners/name-days/NameDaysPageContent';

/**
 * Name Days page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in NameDaysPageContent
 */
export default function NameDaysPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('nameDays') || t('nameDays') || 'Name Days - EORI');

  // Check permission to access name days
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.NAME_DAYS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <NameDaysPageContent locale={locale} />;
}


