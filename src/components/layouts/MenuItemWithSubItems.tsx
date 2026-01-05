'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { SubMenuItem } from './SubMenuItem';

interface MenuItemWithSubItemsProps {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  subItems: Array<{
    label: string;
    href?: string;
    icon?: React.ReactNode;
    badge?: string | number;
  }>;
  isActive: boolean;
  hasActiveSubItem: boolean;
  isExpanded: boolean;
  isCollapsed: boolean;
  defaultIcon: React.ReactNode;
  onToggle: () => void;
  isSubItemActive: (href?: string) => boolean;
  onSubItemClick?: () => void;
}

export function MenuItemWithSubItems({
  label,
  icon,
  badge,
  subItems,
  isActive,
  hasActiveSubItem,
  isExpanded,
  isCollapsed,
  defaultIcon,
  onToggle,
  isSubItemActive,
  onSubItemClick,
}: MenuItemWithSubItemsProps) {
  return (
    <>
      <button
        onClick={() => {
          if (!isCollapsed) {
            onToggle();
          }
        }}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
          'hover:bg-bg-tertiary',
          (isActive || hasActiveSubItem)
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:text-text-primary',
          isCollapsed && 'justify-center'
        )}
      >
        <span className="flex-shrink-0">{icon || defaultIcon}</span>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {badge && (
              <Badge variant="primary" size="sm">
                {badge}
              </Badge>
            )}
            <svg
              className={cn(
                'w-4 h-4 transition-transform',
                isExpanded && 'rotate-90'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </>
        )}
      </button>
      {!isCollapsed && isExpanded && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
          {subItems.map((subItem, subItemIndex) => (
            <li key={subItemIndex}>
              <SubMenuItem
                label={subItem.label}
                href={subItem.href}
                icon={subItem.icon}
                badge={subItem.badge}
                isActive={isSubItemActive(subItem.href)}
                defaultIcon={defaultIcon}
                onClick={onSubItemClick}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}


