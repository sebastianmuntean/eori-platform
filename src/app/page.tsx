import { redirect } from 'next/navigation';

export default function RootPage() {
  console.log('Step 1: Root page accessed, redirecting to /en/dashboard');
  redirect('/en/dashboard');
}

