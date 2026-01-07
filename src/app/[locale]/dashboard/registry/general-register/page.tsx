'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';
import { PageContainer } from '@/components/ui/PageContainer';
import { GeneralRegisterPageContent } from '@/components/registry/general-register/GeneralRegisterPageContent';

/**
 * General Register page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in GeneralRegisterPageContent
 */
export default function RegistryGeneralPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');
  usePageTitle(tReg('generalRegister'));

  // Check permission to view general register
  const { loading: permissionLoading } = useRequirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <GeneralRegisterPageContent locale={locale} />;
}

