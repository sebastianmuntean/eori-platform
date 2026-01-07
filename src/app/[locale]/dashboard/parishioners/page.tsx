'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';
import { PageContainer } from '@/components/ui/PageContainer';
import { ParishionersPageContent } from '@/components/parishioners/ParishionersPageContent';

/**
 * Parishioners page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ParishionersPageContent
 */
export default function ParishionersPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('parishioners') || t('parishioners') || 'Parishioners - EORI');

  // Check permission to access parishioners
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ParishionersPageContent locale={locale} />;
}


