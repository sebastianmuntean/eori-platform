'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { LessonViewer } from '@/components/catechesis/LessonViewer';
import { useLesson } from '@/hooks/useLesson';
import { useTranslations } from 'next-intl';

interface LessonViewPageContentProps {
  locale: string;
  id: string;
}

/**
 * Lesson view page content component
 * Contains all the JSX/HTML that was previously in the page file
 * Separates presentation from routing and permission logic
 */
export function LessonViewPageContent({ locale, id }: LessonViewPageContentProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  const { lesson, loading, error } = useLesson(id);

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

