'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { GlobalSettingsPageContent } from '@/components/administration/global-settings/GlobalSettingsPageContent';

/**
 * Global Settings page
 */
export default function GlobalSettingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  usePageTitle(`${t('globalSettings') || 'Global Settings'} - EORI`);

  return <GlobalSettingsPageContent locale={locale} />;
}

