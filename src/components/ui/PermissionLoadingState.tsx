'use client';

import { useTranslations } from 'next-intl';
import { PageContainer } from './PageContainer';

interface PermissionLoadingStateProps {
  message?: string;
}

/**
 * Reusable loading state component for permission checks
 * Provides consistent UI across all pages during permission verification
 */
export function PermissionLoadingState({ message }: PermissionLoadingStateProps) {
  const t = useTranslations('common');
  const displayMessage = message || t('loading') || 'Loading...';

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">{displayMessage}</div>
      </div>
    </PageContainer>
  );
}

