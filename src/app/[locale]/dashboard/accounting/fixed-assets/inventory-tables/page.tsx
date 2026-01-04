'use client';

import { ReportPageWithCRUD } from '@/components/fixed-assets/ReportPageWithCRUD';
import { useParams } from 'next/navigation';

export default function InventoryTablesPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <ReportPageWithCRUD
      title="Tabele de inventar"
      titleKey="inventoryTables"
      href={`/${locale}/dashboard/accounting/fixed-assets/inventory-tables`}
    />
  );
}
