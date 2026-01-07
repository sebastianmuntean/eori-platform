'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Client } from '@/hooks/useClients';
import { getClientDisplayName, getClientType } from '@/lib/utils/clients';

import { TableActionsIcon } from '@/components/accounting/shared/TableActionsIcon';

interface SuppliersTableColumnsProps {
  t: (key: string) => string;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

/**
 * Generates suppliers table columns
 * Extracted from page component for better separation of concerns
 */
export function getSuppliersTableColumns({
  t,
  onEdit,
  onDelete,
}: SuppliersTableColumnsProps): Column<Client>[] {
  return [
    { key: 'code' as keyof Client, label: t('code'), sortable: true },
    {
      key: 'name' as keyof Client,
      label: t('name'),
      sortable: true,
      render: (_: any, row: Client) => getClientDisplayName(row),
    },
    {
      key: 'type' as keyof Client,
      label: t('type'),
      sortable: false,
      render: (_: any, row: Client) => (
        <Badge variant="secondary" size="sm">
          {getClientType(row)}
        </Badge>
      ),
    },
    { key: 'city' as keyof Client, label: t('city'), sortable: true },
    { key: 'phone' as keyof Client, label: t('phone'), sortable: true },
    {
      key: 'isActive' as keyof Client,
      label: t('status'),
      sortable: false,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof Client,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Client) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <TableActionsIcon />
            </Button>
          }
          items={[
            { label: t('edit'), onClick: () => onEdit(row) },
            { label: t('delete'), onClick: () => onDelete(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];
}

