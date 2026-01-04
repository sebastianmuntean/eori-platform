'use client';

import { useSidebar } from '@/hooks/useSidebar';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
}


const defaultIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

export function Sidebar() {
  console.log('Step 1: Rendering Sidebar component');
  
  const { isCollapsed, isMobileOpen, closeMobile, toggleCollapse } = useSidebar();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('menu');

  // Build menu groups with translations
  const translatedMenuGroups: MenuGroup[] = [
    {
      label: t('management'),
      items: [
        { label: t('dashboard'), href: `/${locale}/dashboard` },
        { label: t('entities'), href: `/${locale}/dashboard/modules/entities` },
        { label: t('reports'), href: `/${locale}/dashboard/modules/reports` },
      ],
    },
    {
      label: t('administration'),
      items: [
        { label: t('users'), href: `/${locale}/dashboard/modules/users` },
        {
          label: t('emailTemplates'),
          href: `/${locale}/dashboard/modules/email-templates`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
        },
        { label: t('settings'), href: `/${locale}/dashboard/modules/settings` },
      ],
    },
    {
      label: t('superadmin'),
      items: [
        {
          label: t('overview'),
          href: `/${locale}/dashboard/superadmin`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          label: t('roles'),
          href: `/${locale}/dashboard/superadmin/roles`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          label: t('permissions'),
          href: `/${locale}/dashboard/superadmin/permissions`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
        },
        {
          label: t('userRoles'),
          href: `/${locale}/dashboard/superadmin/user-roles`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          label: t('rolePermissions'),
          href: `/${locale}/dashboard/superadmin/role-permissions`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
      ],
    },
  ];

  // Expand all groups by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(translatedMenuGroups.map((g) => g.label))
  );

  const toggleGroup = (groupLabel: string) => {
    console.log('Step 2: Toggling menu group:', groupLabel);
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
        console.log('✓ Group collapsed');
      } else {
        newSet.add(groupLabel);
        console.log('✓ Group expanded');
      }
      return newSet;
    });
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  console.log('✓ Rendering sidebar');
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
          'lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          'flex items-center border-b border-border',
          isCollapsed ? 'justify-center p-4' : 'justify-between p-4'
        )}>
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-text-primary">{t('menu')}</h2>
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
            onClick={() => {
              console.log('Step 3: Toggling sidebar collapse');
              toggleCollapse();
            }}
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {translatedMenuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              {!isCollapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors"
                >
                  <span>{group.label}</span>
                  <svg
                    className={cn(
                      'w-4 h-4 transition-transform',
                      expandedGroups.has(group.label) && 'rotate-90'
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
              <ul className={cn('space-y-1', isCollapsed && 'mt-2')}>
                {group.items.map((item, itemIndex) => {
                  const active = isActive(item.href);
                  return (
                    <li key={itemIndex}>
                      <Link
                        href={item.href}
                        onClick={closeMobile}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                          'hover:bg-bg-tertiary',
                          active
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-text-primary',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        <span className="flex-shrink-0">
                          {item.icon || defaultIcon}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <Badge variant="primary" size="sm">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

