'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface MenuItemProps {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  isActive: boolean;
  isCollapsed: boolean;
  defaultIcon: React.ReactNode;
  onClick?: () => void;
}

export function MenuItem({
  label,
  href = '#',
  icon,
  badge,
  isActive,
  isCollapsed,
  defaultIcon,
  onClick,
}: MenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
        'hover:bg-bg-tertiary',
        isActive
          ? 'bg-primary text-white'
          : 'text-text-secondary hover:text-text-primary',
        isCollapsed && 'justify-center'
      )}
    >
      <span className="flex-shrink-0">{icon || defaultIcon}</span>
      {!isCollapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && (
            <Badge variant="primary" size="sm">
              {badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}






