'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  console.log('Step 1: Rendering DashboardLayout');
  
  const { isCollapsed } = useSidebar();

  console.log('✓ Rendering dashboard layout');
  return (
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
    </div>
  );
}

