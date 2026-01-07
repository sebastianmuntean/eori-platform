'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Warehouse } from '@/hooks/useWarehouses';

import { TableActionsIcon } from '@/components/accounting/shared/TableActionsIcon';

interface WarehousesTableColumnsProps {
  t: (key: string) => string;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouseId: string) => void;
}

/**
 * Generates warehouses table columns
 * Extracted from page component for better separation of concerns
 */
export function getWarehousesTableColumns({
  t,
  onEdit,
  onDelete,
}: WarehousesTableColumnsProps): Column<Warehouse>[] {
  return [
    { key: 'code' as keyof Warehouse, label: t('code') || 'Code', sortable: true },
    { key: 'name' as keyof Warehouse, label: t('name') || 'Name', sortable: true },
    {
      key: 'type' as keyof Warehouse,
      label: t('type') || 'Type',
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'invoiceSeries' as keyof Warehouse,
      label: t('invoiceSeries') || 'Serie Factură',
      sortable: false,
      render: (value: string | null) => (
        value ? (
          <Badge variant="secondary" size="sm">
            {value}
          </Badge>
        ) : (
          <span className="text-text-muted text-sm">-</span>
        )
      ),
    },
    {
      key: 'isActive' as keyof Warehouse,
      label: t('status') || 'Status',
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') || 'Active' : t('inactive') || 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof Warehouse,
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: Warehouse) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <TableActionsIcon />
            </Button>
          }
          items={[
            { label: t('edit') || 'Edit', onClick: () => onEdit(row) },
            { label: t('delete') || 'Delete', onClick: () => onDelete(row.id), variant: 'danger' },
          ]}
        />
      ),
    },
  ];
}

