'use client';

import { useEffect } from 'react';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card } from '@/components/ui/Card';

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Chat', href: '/dashboard/chat' },
        ]}
      />
      <Card className="flex-1 flex flex-col min-h-0 mt-6">
        <div className="flex-1 min-h-0">
          <ChatWidget className="h-full" />
        </div>
      </Card>
    </div>
  );
}

