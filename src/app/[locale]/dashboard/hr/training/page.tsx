'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { HR_PERMISSIONS } from '@/lib/permissions/hr';
import { PageContainer } from '@/components/ui/PageContainer';
import { TrainingPageContent } from '@/components/hr/TrainingPageContent';

export default function TrainingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(`${t('training')} - EORI`);

  const { loading: permissionLoading } = useRequirePermission(HR_PERMISSIONS.TRAINING_COURSES_VIEW);

  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <TrainingPageContent locale={locale} />;
}

