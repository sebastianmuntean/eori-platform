'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  menuLabel: string;
  onToggleCollapse: () => void;
}

export function SidebarHeader({
  isCollapsed,
  menuLabel,
  onToggleCollapse,
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center border-b border-border',
        isCollapsed ? 'justify-center p-4' : 'justify-between p-4'
      )}
    >
      {!isCollapsed && (
        <h2 className="text-lg font-semibold text-text-primary">{menuLabel}</h2>
      )}
      {isCollapsed && (
        <div className="w-8 h-8 relative flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
        </div>
      )}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:block p-1 rounded hover:bg-bg-tertiary transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={cn(
            'w-5 h-5 text-text-secondary transition-transform',
            isCollapsed && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>
    </div>
  );
}






