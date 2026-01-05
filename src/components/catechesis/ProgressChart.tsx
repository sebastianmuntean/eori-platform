'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';

interface ProgressItem {
  id: string;
  lessonTitle: string;
  status: 'not_started' | 'in_progress' | 'completed';
  timeSpentMinutes: number | null;
  score: string | null;
  completedAt: string | null;
}

interface ProgressChartProps {
  progress: ProgressItem[];
  className?: string;
}

export function ProgressChart({ progress, className = '' }: ProgressChartProps) {
  const t = useTranslations('catechesis');

  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const inProgressCount = progress.filter((p) => p.status === 'in_progress').length;
  const notStartedCount = progress.filter((p) => p.status === 'not_started').length;
  const totalCount = progress.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-white">{t('progress.completed')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning text-white">{t('progress.inProgress')}</Badge>;
      default:
        return <Badge variant="secondary">{t('progress.notStarted')}</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-lg font-semibold">{t('progress.title')}</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-bg-secondary rounded-md">
              <div className="text-2xl font-bold text-primary">{totalCount}</div>
              <div className="text-sm text-text-secondary">Total</div>
            </div>
            <div className="text-center p-4 bg-success/10 rounded-md">
              <div className="text-2xl font-bold text-success">{completedCount}</div>
              <div className="text-sm text-text-secondary">{t('progress.completed')}</div>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-md">
              <div className="text-2xl font-bold text-warning">{inProgressCount}</div>
              <div className="text-sm text-text-secondary">{t('progress.inProgress')}</div>
            </div>
            <div className="text-center p-4 bg-bg-secondary rounded-md">
              <div className="text-2xl font-bold text-text-secondary">{notStartedCount}</div>
              <div className="text-sm text-text-secondary">{t('progress.notStarted')}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{t('progress.title')}</span>
              <span className="text-sm text-text-secondary">{completionRate}%</span>
            </div>
            <div className="w-full bg-bg-secondary rounded-full h-4 overflow-hidden">
              <div
                className="bg-success h-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Progress List */}
          <div className="space-y-2">
            {progress.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-bg-secondary rounded-md"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.lessonTitle}</div>
                  {item.timeSpentMinutes && (
                    <div className="text-sm text-text-secondary">
                      {item.timeSpentMinutes} {t('progress.timeSpentMinutes')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {item.score && (
                    <div className="text-sm font-medium">{item.score}%</div>
                  )}
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

