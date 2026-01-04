'use client';

import { useParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RegisterConfigurationList } from '@/components/registratura/RegisterConfigurationList';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

export default function RegisterConfigurationsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry/registratura` },
          { label: tReg('registerConfigurations.title'), href: `/${locale}/dashboard/registry/registratura/configurari-registre` },
        ]}
      />

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{tReg('registerConfigurations.title')}</h1>
          <p className="text-gray-600">
            {tReg('registerConfigurations.description')}
          </p>
        </CardHeader>
        <CardBody>
          <RegisterConfigurationList />
        </CardBody>
      </Card>
    </div>
  );
}
