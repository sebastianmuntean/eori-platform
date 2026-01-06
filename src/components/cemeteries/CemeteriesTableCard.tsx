'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import { Cemetery } from '@/hooks/useCemeteries';
import { useTranslations } from 'next-intl';

interface CemeteriesTableCardProps {
  data: Cemetery[];
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
 * Card component for displaying cemeteries table
 * Includes table, pagination, and error handling
 */
export function CemeteriesTableCard({
  data,
  columns,
  loading,
  error,
  pagination,
  currentPage,
  onPageChange,
  emptyMessage,
}: CemeteriesTableCardProps) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardBody>
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger rounded text-danger text-sm">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 text-text-secondary">{t('loading') || 'Loading...'}</div>
        ) : (
          <>
            <Table
              columns={columns}
              data={data}
              emptyMessage={emptyMessage}
            />
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
      </CardBody>
    </Card>
  );
}

