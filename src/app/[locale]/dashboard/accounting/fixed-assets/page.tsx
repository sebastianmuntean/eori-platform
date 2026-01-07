'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { PageContainer } from '@/components/ui/PageContainer';
import { FixedAssetsPageContent } from '@/components/accounting/fixed-assets/FixedAssetsPageContent';

/**
 * Fixed Assets page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in FixedAssetsPageContent
 */
export default function FixedAssetsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  
  usePageTitle(tMenu('fixedAssets'));

  // Check permission to access fixed assets
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.FIXED_ASSETS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <FixedAssetsPageContent locale={locale} />;
}


