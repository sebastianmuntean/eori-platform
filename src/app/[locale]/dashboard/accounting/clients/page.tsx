'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { ClientsPageContent } from '@/components/accounting/clients/ClientsPageContent';

/**
 * Clients page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ClientsPageContent
 */
export default function ClientsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('clients'));

  // Check permission to access clients
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.CLIENTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ClientsPageContent locale={locale} />;
}
