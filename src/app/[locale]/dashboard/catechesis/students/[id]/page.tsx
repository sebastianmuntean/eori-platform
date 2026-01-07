'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';
import { PageContainer } from '@/components/ui/PageContainer';
import { StudentDetailsPageContent } from '@/components/catechesis/students/StudentDetailsPageContent';
import { useCatechesisStudents } from '@/hooks/useCatechesisStudents';

/**
 * Student details page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in StudentDetailsPageContent
 */
export default function CatechesisStudentDetailsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  // Check permission to view students
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.STUDENTS_VIEW);

  // All hooks must be called before any conditional returns
  // We need to fetch students to get the student name for the page title
  const { students, fetchStudents } = useCatechesisStudents();
  const student = students.find((s) => s.id === id);
  usePageTitle(student ? `${student.firstName} ${student.lastName} - ${tCatechesis('students.title')}` : tCatechesis('students.title'));

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <StudentDetailsPageContent locale={locale} id={id} />;
}
