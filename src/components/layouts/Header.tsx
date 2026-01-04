'use client';

import { useSidebar } from '@/hooks/useSidebar';
import { useUser } from '@/hooks/useUser';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

function ChatButton() {
  const { toggleChat, isOpen } = useChatContext();

  return (
    <button
      onClick={toggleChat}
      className={cn(
        'relative p-2 rounded-md hover:bg-bg-secondary transition-colors',
        isOpen && 'bg-bg-secondary'
      )}
      aria-label="Chat"
    >
      <svg
        className="w-6 h-6 text-text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </button>
  );
}

export function Header() {
  const { toggleMobile } = useSidebar();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Refresh user data after login/logout
  useEffect(() => {
    console.log('Step 2: User data changed, current user:', user?.name || 'none');
  }, [user]);

  const handleLogout = async () => {
    console.log('Step 2: Logout button clicked');
    setIsLoggingOut(true);

    try {
      console.log('Step 3: Sending logout request to API');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Step 4: Logout response received:', data);

      if (data.success) {
        console.log('✓ Logout successful, redirecting to login page');
        // Redirect to login page with current locale
        router.push(`/${locale}/login`);
        router.refresh();
      } else {
        console.log('❌ Logout failed:', data.error);
        // Even if logout fails on server, redirect to login (client-side logout)
        router.push(`/${locale}/login`);
        router.refresh();
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if there's an error, redirect to login page
      router.push(`/${locale}/login`);
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userMenuItems = [
    {
      label: tAuth('profile'),
      onClick: () => {
        console.log('Step 5: Profile menu item clicked');
        // Navigate to profile
      },
    },
    {
      label: t('settings'),
      onClick: () => {
        console.log('Step 6: Settings menu item clicked');
        // Navigate to settings
      },
    },
    {
      label: `${tAuth('logout')}${isLoggingOut ? '...' : ''}`,
      onClick: handleLogout,
      variant: 'danger' as const,
      disabled: isLoggingOut,
    },
  ];

  return (
    <header className="bg-bg-primary border-b border-border shadow-sm h-header">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left Section: Menu Toggle & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-md hover:bg-bg-secondary transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-semibold text-text-primary hidden sm:block">
              {t('appName')}
            </span>
          </div>
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <Input
              placeholder={t('searchPlaceholder')}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('Step 7: Search triggered');
                  // Handle search
                }
              }}
            />
          </div>
        </div>

        {/* Right Section: Theme Switcher, Language Switcher, Notifications & User Menu */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Chat */}
          <ChatButton />

          {/* Notifications */}
          <button
            className="relative p-2 rounded-md hover:bg-bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <svg
              className="w-6 h-6 text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <Badge
              variant="danger"
              size="sm"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0"
            >
              3
            </Badge>
          </button>

          {/* User Menu */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 p-2 rounded-md hover:bg-bg-secondary transition-colors">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm text-text-primary">
                  {userLoading ? '...' : (user?.name || t('userDefault'))}
                </span>
                <svg
                  className="w-4 h-4 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            }
            items={userMenuItems}
            align="right"
          />
        </div>
      </div>
    </header>
  );
}

