'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { defaultIcon } from '@/lib/utils/menu-icons';
import { buildNavigation } from '@/config/navigation';
import { SidebarHeader } from './SidebarHeader';
import { MenuGroup } from './MenuGroup';

export function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobile, toggleCollapse } = useSidebar();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('menu');

  const translatedMenuGroups = useMemo(
    () => buildNavigation({ locale, t: (key) => t(key) }),
    [locale, t],
  );

  // Helper function to check if a URL is active
  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Start with all groups collapsed
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Track expanded sub-items
  const [expandedSubItems, setExpandedSubItems] = useState<Set<string>>(new Set());

  // Auto-expand only the group containing the active page
  useEffect(() => {
    const groupsToExpand = new Set<string>();
    const subItemsToExpand = new Set<string>();

    translatedMenuGroups.forEach((group) => {
      let hasActiveItemInGroup = false;

      group.items.forEach((item) => {
        // Check if the item itself is active
        if (item.href && isActive(item.href)) {
          hasActiveItemInGroup = true;
        }

        // Check if any sub-item is active
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some(
            (subItem) => subItem.href && isActive(subItem.href),
          );

          if (hasActiveSubItem) {
            hasActiveItemInGroup = true;
            subItemsToExpand.add(item.label);
          }
        }
      });

      // Only expand the group if it contains an active item
      if (hasActiveItemInGroup) {
        groupsToExpand.add(group.label);
      }
    });

    // Update expanded groups to only include groups with active items
    setExpandedGroups(groupsToExpand);

    // Update expanded sub-items
    setExpandedSubItems(subItemsToExpand);
  }, [pathname, translatedMenuGroups]);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
      } else {
        newSet.add(groupLabel);
      }
      return newSet;
    });
  };

  const toggleSubItem = (itemLabel: string) => {
    setExpandedSubItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemLabel)) {
        newSet.delete(itemLabel);
      } else {
        newSet.add(itemLabel);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50',
          'bg-bg-secondary border-r border-border',
          'flex flex-col flex-shrink-0',
          'transition-all duration-300',
          isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'lg:translate-x-0',
        )}
      >
        <SidebarHeader
          isCollapsed={isCollapsed}
          menuLabel={t('menu')}
          onToggleCollapse={toggleCollapse}
        />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {translatedMenuGroups.map((group, groupIndex) => (
            <MenuGroup
              key={groupIndex}
              label={group.label}
              items={group.items}
              isCollapsed={isCollapsed}
              isExpanded={expandedGroups.has(group.label)}
              expandedSubItems={expandedSubItems}
              defaultIcon={defaultIcon}
              isItemActive={isActive}
              onToggleGroup={() => toggleGroup(group.label)}
              onToggleSubItem={toggleSubItem}
              onItemClick={closeMobile}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
