'use client';

import { cn } from '@/lib/utils';
import { MenuItem } from './MenuItem';
import { MenuItemWithSubItems } from './MenuItemWithSubItems';

interface MenuItemType {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  subItems?: MenuItemType[];
}

interface MenuGroupProps {
  label: string;
  items: MenuItemType[];
  isCollapsed: boolean;
  isExpanded: boolean;
  expandedSubItems: Set<string>;
  defaultIcon: React.ReactNode;
  isItemActive: (href?: string) => boolean;
  onToggleGroup: () => void;
  onToggleSubItem: (label: string) => void;
  onItemClick?: () => void;
}

export function MenuGroup({
  label,
  items,
  isCollapsed,
  isExpanded,
  expandedSubItems,
  defaultIcon,
  isItemActive,
  onToggleGroup,
  onToggleSubItem,
  onItemClick,
}: MenuGroupProps) {
  return (
    <div className="mb-6">
      {!isCollapsed && (
        <button
          onClick={onToggleGroup}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
        >
          <span>{label}</span>
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
        </button>
      )}
      {(isCollapsed || isExpanded) && (
        <ul className={cn('space-y-1', isCollapsed && 'mt-2')}>
          {items.map((item, itemIndex) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSubItemExpanded = expandedSubItems.has(item.label);
            const active = isItemActive(item.href);
            const hasActiveSubItem =
              hasSubItems && item.subItems?.some((subItem) => isItemActive(subItem.href));

            return (
              <li key={itemIndex}>
                {hasSubItems ? (
                  <MenuItemWithSubItems
                    label={item.label}
                    href={item.href}
                    icon={item.icon}
                    badge={item.badge}
                    subItems={item.subItems}
                    isActive={active}
                    hasActiveSubItem={hasActiveSubItem}
                    isExpanded={isSubItemExpanded}
                    isCollapsed={isCollapsed}
                    defaultIcon={defaultIcon}
                    onToggle={() => onToggleSubItem(item.label)}
                    isSubItemActive={isItemActive}
                    onSubItemClick={onItemClick}
                  />
                ) : (
                  <MenuItem
                    label={item.label}
                    href={item.href}
                    icon={item.icon}
                    badge={item.badge}
                    isActive={active}
                    isCollapsed={isCollapsed}
                    defaultIcon={defaultIcon}
                    onClick={onItemClick}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


