'use client';

import { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear } from '@/components/ui/FilterGrid';
import { Table } from '@/components/ui/Table';
import { useTranslations } from 'next-intl';

export interface TablePageLayoutProps {
  title: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  addButtonLabel: string;
  onAdd: () => void;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: ReactNode;
  tableData: any[];
  tableColumns: any[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
  } | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  emptyMessage?: string;
}

/**
 * Reusable layout component for table-based CRUD pages
 * Provides consistent structure and styling across list pages
 */
export function TablePageLayout({
  title,
  breadcrumbs,
  addButtonLabel,
  onAdd,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  tableData,
  tableColumns,
  loading = false,
  error = null,
  pagination,
  currentPage,
  onPageChange,
  onPreviousPage,
  onNextPage,
  emptyMessage,
}: TablePageLayoutProps) {
  const t = useTranslations('common');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
        </div>
        <Button onClick={onAdd}>{addButtonLabel}</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
          {filters && <FilterGrid>{filters}</FilterGrid>}
        </CardHeader>
        <CardBody>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {loading ? (
            <div>{t('loading') || 'Loading...'}</div>
          ) : (
            <>
              <Table data={tableData} columns={tableColumns} />
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-text-secondary">
                    {t('page') || 'Page'} {pagination.page} {t('of') || 'of'}{' '}
                    {pagination.totalPages} ({pagination.total} {t('total') || 'total'})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={onPreviousPage}
                      disabled={currentPage === 1}
                    >
                      {t('previous') || 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onNextPage}
                      disabled={currentPage >= pagination.totalPages}
                    >
                      {t('next') || 'Next'}
                    </Button>
                  </div>
                </div>
              )}
              {!loading && tableData.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  {emptyMessage || t('noResults') || 'No results found'}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

