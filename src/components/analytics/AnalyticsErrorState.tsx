import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';

interface AnalyticsErrorStateProps {
  breadcrumbs: Array<{ label: string; href: string }>;
  title: string;
  error: string;
  onRetry: () => void;
  t: (key: string) => string;
}

export function AnalyticsErrorState({
  breadcrumbs,
  title,
  error,
  onRetry,
  t,
}: AnalyticsErrorStateProps) {
  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        className="mb-6"
      />
      <div className="text-center py-12">
        <p className="text-danger">{error}</p>
        <Button onClick={onRetry} className="mt-4">
          {t('retry') || 'Retry'}
        </Button>
      </div>
    </PageContainer>
  );
}

