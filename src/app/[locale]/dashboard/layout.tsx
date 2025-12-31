import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  console.log('Step 1: Rendering dashboard layout wrapper');
  return <DashboardLayout>{children}</DashboardLayout>;
}

