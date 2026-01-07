'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';
import { PageContainer } from '@/components/ui/PageContainer';
import { ParishionerSearchPageContent } from '@/components/parishioners/search/ParishionerSearchPageContent';

/**
 * Parishioner Search page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ParishionerSearchPageContent
 */
export default function ParishionerSearchPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(t('search') || 'Search - EORI');

  // Check permission to access search
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.SEARCH);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ParishionerSearchPageContent locale={locale} />;
}

