'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { InvoicesPageContent } from '@/components/accounting/invoices/InvoicesPageContent';

/**
 * Invoices page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in InvoicesPageContent
 */
export default function InvoicesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('invoices'));

  // Check permission to access invoices
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.INVOICES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <InvoicesPageContent locale={locale} />;
}
