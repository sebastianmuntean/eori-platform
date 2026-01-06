import { Button } from '@/components/ui/Button';

interface ProductTablePaginationProps {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  t: (key: string) => string;
}

export function ProductTablePagination({
  pagination,
  currentPage,
  onPageChange,
  t,
}: ProductTablePaginationProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-text-secondary">
        {t('page') || 'Page'} {pagination.page} {t('of') || 'of'} {pagination.totalPages} (
        {pagination.total} {t('total') || 'total'})
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          {t('previous') || 'Previous'}
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.min(pagination.totalPages, currentPage + 1))}
          disabled={currentPage >= pagination.totalPages}
        >
          {t('next') || 'Next'}
        </Button>
      </div>
    </div>
  );
}





