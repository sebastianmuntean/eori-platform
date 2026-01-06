import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';

interface AnalyticsLoadingStateProps {
  breadcrumbs: Array<{ label: string; href: string }>;
  title: string;
  t: (key: string) => string;
}

export function AnalyticsLoadingState({
  breadcrumbs,
  title,
  t,
}: AnalyticsLoadingStateProps) {
  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        className="mb-6"
      />
      <div className="text-center py-12">
        <p className="text-text-secondary">{t('loading')}</p>
      </div>
    </PageContainer>
  );
}

