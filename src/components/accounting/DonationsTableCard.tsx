'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import { Donation } from '@/hooks/useDonations';
import { useTranslations } from 'next-intl';

interface DonationsTableCardProps {
  data: Donation[];
  columns: Column<Donation>[];
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
 * Card component for displaying donations table
 * Includes table, pagination, and error handling
 */
export function DonationsTableCard({
  data,
  columns,
  loading,
  error,
  pagination,
  currentPage,
  onPageChange,
  emptyMessage,
}: DonationsTableCardProps) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardBody>
        {error && (
          <div className="mb-4 p-4 bg-danger/10 text-danger rounded-md">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 text-text-secondary">{t('loading')}</div>
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
      </CardBody>
    </Card>
  );
}
