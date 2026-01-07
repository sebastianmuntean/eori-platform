'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';
import { PageContainer } from '@/components/ui/PageContainer';
import { LessonDetailsPageContent } from '@/components/catechesis/lessons/LessonDetailsPageContent';
import { useLesson } from '@/hooks/useLesson';

/**
 * Lesson details page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in LessonDetailsPageContent
 */
export default function CatechesisLessonDetailsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  // Check permission to view lessons
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.LESSONS_VIEW);

  // All hooks must be called before any conditional returns
  const { lesson } = useLesson(id);
  usePageTitle(lesson?.title || tCatechesis('lessons.title'));

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <LessonDetailsPageContent locale={locale} id={id} />;
}
