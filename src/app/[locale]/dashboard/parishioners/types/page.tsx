'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';
import { PageContainer } from '@/components/ui/PageContainer';
import { ParishionerTypesPageContent } from '@/components/parishioners/types/ParishionerTypesPageContent';

/**
 * Parishioner Types page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ParishionerTypesPageContent
 */
export default function ParishionerTypesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('parishionerTypes') || t('parishionerTypes') || 'Parishioner Types - EORI');

  // Check permission to access parishioner types
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.TYPES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ParishionerTypesPageContent locale={locale} />;
}


