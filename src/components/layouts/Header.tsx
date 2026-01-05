'use client';

import { useSidebar } from '@/hooks/useSidebar';
import { useUser } from '@/hooks/useUser';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { NotificationModal } from '@/components/notifications/NotificationModal';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Constants
const NOTIFICATION_POLL_INTERVAL = 30000; // 30 seconds
const NOTIFICATION_REFRESH_DELAY = 500; // Delay after modal close to allow API to update
const MAX_BADGE_COUNT = 99; // Maximum count to display before showing "99+"

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
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingIntervalRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  // Refresh user data after login/logout
  useEffect(() => {
    console.log('Step 2: User data changed, current user:', user?.name || 'none');
  }, [user]);

  /**
   * Fetches the unread notification count from the API
   * Validates response status before parsing to prevent errors
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      
      // Validate response status before parsing
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setUnreadCount(result.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Don't update state on error to avoid showing incorrect count
    }
  }, []);

  /**
   * Sets up polling for unread notification count
   * Fetches immediately on mount and then every 30 seconds
   * Cleans up interval and resets count when user logs out
   */
  useEffect(() => {
    if (user) {
      // Fetch immediately on mount
      fetchUnreadCount();

      // Set up polling every 30 seconds
      pollingIntervalRef.current = window.setInterval(() => {
        fetchUnreadCount();
      }, NOTIFICATION_POLL_INTERVAL);

      // Cleanup interval on unmount or when user changes
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } else {
      // Reset count when user logs out
      setUnreadCount(0);
    }
  }, [user, fetchUnreadCount]);

  /**
   * Cleanup refresh timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Handles notification modal close
   * Refreshes count after a delay to allow API to update
   * Cleans up any pending timeout to prevent memory leaks
   */
  const handleNotificationModalClose = useCallback(() => {
    setIsNotificationModalOpen(false);

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Refresh count after a short delay to allow API to update
    refreshTimeoutRef.current = window.setTimeout(() => {
      fetchUnreadCount();
      refreshTimeoutRef.current = null;
    }, NOTIFICATION_REFRESH_DELAY);
  }, [fetchUnreadCount]);

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

  const handleQuickPayment = () => {
    router.push(`/${locale}/dashboard/accounting/payments?quick=true`);
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
            <div className="w-64 h-14 relative flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo"
                width={256}
                height={56}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <Input
              id="header-search-input"
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
          {/* Quick Payment */}
          <button
            onClick={handleQuickPayment}
            className="p-2 rounded-md hover:bg-bg-secondary transition-colors relative"
            aria-label={t('quickPayment') || 'Incasare rapida'}
            title={t('quickPayment') || 'Incasare rapida'}
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Chat */}
          <ChatButton />

          {/* Notifications */}
          <button
            onClick={() => setIsNotificationModalOpen(true)}
            className="relative p-2 rounded-md hover:bg-bg-secondary transition-colors"
            aria-label={t('notifications') || 'Notifications'}
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
            {unreadCount > 0 && (
              <Badge
                variant="danger"
                size="sm"
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0"
              >
                {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
              </Badge>
            )}
          </button>

          {/* Notification Modal */}
          <NotificationModal
            isOpen={isNotificationModalOpen}
            onClose={handleNotificationModalClose}
          />

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

