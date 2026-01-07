'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';
import { PageContainer } from '@/components/ui/PageContainer';
import { ReceiptsPageContent } from '@/components/parishioners/receipts/ReceiptsPageContent';

/**
 * Receipts page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ReceiptsPageContent
 */
export default function ReceiptsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('receipts') || t('receipts') || 'Receipts - EORI');

  // Check permission to access receipts
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.RECEIPTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ReceiptsPageContent locale={locale} />;
}
