'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { Dropdown } from './Dropdown';
import { useState } from 'react';

export function LanguageSwitcher() {
  console.log('Step 1: Rendering LanguageSwitcher component');

  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = (params.locale as Locale) || 'ro';

  const handleLocaleChange = (newLocale: Locale) => {
    console.log(`Step 2: Changing locale from ${currentLocale} to ${newLocale}`);
    
    // Replace locale in pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
    console.log(`✓ Locale changed to ${newLocale}`);
  };

  const languageItems = locales.map((locale) => ({
    label: localeNames[locale],
    onClick: () => handleLocaleChange(locale),
    active: locale === currentLocale,
  }));

  console.log('✓ Rendering language switcher');
  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-bg-secondary transition-colors text-text-primary">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
          <span className="hidden sm:block text-sm font-medium">
            {localeNames[currentLocale]}
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
      items={languageItems}
      align="right"
    />
  );
}

