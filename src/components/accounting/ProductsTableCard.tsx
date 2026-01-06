'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { ProductTablePagination } from '@/components/accounting/products/ProductTablePagination';
import { Product } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';

interface ProductsTableCardProps {
  data: Product[];
  columns: Column<Product>[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  emptyMessage: string;
}

/**
 * Card component for displaying products table
 * Includes table, pagination, and error handling
 */
export function ProductsTableCard({
  data,
  columns,
  loading,
  error,
  pagination,
  currentPage,
  onPageChange,
  emptyMessage,
}: ProductsTableCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined">
      <CardBody>
        {error && (
          <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
        ) : (
          <>
            <Table data={data} columns={columns} emptyMessage={emptyMessage} />
            <ProductTablePagination
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={onPageChange}
              t={t}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}

