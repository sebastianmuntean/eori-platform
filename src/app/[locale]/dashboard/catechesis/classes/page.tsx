'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CATECHESIS_PERMISSIONS } from '@/lib/permissions/catechesis';
import { PageContainer } from '@/components/ui/PageContainer';
import { ClassesPageContent } from '@/components/catechesis/classes/ClassesPageContent';

/**
 * Classes page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in ClassesPageContent
 */
export default function CatechesisClassesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tCatechesis = useTranslations('catechesis');
  usePageTitle(tCatechesis('classes.title'));

  // Check permission to view classes
  const { loading: permissionLoading } = useRequirePermission(CATECHESIS_PERMISSIONS.CLASSES_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <ClassesPageContent locale={locale} />;
}

