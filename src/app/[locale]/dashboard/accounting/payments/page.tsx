'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/ui/PageContainer';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PaymentsPageContent } from '@/components/accounting/payments/PaymentsPageContent';

export default function PaymentsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('payments'));

  // Check permission to access payments
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.PAYMENTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <PaymentsPageContent locale={locale} />;
}

