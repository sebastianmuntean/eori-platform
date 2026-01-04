'use client';

import { ReportPageWithCRUD } from '@/components/fixed-assets/ReportPageWithCRUD';
import { useParams } from 'next/navigation';

export default function InventoryNumbersRegisterPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <ReportPageWithCRUD
      title="Registrul numerelor de inventar"
      titleKey="inventoryNumbersRegister"
      href={`/${locale}/dashboard/accounting/fixed-assets/inventory-numbers`}
    />
  );
}
