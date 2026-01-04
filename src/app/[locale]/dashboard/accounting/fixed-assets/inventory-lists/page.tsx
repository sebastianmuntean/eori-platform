'use client';

import { ReportPageWithCRUD } from '@/components/fixed-assets/ReportPageWithCRUD';
import { useParams } from 'next/navigation';

export default function InventoryListsPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <ReportPageWithCRUD
      title="Liste de inventar"
      titleKey="inventoryLists"
      href={`/${locale}/dashboard/accounting/fixed-assets/inventory-lists`}
    />
  );
}
