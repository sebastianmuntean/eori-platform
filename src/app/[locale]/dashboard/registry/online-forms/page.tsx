'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';
import { PageContainer } from '@/components/ui/PageContainer';
import { OnlineFormsPageContent } from '@/components/registry/online-forms/OnlineFormsPageContent';

/**
 * Online Forms page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in OnlineFormsPageContent
 */
export default function OnlineFormsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');
  usePageTitle(tForms('onlineForms'));

  // Check permission to view online forms
  const { loading: permissionLoading } = useRequirePermission(REGISTRATURA_PERMISSIONS.ONLINE_FORMS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <OnlineFormsPageContent locale={locale} />;
}

