'use client';

import { ReportPageWithCRUD } from '@/components/fixed-assets/ReportPageWithCRUD';
import { useParams } from 'next/navigation';

export default function ExitsFromManagementPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <ReportPageWithCRUD
      title="Ieșiri din gestiune"
      titleKey="exitsFromManagement"
      href={`/${locale}/dashboard/accounting/fixed-assets/exits`}
      filterParams={{ status: 'disposed' }}
    />
  );
}
