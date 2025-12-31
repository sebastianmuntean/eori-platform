'use client';

import React, { useEffect, useState } from 'react';
import { useDioceses, Diocese } from '@/src/hooks/useDioceses';
import { DioceseForm } from '@/src/components/forms';
import { DataTable } from '@/src/components/DataTable';
import { Pagination } from '@/src/components/Pagination';
import { Button, Input } from '@/src/components/ui';

export default function DiocesesPage() {
  const { dioceses, loading, error, pagination, fetchDioceses, createDiocese, updateDiocese, deleteDiocese } = useDioceses();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDiocese, setEditingDiocese] = useState<Diocese | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchDioceses({ page, search: search || undefined });
  }, [fetchDioceses, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDioceses({ page: 1, search: search || undefined });
  };

  const handleCreate = () => {
    setEditingDiocese(null);
    setIsFormOpen(true);
  };

  const handleEdit = (diocese: Diocese) => {
    setEditingDiocese(diocese);
    setIsFormOpen(true);
  };

  const handleDelete = async (diocese: Diocese) => {
    await deleteDiocese(diocese.id);
  };

  const handleSubmit = async (data: Partial<Diocese>) => {
    if (editingDiocese) {
      return await updateDiocese(editingDiocese.id, data);
    }
    return await createDiocese(data);
  };

  const columns = [
    { key: 'code', header: 'Cod' },
    { key: 'name', header: 'Denumire' },
    { key: 'city', header: 'Oraș' },
    { key: 'county', header: 'Județ' },
    { key: 'bishopName', header: 'Episcop' },
    {
      key: 'isActive',
      header: 'Status',
      render: (item: Diocese) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {item.isActive ? 'Activ' : 'Inactiv'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dieceze</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestionează diecezele din sistem
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Caută după cod, nume, oraș..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button type="submit" variant="secondary">
              Caută
            </Button>
          </form>
          <Button onClick={handleCreate}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Adaugă Dieceză
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={dioceses}
          loading={loading}
          keyField="id"
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Nu există dieceze înregistrate"
        />

        {/* Pagination */}
        {pagination && (
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}

        {/* Form Modal */}
        <DioceseForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          diocese={editingDiocese}
          loading={loading}
        />
      </div>
    </div>
  );
}
