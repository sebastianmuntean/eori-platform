'use client';

import { useParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { useTable } from '@/hooks/useTable';
import { useState } from 'react';

// Generic data type for table
type GenericRow = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  [key: string]: any;
};

export default function ListPage() {
  console.log('Step 1: Rendering List page');
  
  const params = useParams();
  const moduleName = params.module as string;

  console.log('Step 1.1: Module name:', moduleName);

  // Generic empty data - can be replaced with real data later
  const [data] = useState<GenericRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: tableData,
    page,
    pageSize,
    totalPages,
    totalItems,
    sortConfig,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleFilter,
  } = useTable(data, 10);

  const columns = [
    {
      key: 'name' as keyof GenericRow,
      label: 'Nume',
      sortable: true,
    },
    {
      key: 'status' as keyof GenericRow,
      label: 'Status',
      sortable: true,
    },
    {
      key: 'createdAt' as keyof GenericRow,
      label: 'Data Creării',
      sortable: true,
    },
  ];

  const handleSearch = (value: string) => {
    console.log('Step 2: Handling search:', value);
    setSearchTerm(value);
    handleFilter('name', value);
    console.log('✓ Search filter applied');
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Module', href: `/dashboard/modules/${moduleName}` },
    { label: moduleName.charAt(0).toUpperCase() + moduleName.slice(1), href: `/dashboard/modules/${moduleName}` },
    { label: 'Listă' },
  ];

  console.log('✓ Rendering list page');
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Breadcrumbs items={breadcrumbs} className="mb-2" />
          <h1 className="text-3xl font-bold text-text-primary capitalize">
            Listă {moduleName}
          </h1>
        </div>
        <Button>Adaugă Nou</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              Toate Înregistrările
            </h2>
            <div className="w-64">
              <Input
                placeholder="Caută..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <Table
            data={tableData}
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            emptyMessage="Nu există înregistrări"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="text-sm text-text-secondary">
                Afișare {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalItems)} din {totalItems}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-text-secondary">
                  Pagina {page} din {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Următor
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

