'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LessonEditor } from '@/components/catechesis/LessonEditor';
import { useLesson } from '@/hooks/useLesson';
import { useCatechesisClasses } from '@/hooks/useCatechesisClasses';
import { useCatechesisLessons, CatechesisLesson } from '@/hooks/useCatechesisLessons';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

export default function CatechesisLessonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  // Check permission to view lessons
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.LESSONS_VIEW);

  // All hooks must be called before any conditional returns
  const { lesson, loading, error } = useLesson(id);
  usePageTitle(lesson?.title || tCatechesis('lessons.title'));
  const { classes, fetchClasses } = useCatechesisClasses();

  useEffect(() => {
    if (permissionLoading) return;
    fetchClasses({ pageSize: 1000 });
  }, [permissionLoading, fetchClasses]);

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
  };

  const handleSave = async (savedLesson: CatechesisLesson) => {
    // Lesson is updated in the hook, but we need to refetch to get latest data
    // The LessonEditor component handles the update internally
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('loading')}</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <PageContainer>
        <PageHeader
          breadcrumbs={[
            { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
            { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
            { label: tCatechesis('lessons.title'), href: `/${locale}/dashboard/catechesis/lessons` },
            { label: id },
          ]}
          title={id}
        />
        <div className="p-4 bg-danger/10 text-danger rounded-md">
          {error || tCatechesis('errors.lessonNotFound')}
        </div>
      </PageContainer>
    );
  }

  const classItem = lesson.classId ? classes.find((c) => c.id === lesson.classId) : null;

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
          { label: tCatechesis('lessons.title'), href: `/${locale}/dashboard/catechesis/lessons` },
          { label: lesson?.title || id },
        ]}
        title={lesson?.title || id}
      />

      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {lesson.description && (
                <p className="text-text-secondary">{lesson.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant={lesson.isPublished ? 'success' : 'secondary'}>
                {lesson.isPublished ? tCatechesis('status.published') : tCatechesis('status.unpublished')}
              </Badge>
              <Button
                variant="secondary"
                onClick={() => router.push(`/${locale}/dashboard/catechesis/lessons/${id}/view`)}
              >
                {tCatechesis('lessons.view')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {classItem && (
              <div>
                <div className="text-sm text-text-secondary">{tCatechesis('classes.title')}</div>
                <div className="font-medium">
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/dashboard/catechesis/classes/${classItem.id}`)}
                    className="text-primary hover:underline"
                  >
                    {classItem.name}
                  </button>
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-text-secondary">{tCatechesis('lessons.orderIndex')}</div>
              <div className="font-medium">{lesson.orderIndex}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">{tCatechesis('lessons.durationMinutes')}</div>
              <div className="font-medium">{lesson.durationMinutes ? `${lesson.durationMinutes} min` : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">{t('createdAt')}</div>
              <div className="font-medium">{formatDate(lesson.createdAt?.toString() || null)}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lesson Editor */}
      <LessonEditor
        lessonId={id}
        onSave={handleSave}
        onCancel={() => router.push(`/${locale}/dashboard/catechesis/lessons`)}
      />
    </PageContainer>
  );
}

