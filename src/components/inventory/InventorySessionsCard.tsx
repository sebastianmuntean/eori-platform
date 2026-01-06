'use client';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import { InventorySession } from '@/hooks/useInventory';
import { useTranslations } from 'next-intl';

interface InventorySessionsCardProps {
  title: string;
  data: InventorySession[];
  columns: any[];
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
 * Card component for displaying inventory sessions
 * Includes table, pagination, and error handling
 */
export function InventorySessionsCard({
  title,
  data,
  columns,
  loading,
  error,
  pagination,
  currentPage,
  onPageChange,
  emptyMessage,
}: InventorySessionsCardProps) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">{title}</h2>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-danger/10 text-danger rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
          ) : (
            <>
              <Table data={data} columns={columns} emptyMessage={emptyMessage} />
              {pagination && pagination.totalPages > 1 && (
                <TablePagination
                  pagination={pagination}
                  currentPage={currentPage}
                  onPageChange={onPageChange}
                  loading={loading}
                  t={t}
                />
              )}
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

