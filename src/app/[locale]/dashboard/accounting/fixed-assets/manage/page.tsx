'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { FixedAssetsManagePageContent } from '@/components/accounting/fixed-assets/FixedAssetsManagePageContent';

/**
 * Fixed Assets Manage page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in FixedAssetsManagePageContent
 */
export default function FixedAssetsManagePage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('fixedAssetsManagement'));

  // Check permission to manage fixed assets
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.FIXED_ASSETS_MANAGE);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <FixedAssetsManagePageContent locale={locale} />;
}

