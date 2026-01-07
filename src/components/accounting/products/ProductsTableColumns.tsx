'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Product } from '@/hooks/useProducts';

interface UseProductsTableColumnsProps {
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

/**
 * Hook to generate products table columns
 * Extracted from page component for better separation of concerns
 */
export function useProductsTableColumns({
  onEdit,
  onDelete,
}: UseProductsTableColumnsProps) {
  const t = useTranslations('common');

  const columns: Column<Product>[] = useMemo(
    () => [
      { key: 'code' as keyof Product, label: t('code') || 'Code', sortable: true },
      { key: 'name' as keyof Product, label: t('name') || 'Name', sortable: true },
      { key: 'category' as keyof Product, label: t('category') || 'Category', sortable: true },
      { key: 'unit' as keyof Product, label: t('unit') || 'Unit', sortable: false },
      {
        key: 'trackStock' as keyof Product,
        label: t('trackStock') || 'Track Stock',
        sortable: false,
        render: (value: boolean) => (
          <Badge variant={value ? 'info' : 'secondary'} size="sm">
            {value ? t('yes') || 'Yes' : t('no') || 'No'}
          </Badge>
        ),
      },
      {
        key: 'isActive' as keyof Product,
        label: t('status') || 'Status',
        sortable: false,
        render: (value: boolean) => (
          <Badge variant={value ? 'success' : 'secondary'} size="sm">
            {value ? t('active') || 'Active' : t('inactive') || 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'id' as keyof Product,
        label: t('actions') || 'Actions',
        sortable: false,
        render: (_value: unknown, row: Product) => (
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </Button>
            }
            items={[
              { label: t('edit') || 'Edit', onClick: () => onEdit(row) },
              { label: t('delete') || 'Delete', onClick: () => onDelete(row.id), variant: 'danger' },
            ]}
            align="right"
          />
        ),
      },
    ],
    [t, onEdit, onDelete]
  );

  return columns;
}

