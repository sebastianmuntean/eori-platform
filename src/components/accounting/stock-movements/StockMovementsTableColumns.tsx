'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { StockMovement } from '@/hooks/useStockMovements';
import { TableActionsIcon } from '@/components/accounting/shared/TableActionsIcon';

// Stock movement type variant map
const STOCK_MOVEMENT_TYPE_VARIANTS: Record<string, 'success' | 'danger' | 'info' | 'warning' | 'secondary'> = {
  in: 'success',
  out: 'danger',
  transfer: 'info',
  adjustment: 'warning',
  return: 'secondary',
};

interface StockMovementsTableColumnsProps {
  t: (key: string) => string;
  onEdit: (stockMovement: StockMovement) => void;
  onDelete: (stockMovementId: string) => void;
  getWarehouseName: (id: string) => string;
  getProductName: (id: string) => string;
}

/**
 * Generates stock movements table columns
 * Extracted from page component for better separation of concerns
 */
export function getStockMovementsTableColumns({
  t,
  onEdit,
  onDelete,
  getWarehouseName,
  getProductName,
}: StockMovementsTableColumnsProps): Column<StockMovement>[] {
  return [
    {
      key: 'type' as keyof StockMovement,
      label: t('type') || 'Type',
      sortable: false,
      render: (value: string) => (
        <Badge variant={STOCK_MOVEMENT_TYPE_VARIANTS[value] || 'secondary'} size="sm">
          {value.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'warehouseId' as keyof StockMovement,
      label: t('warehouse') || 'Warehouse',
      sortable: false,
      render: (value: string) => getWarehouseName(value),
    },
    {
      key: 'productId' as keyof StockMovement,
      label: t('product') || 'Product',
      sortable: false,
      render: (value: string) => getProductName(value),
    },
    { key: 'movementDate' as keyof StockMovement, label: t('date') || 'Date', sortable: true },
    {
      key: 'quantity' as keyof StockMovement,
      label: t('quantity') || 'Quantity',
      sortable: true,
      render: (value: string) => parseFloat(value).toFixed(3),
    },
    {
      key: 'totalValue' as keyof StockMovement,
      label: t('value') || 'Value',
      sortable: true,
      render: (value: string | null) => value ? parseFloat(value).toFixed(2) : '-',
    },
    {
      key: 'id' as keyof StockMovement,
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: StockMovement) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <TableActionsIcon />
            </Button>
          }
          items={[
            { label: t('edit') || 'Edit', onClick: () => onEdit(row) },
            { label: t('delete') || 'Delete', onClick: () => onDelete(row.id), variant: 'danger' as const },
          ]}
          align="right"
        />
      ),
    },
  ];
}

