'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PANGARE_PERMISSIONS } from '@/lib/permissions/pangare';

export default function UtilizatoriPangarPage() {
  const { loading: permissionLoading } = useRequirePermission(PANGARE_PERMISSIONS.UTILIZATORI_VIEW);
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  // Don't render content while checking permissions
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tMenu('pangare') || 'Pangare', href: `/${locale}/dashboard/pangare` },
          { label: t('utilizatori') || 'Utilizatori' },
        ]}
        title={t('utilizatori') || 'Utilizatori'}
      />

      <Card>
        <CardBody>
          <p className="text-text-secondary">
            {t('pageUnderConstruction') || 'Această pagină este în construcție.'}
          </p>
        </CardBody>
      </Card>
    </PageContainer>
  );
}


