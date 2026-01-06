'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { RegisterConfigurationList } from '@/components/registratura/RegisterConfigurationList';
import { useTranslations } from 'next-intl';
import { Card, CardBody } from '@/components/ui/Card';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { REGISTRATURA_PERMISSIONS } from '@/lib/permissions/registratura';

export default function RegisterConfigurationsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tReg = useTranslations('registratura');

  // Check permission to view register configurations
  const { loading } = useRequirePermission(REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_VIEW);

  // Don't render content while checking permissions
  if (loading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tReg('registratura'), href: `/${locale}/dashboard/registry` },
          { label: tReg('registerConfigurations.title') },
        ]}
        title={tReg('registerConfigurations.title') || 'Register Configurations'}
        description={tReg('registerConfigurations.description')}
      />

      <Card>
        <CardBody>
          <RegisterConfigurationList />
        </CardBody>
      </Card>
    </div>
  );
}

