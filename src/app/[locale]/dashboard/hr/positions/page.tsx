'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { PageContainer } from '@/components/ui/PageContainer';
import { PositionsPageContent } from '@/components/hr/PositionsPageContent';

/**
 * Positions page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in PositionsPageContent
 */
export default function PositionsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(`${t('positions')} - EORI`);

  // Check permission to access positions
  const { loading: permissionLoading } = useRequirePermission(HR_PERMISSIONS.POSITIONS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <PositionsPageContent locale={locale} />;
}


