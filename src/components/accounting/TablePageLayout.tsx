'use client';

import { ReactNode, useMemo } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid } from '@/components/ui/FilterGrid';
import { Table, Column } from '@/components/ui/Table';
import { useTranslations } from 'next-intl';

export interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export interface TablePageLayoutProps<T extends Record<string, any> = Record<string, any>> {
  title: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  addButtonLabel: string;
  onAdd: () => void;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: ReactNode;
  tableData: T[];
  tableColumns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  pagination?: PaginationInfo | null;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
}

/**
 * Pagination controls component
 */
interface PaginationControlsProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  translations: {
    page: string;
    of: string;
    total: string;
    previous: string;
    next: string;
  };
}

function PaginationControls({ pagination, onPageChange, translations }: PaginationControlsProps) {
  const handlePrevious = () => {
    if (pagination.page > 1) {
      onPageChange(pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (pagination.page < pagination.totalPages) {
      onPageChange(pagination.page + 1);
    }
  };

  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-text-secondary">
        {translations.page} {pagination.page} {translations.of} {pagination.totalPages} (
        {pagination.total} {translations.total})
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={pagination.page === 1}
        >
          {translations.previous}
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={pagination.page >= pagination.totalPages}
        >
          {translations.next}
        </Button>
      </div>
    </div>
  );
}

/**
 * Reusable layout component for table-based CRUD pages
 * Provides consistent structure and styling across list pages
 *
 * @template T - The type of data items in the table
 */
export function TablePageLayout<T extends Record<string, any> = Record<string, any>>({
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
  onPageChange,
  emptyMessage,
}: TablePageLayoutProps<T>) {
  const t = useTranslations('common');

  // Memoize translations to avoid repeated lookups
  const translations = useMemo(
    () => ({
      loading: t('loading') || 'Loading...',
      page: t('page') || 'Page',
      of: t('of') || 'of',
      total: t('total') || 'total',
      previous: t('previous') || 'Previous',
      next: t('next') || 'Next',
      noResults: emptyMessage || t('noResults') || 'No results found',
    }),
    [t, emptyMessage]
  );

  const hasData = tableData.length > 0;
  const showEmptyState = !loading && !hasData;

  return (
    <PageContainer>
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
          {error && (
            <div className="p-4 mb-4 bg-danger/10 text-danger rounded-lg border border-danger/20">
              {error}
            </div>
          )}
          {loading ? (
            <div className="py-8 text-center text-text-secondary">{translations.loading}</div>
          ) : (
            <>
              {hasData && <Table data={tableData} columns={tableColumns} />}
              {pagination && (
                <PaginationControls
                  pagination={pagination}
                  onPageChange={onPageChange}
                  translations={translations}
                />
              )}
              {showEmptyState && (
                <div className="text-center py-8 text-text-secondary">{translations.noResults}</div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
}



