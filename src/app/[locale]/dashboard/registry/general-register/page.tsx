'use client';

import { useParams, useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentList } from '@/components/registratura/DocumentList';
import { useTranslations } from 'next-intl';

export default function RegistryGeneralPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');

  const handleDocumentClick = (document: any) => {
    router.push(`/${locale}/dashboard/registry/general-register/${document.id}`);
  };

  const handleCreateNew = () => {
    router.push(`/${locale}/dashboard/registry/general-register/new`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry` },
          { label: tReg('generalRegister'), href: `/${locale}/dashboard/registry/general-register` },
        ]}
      />

      <DocumentList
        onDocumentClick={handleDocumentClick}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
}

