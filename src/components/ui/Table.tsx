'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { useTable, SortConfig } from '@/hooks/useTable';

interface Column<T> {
  key: keyof T;
  label: string | React.ReactNode;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  sortConfig?: SortConfig<T> | null;
  onSort?: (key: keyof T) => void;
  className?: string;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  sortConfig,
  onSort,
  className,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  console.log('Step 1: Rendering Table component');
  console.log('Step 1.1: Data count:', data.length);
  console.log('Step 1.2: Columns count:', columns.length);

  const handleSort = (key: keyof T) => {
    console.log('Step 2: Sort requested for column:', key);
    if (onSort) {
      onSort(key);
      console.log('✓ Sort handler called');
    }
  };

  const getSortIcon = (columnKey: keyof T) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  console.log('✓ Rendering table');
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-bg-secondary">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:bg-bg-tertiary select-none'
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {typeof column.label === 'string' ? column.label : column.label}
                  {column.sortable && typeof column.label === 'string' && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-bg-primary divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-bg-secondary transition-colors"
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}



