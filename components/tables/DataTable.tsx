"use client";

import React from "react";

// TODO: Install and use MUI components
// For now, creating a basic structure that can be enhanced with MUI later

export interface Column<T = unknown> {
  id: string;
  label: string;
  minWidth?: number;
  align?: "left" | "right" | "center";
  format?: (value: unknown, row?: T) => string | React.ReactNode;
}

interface DataTableProps<T = unknown> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  loading?: boolean;
  title?: string;
}

export function DataTable<T = unknown>({
  columns,
  data,
  onEdit,
  onDelete,
  loading = false,
  title,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      {title && (
        <div className="p-4">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {column.format
                          ? column.format(
                              (row as Record<string, unknown>)[column.id],
                              row
                            )
                          : String((row as Record<string, unknown>)[column.id] ?? "")}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handleChangePage(null, page - 1)}
            disabled={page === 0}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handleChangePage(null, page + 1)}
            disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{page * rowsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min((page + 1) * rowsPerPage, data.length)}
              </span>{" "}
              of <span className="font-medium">{data.length}</span> results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Rows per page:</label>
            <select
              value={rowsPerPage}
              onChange={(e) =>
                handleChangeRowsPerPage(e as React.ChangeEvent<HTMLSelectElement>)
              }
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              {[5, 10, 25, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleChangePage(null, page - 1)}
              disabled={page === 0}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handleChangePage(undefined, page + 1)}
              disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

