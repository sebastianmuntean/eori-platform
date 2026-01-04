import { redirect } from 'next/navigation';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  console.log(`Step 1: Home page accessed for locale ${locale}, redirecting to /${locale}/dashboard`);
  redirect(`/${locale}/dashboard`);
}
