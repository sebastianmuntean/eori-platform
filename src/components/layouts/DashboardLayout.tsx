'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { FloatingChatWindow } from '@/components/chat/FloatingChatWindow';
import { ChatProvider } from '@/contexts/ChatContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { useUser } from '@/hooks/useUser';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Redirect to login if user is not authenticated
  useEffect(() => {
    // Don't redirect while loading
    if (userLoading) {
      return;
    }

    // If no user is found after loading completes, redirect to login
    if (!user) {
      const currentPath = window.location.pathname;
      const loginUrl = `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`;
      router.replace(loginUrl);
    }
  }, [user, userLoading, locale, router]);

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-primary">Loading...</div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated
  // (redirect will happen via useEffect)
  if (!user) {
    return null;
  }

  return (
    <ChatProvider>
      <SidebarProvider>
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
      </SidebarProvider>
    </ChatProvider>
  );
}

