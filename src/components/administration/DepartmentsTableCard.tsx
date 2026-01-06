'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { TablePagination } from '@/components/ui/TablePagination';
import { Department } from '@/hooks/useDepartments';
import { useTranslations } from 'next-intl';

interface DepartmentsTableCardProps {
  data: Department[];
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
 * Card component for displaying departments table
 * Includes table, pagination, and error handling
 */
export function DepartmentsTableCard({
  data,
  columns,
  loading,
  error,
  pagination,
  currentPage,
  onPageChange,
  emptyMessage,
}: DepartmentsTableCardProps) {
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
            <Table
              data={data}
              columns={columns}
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

