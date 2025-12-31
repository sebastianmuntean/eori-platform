export const locales = ['ro', 'en', 'it'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ro';

export const localeNames: Record<Locale, string> = {
  ro: 'Română',
  en: 'English',
  it: 'Italiano',
};

// Routing configuration for next-intl
export const routing = {
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix: 'always' as const,
};
