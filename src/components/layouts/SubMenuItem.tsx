'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface SubMenuItemProps {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  isActive: boolean;
  defaultIcon: React.ReactNode;
  onClick?: () => void;
}

export function SubMenuItem({
  label,
  href = '#',
  icon,
  badge,
  isActive,
  defaultIcon,
  onClick,
}: SubMenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
        'hover:bg-bg-tertiary',
        isActive
          ? 'bg-primary text-white'
          : 'text-text-secondary hover:text-text-primary'
      )}
    >
      <span className="flex-shrink-0">{icon || defaultIcon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <Badge variant="primary" size="sm">
          {badge}
        </Badge>
      )}
    </Link>
  );
}


