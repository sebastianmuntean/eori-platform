'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';
import { FloatingChatWindow } from '@/components/chat/FloatingChatWindow';
import { ChatProvider } from '@/contexts/ChatContext';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <ChatProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main
            className={cn(
              'flex-1 overflow-y-auto bg-bg-secondary',
              'transition-all duration-300',
              'min-w-0' // Prevents flex item from overflowing
            )}
          >
            <div className="p-6">{children}</div>
          </main>
        </div>
        <FloatingChatWindow />
      </div>
    </ChatProvider>
  );
}

