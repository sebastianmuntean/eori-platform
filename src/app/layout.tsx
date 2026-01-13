import './globals.css';
import { defaultLocale } from '@/i18n/config';
import { ErrorBoundary } from '@/lib/monitoring/error-boundary';
import { ConsoleFilter } from '@/components/ConsoleFilter';

export const metadata = {
  title: 'EORI Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body>
        <ConsoleFilter />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}


