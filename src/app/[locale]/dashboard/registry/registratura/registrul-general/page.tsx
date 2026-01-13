'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { GeneralRegisterList } from '@/components/registratura/GeneralRegisterList';
import { useTranslations } from 'next-intl';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';
import { GeneralRegisterDocument } from '@/hooks/useGeneralRegister';

export default function RegistraturaGeneralPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');

  // Check permission to view general register
  const { loading } = useRequirePermission(REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW);

  // Don't render content while checking permissions
  if (loading) {
    return null;
  }

  const handleDocumentClick = (document: GeneralRegisterDocument) => {
    router.push(`/${locale}/dashboard/registry/registratura/registrul-general/${document.id}`);
  };

  const handleCreateNew = () => {
    // The GeneralRegisterList component will handle adding registerId to URL
    router.push(`/${locale}/dashboard/registry/registratura/registrul-general/new`);
  };

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry/registratura` },
          { label: tReg('generalRegister') },
        ]}
        title={tReg('generalRegister') || 'General Register'}
        className="mb-6"
      />

      <GeneralRegisterList
        onDocumentClick={handleDocumentClick}
        onCreateNew={handleCreateNew}
      />
    </PageContainer>
  );
}
