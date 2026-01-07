'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';
import { PageContainer } from '@/components/ui/PageContainer';
import { StudentsPageContent } from '@/components/catechesis/students/StudentsPageContent';

/**
 * Students page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in StudentsPageContent
 */
export default function CatechesisStudentsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');
  usePageTitle(tCatechesis('students.title'));

  // Check permission to view students
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.STUDENTS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <StudentsPageContent locale={locale} />;
}

