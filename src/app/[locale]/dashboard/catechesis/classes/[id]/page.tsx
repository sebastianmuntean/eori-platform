'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';
import { PageContainer } from '@/components/ui/PageContainer';
import { ClassDetailsPageContent } from '@/components/catechesis/classes/ClassDetailsPageContent';
import { useCatechesisClasses } from '@/hooks/useCatechesisClasses';

/**
 * Class details page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ClassDetailsPageContent
 */
export default function CatechesisClassDetailsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');

  // Check permission to view classes
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.CLASSES_VIEW);

  // All hooks must be called before any conditional returns
  // We need to fetch classes to get the class name for the page title
  const { classes, fetchClasses } = useCatechesisClasses();
  const classItem = classes.find((c) => c.id === id);
  usePageTitle(classItem?.name ? `${classItem.name} - ${tCatechesis('classes.title')}` : tCatechesis('classes.title'));

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ClassDetailsPageContent locale={locale} id={id} />;
}
