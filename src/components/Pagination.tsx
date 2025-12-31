'use client';

import React from 'react';
import { Button } from '@/src/components/ui';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex justify-between flex-1 sm:hidden">
        <Button
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          Următor
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Afișare{' '}
            <span className="font-medium">{start}</span> -{' '}
            <span className="font-medium">{end}</span> din{' '}
            <span className="font-medium">{total}</span> rezultate
          </p>
        </div>
        <div>
          <nav className="inline-flex rounded-md shadow-sm -space-x-px">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="rounded-r-none"
            >
              «
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="rounded-none"
            >
              ‹
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="rounded-none min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="rounded-none"
            >
              ›
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="rounded-l-none"
            >
              »
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
