'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PARISHIONERS_PERMISSIONS } from '@/lib/permissions/parishioners';
import { PageContainer } from '@/components/ui/PageContainer';
import { BirthdaysPageContent } from '@/components/parishioners/birthdays/BirthdaysPageContent';

/**
 * Birthdays page - thin container component
 * Handles only routing, permissions, and page title
 * All business logic and JSX is in BirthdaysPageContent
 */
export default function BirthdaysPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');
  usePageTitle(tMenu('birthdays') || t('birthdays') || 'Birthdays - EORI');

  // Check permission to access birthdays
  const { loading: permissionLoading } = useRequirePermission(PARISHIONERS_PERMISSIONS.BIRTHDAYS_VIEW);

  // Don't render content while checking permissions
  if (permissionLoading) {
    return (
      <PageContainer>
        <div>{t('loading')}</div>
      </PageContainer>
    );
  }

  return <BirthdaysPageContent locale={locale} />;
}


