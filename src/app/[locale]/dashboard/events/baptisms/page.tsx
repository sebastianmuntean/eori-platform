'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { EVENTS_PERMISSIONS } from '@/lib/permissions/events';
import { PageContainer } from '@/components/ui/PageContainer';
import { BaptismsPageContent } from '@/components/events/BaptismsPageContent';

/**
 * Baptisms page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in BaptismsPageContent
 */
export default function BaptismsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('baptisms'));

  // Check permission to access Baptisms
  const { loading: permissionLoading } = useRequirePermission(EVENTS_PERMISSIONS.VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <BaptismsPageContent locale={locale} />;
}

