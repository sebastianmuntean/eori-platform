'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageContainer } from '@/components/ui/PageContainer';
import { UserProfilePageContent } from '@/components/profile/UserProfilePageContent';

/**
 * Profile page - thin container component
 * Handles only routing and page title
 * All business logic and JSX is in UserProfilePageContent
 */
export default function ProfilePage() {
  const params = useParams();
  const locale = params.locale as string;
  const tProfile = useTranslations('profile');
  usePageTitle(`${tProfile('title') || 'Profile'} - EORI`);

  return <UserProfilePageContent locale={locale} />;
}
