'use client';

import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface FixedAssetsPaginationProps {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  loading?: boolean;
  onPageChange: (page: number) => void;
}

/**
 * Reusable pagination component for fixed assets tables
 */
export function FixedAssetsPagination({
  pagination,
  loading = false,
  onPageChange,
}: FixedAssetsPaginationProps) {
  const t = useTranslations('common');

  if (pagination.totalPages <= 1) {
    return null;
  }

  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
      <div className="text-sm text-text-secondary">
        {t('showing')} {startItem} - {endItem} {t('of')} {pagination.total}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1 || loading}
        >
          {t('previous')}
        </Button>
        <span className="text-sm text-text-secondary">
          {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages || loading}
        >
          {t('next')}
        </Button>
      </div>
    </div>
  );
}







