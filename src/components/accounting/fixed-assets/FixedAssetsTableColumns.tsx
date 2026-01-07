'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { FixedAsset } from '@/hooks/useFixedAssets';
import { getStatusBadgeVariant } from '@/lib/fixed-assets/helpers';
import { TableActionsIcon } from '@/components/accounting/shared/TableActionsIcon';

interface FixedAssetsTableColumnsProps {
  t: (key: string) => string;
  onEdit: (asset: FixedAsset) => void;
  onDelete: (assetId: string) => void;
}

/**
 * Generates fixed assets table columns
 * Extracted from page component for better separation of concerns
 */
export function getFixedAssetsTableColumns({
  t,
  onEdit,
  onDelete,
}: FixedAssetsTableColumnsProps): Column<FixedAsset>[] {
  return [
    { key: 'inventoryNumber' as keyof FixedAsset, label: t('inventoryNumber') || 'Număr Inventar', sortable: true },
    { key: 'name' as keyof FixedAsset, label: t('name') || 'Name', sortable: true },
    {
      key: 'category' as keyof FixedAsset,
      label: t('category') || 'Category',
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
      key: 'status' as keyof FixedAsset,
      label: t('status') || 'Status',
      sortable: false,
      render: (value: string) => (
        <Badge variant={getStatusBadgeVariant(value)} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof FixedAsset,
      label: t('actions') || 'Actions',
      sortable: false,
      render: (_: any, row: FixedAsset) => (
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

