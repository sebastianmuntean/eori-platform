import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { locales, defaultLocale } from '@/i18n/config';
import { LocaleSetter } from '@/components/LocaleSetter';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  console.log('Step 1: LocaleLayout rendering for locale:', locale);
  
  // Validate locale - redirect to dashboard if invalid
  if (!locales.includes(locale as (typeof locales)[number])) {
    console.log('❌ Invalid locale, redirecting to dashboard:', locale);
    const dashboardPath = `/${defaultLocale}/dashboard`;
    console.log('Step 2: Redirecting to dashboard:', dashboardPath);
    redirect(dashboardPath);
  }

  // Get messages for the locale
  const messages = await getMessages({ locale });
  console.log('✓ Messages loaded for locale:', locale);

  return (
    <>
      <LocaleSetter locale={locale} />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </>
  );
}
