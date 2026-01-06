'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { LessonViewer } from '@/components/catechesis/LessonViewer';
import { useLesson } from '@/hooks/useLesson';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';

export default function CatechesisLessonViewPage() {
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

  // Don't render content while checking permissions (after all hooks are called)
  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const handleClose = () => {
    router.push(`/${locale}/dashboard/catechesis/lessons/${id}`);
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
            { label: lesson?.title || id, href: `/${locale}/dashboard/catechesis/lessons/${id}` },
            { label: tCatechesis('lessons.view') },
          ]}
          title={tCatechesis('lessons.view')}
        />
        <div className="p-4 bg-danger/10 text-danger rounded-md">
          {error || tCatechesis('errors.lessonNotFound')}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="h-[calc(100vh-200px)]">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: tCatechesis('title'), href: `/${locale}/dashboard/catechesis` },
          { label: tCatechesis('lessons.title'), href: `/${locale}/dashboard/catechesis/lessons` },
          { label: lesson?.title || id, href: `/${locale}/dashboard/catechesis/lessons/${id}` },
          { label: tCatechesis('lessons.view') },
        ]}
        title={tCatechesis('lessons.view')}
      />
      <LessonViewer
        lessonId={id}
        onClose={handleClose}
        className="h-full"
      />
    </PageContainer>
  );
}

