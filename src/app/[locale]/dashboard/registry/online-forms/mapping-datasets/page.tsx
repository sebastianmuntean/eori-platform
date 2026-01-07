'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';
import { PageContainer } from '@/components/ui/PageContainer';
import { MappingDatasetsPageContent } from '@/components/registry/mapping-datasets/MappingDatasetsPageContent';

/**
 * Mapping Datasets page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in MappingDatasetsPageContent
 */
export default function MappingDatasetsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tForms = useTranslations('online-forms');
  usePageTitle(tForms('mappingDatasets'));

  // Check permission to view mapping datasets
  const { loading: permissionLoading } = useRequirePermission(REGISTRATURA_PERMISSIONS.MAPPING_DATASETS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <MappingDatasetsPageContent locale={locale} />;
}


