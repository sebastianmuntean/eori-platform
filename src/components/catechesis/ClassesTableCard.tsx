'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import { CatechesisClass } from '@/hooks/useCatechesisClasses';
import { useTranslations } from 'next-intl';

interface ClassesTableCardProps {
  data: CatechesisClass[];
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
 * Card component for displaying catechesis classes table
 * Includes table, pagination, and error handling
 */
export function ClassesTableCard({
  data,
  columns,
  loading,
  error,
  pagination,
  currentPage,
  onPageChange,
  emptyMessage,
}: ClassesTableCardProps) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardBody>
        {loading && !data.length ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-secondary">{t('loading')}</div>
          </div>
        ) : error ? (
          <div className="p-4 bg-danger/10 text-danger rounded-md">{error}</div>
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

