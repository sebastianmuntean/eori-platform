'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';
import { PageContainer } from '@/components/ui/PageContainer';
import { PilgrimagesPageContent } from '@/components/pilgrimages/PilgrimagesPageContent';

/**
 * Pilgrimages page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in PilgrimagesPageContent
 */
export default function PilgrimagesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');
  usePageTitle(tPilgrimages('pilgrimages'));

  // Check permission to access pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <PilgrimagesPageContent locale={locale} />;
}

