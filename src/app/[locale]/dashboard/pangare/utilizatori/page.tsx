'use client';

import { useParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';

export default function UtilizatoriPangarPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tMenu('pangare') || 'Pangare', href: `/${locale}/dashboard/pangare` },
          { label: t('utilizatori') || 'Utilizatori' },
        ]}
      />

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{t('utilizatori') || 'Utilizatori'}</h1>
        </CardHeader>
        <CardBody>
          <p className="text-text-secondary">
            {t('pageUnderConstruction') || 'Această pagină este în construcție.'}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

