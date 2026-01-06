'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { CHAT_PERMISSIONS } from '@/lib/permissions/chat';

export default function ChatPage() {
  const { loading: permissionLoading } = useRequirePermission(CHAT_PERMISSIONS.VIEW);
  const t = useTranslations('common');
  usePageTitle('Chat');

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
          { label: 'Chat' },
        ]}
        title="Chat"
        className="mb-6"
      />
      <Card className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <ChatWidget className="h-full" />
        </div>
      </Card>
    </div>
  );
}

