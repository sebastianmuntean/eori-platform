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
      registratura: (await import(`../locales/${locale}/registratura.json`)).default,
      hr: (await import(`../locales/${locale}/hr.json`)).default,
      catechesis: (await import(`../locales/${locale}/catechesis.json`)).default,
      pilgrimages: (await import(`../locales/${locale}/pilgrimages.json`)).default,
    },
  };
});
