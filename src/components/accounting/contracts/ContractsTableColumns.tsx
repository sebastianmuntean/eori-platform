'use client';

import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Contract } from '@/hooks/useContracts';
import { formatCurrency } from '@/lib/utils/accounting';
import { TableActionsIcon } from '@/components/accounting/shared/TableActionsIcon';

// Contract status variant map
const CONTRACT_STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'danger' | 'secondary' | 'info'> = {
  draft: 'secondary',
  active: 'success',
  expired: 'warning',
  terminated: 'danger',
  renewed: 'info',
};

interface ContractsTableColumnsProps {
  t: (key: string) => string;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  onGenerateInvoice: (contract: Contract) => void;
  onViewInvoices: (contract: Contract) => void;
  onRenew: (contract: Contract) => void;
  getClientName: (clientId: string | null) => string;
}

/**
 * Generates contracts table columns
 * Extracted from page component for better separation of concerns
 */
export function getContractsTableColumns({
  t,
  onEdit,
  onDelete,
  onGenerateInvoice,
  onViewInvoices,
  onRenew,
  getClientName,
}: ContractsTableColumnsProps): Column<Contract>[] {
  return [
    {
      key: 'direction' as keyof Contract,
      label: 'IE',
      sortable: false,
      render: (_: any, row: Contract) => (
        <div className={`w-3 h-3 rounded-full ${row.direction === 'incoming' ? 'bg-success' : 'bg-info'}`} title={row.direction === 'incoming' ? t('incoming') : t('outgoing')} />
      ),
    },
    {
      key: 'type' as keyof Contract,
      label: t('type'),
      sortable: false,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {t(value) || value}
        </Badge>
      ),
    },
    {
      key: 'clientId' as keyof Contract,
      label: t('clients'),
      sortable: false,
      render: (value: string) => getClientName(value),
    },
    { key: 'startDate' as keyof Contract, label: t('startDate'), sortable: true },
    { key: 'endDate' as keyof Contract, label: t('endDate'), sortable: true },
    {
      key: 'amount' as keyof Contract,
      label: t('amount'),
      sortable: true,
      render: (value: string, row: Contract) => formatCurrency(value, row.currency),
    },
    {
      key: 'status' as keyof Contract,
      label: t('status'),
      sortable: false,
      render: (value: string) => (
        <Badge variant={CONTRACT_STATUS_VARIANTS[value] || 'secondary'} size="sm">
          {t(value)}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof Contract,
      label: t('actions'),
      sortable: false,
      render: (_: any, row: Contract) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <TableActionsIcon />
            </Button>
          }
          items={[
            ...(row.status === 'active' ? [{ label: t('generateInvoice'), onClick: () => onGenerateInvoice(row) }] : []),
            { label: t('viewInvoices'), onClick: () => onViewInvoices(row) },
            { label: t('renew'), onClick: () => onRenew(row) },
            { label: t('edit'), onClick: () => onEdit(row) },
            { label: t('delete'), onClick: () => onDelete(row.id), variant: 'danger' },
          ]}
          align="right"
        />
      ),
    },
  ];
}

