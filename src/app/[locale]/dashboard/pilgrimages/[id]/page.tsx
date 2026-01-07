'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PILGRIMAGES_PERMISSIONS } from '@/lib/permissions/pilgrimages';
import { PageContainer } from '@/components/ui/PageContainer';
import { usePilgrimage } from '@/hooks/usePilgrimage';
import { PilgrimageDetailsPageContent } from '@/components/pilgrimages/PilgrimageDetailsPageContent';

/**
 * Pilgrimage details page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in PilgrimageDetailsPageContent
 */
export default function PilgrimageDetailsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tPilgrimages = useTranslations('pilgrimages');

  // Check permission to view pilgrimages
  const { loading: permissionLoading } = useRequirePermission(PILGRIMAGES_PERMISSIONS.VIEW);

  // All hooks must be called before any conditional returns
  const { pilgrimage } = usePilgrimage();
  usePageTitle(pilgrimage?.title || tPilgrimages('pilgrimages'));

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <PilgrimageDetailsPageContent locale={locale} id={id} />;
}

