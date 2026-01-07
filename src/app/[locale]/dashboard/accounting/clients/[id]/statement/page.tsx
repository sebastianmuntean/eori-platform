'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { ClientStatementPageContent } from '@/components/accounting/clients/ClientStatementPageContent';

/**
 * Client Statement page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ClientStatementPageContent
 */
export default function ClientStatementPage() {
  const params = useParams();
  const locale = params.locale as string;
  const clientId = params.id as string;
  const t = useTranslations('common');

  // Check permission to view client statement
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.CLIENTS_VIEW_STATEMENT);

  // Set basic page title - will be updated by content component once client data is loaded
  usePageTitle(`${t('statement')} - EORI`);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ClientStatementPageContent locale={locale} clientId={clientId} />;
}