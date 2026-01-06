import { Button } from './Button';

export interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

interface TablePaginationProps {
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  t?: (key: string) => string;
}

export function TablePagination({
  pagination,
  currentPage,
  onPageChange,
  loading = false,
  t = (key: string) => key,
}: TablePaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
      <div className="text-sm text-text-secondary">
        {t('showing') || 'Showing'} {startItem} - {endItem} {t('of') || 'of'} {pagination.total}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          {t('previous') || 'Previous'}
        </Button>
        <span className="text-sm text-text-secondary">
          {t('page') || 'Page'} {pagination.page} {t('of') || 'of'} {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pagination.totalPages || loading}
        >
          {t('next') || 'Next'}
        </Button>
      </div>
    </div>
  );
}





