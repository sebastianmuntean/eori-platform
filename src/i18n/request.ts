import { getRequestConfig } from 'next-intl/server';
import { routing } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: {
      common: (await import(`../locales/${locale}/common.json`)).default,
      menu: (await import(`../locales/${locale}/menu.json`)).default,
      auth: (await import(`../locales/${locale}/auth.json`)).default,
      'online-forms': (await import(`../locales/${locale}/online-forms.json`)).default,
      registry: (await import(`../locales/${locale}/registry.json`)).default,
      hr: (await import(`../locales/${locale}/hr.json`)).default,
      catechesis: (await import(`../locales/${locale}/catechesis.json`)).default,
      pilgrimages: (await import(`../locales/${locale}/pilgrimages.json`)).default,
      profile: (await import(`../locales/${locale}/profile.json`)).default,
      accounting: (await import(`../locales/${locale}/accounting.json`)).default,
      events: (await import(`../locales/${locale}/events.json`)).default,
      parishioners: (await import(`../locales/${locale}/parishioners.json`)).default,
      cemeteries: (await import(`../locales/${locale}/cemeteries.json`)).default,
      administration: (await import(`../locales/${locale}/administration.json`)).default,
    },
  };
});
