'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { GeneralRegisterList } from '@/components/registratura/GeneralRegisterList';
import { useTranslations } from 'next-intl';
import { GeneralRegisterDocument } from '@/hooks/useGeneralRegister';

interface GeneralRegisterPageContentProps {
  locale: string;
}

/**
 * General Register page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function GeneralRegisterPageContent({ locale }: GeneralRegisterPageContentProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');

  const handleDocumentClick = useCallback(
    (document: GeneralRegisterDocument) => {
      router.push(`/${locale}/dashboard/registry/general-register/${document.id}`);
    },
    [router, locale]
  );

  const handleCreateNew = useCallback(() => {
    router.push(`/${locale}/dashboard/registry/general-register/new`);
  }, [router, locale]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry` },
          { label: tReg('generalRegister') },
        ]}
        title={tReg('generalRegister') || 'General Register'}
      />

      <GeneralRegisterList
        onDocumentClick={handleDocumentClick}
        onCreateNew={handleCreateNew}
      />
    </PageContainer>
  );
}

