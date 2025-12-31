'use client';

import React, { useEffect, useState } from 'react';
import { useDeaneries, Deanery } from '@/src/hooks/useDeaneries';
import { useDioceses } from '@/src/hooks/useDioceses';
import { DeaneryForm } from '@/src/components/forms';
import { DataTable } from '@/src/components/DataTable';
import { Pagination } from '@/src/components/Pagination';
import { Button, Input, Select } from '@/src/components/ui';

export default function DeaneriesPage() {
  const { deaneries, loading, error, pagination, fetchDeaneries, createDeanery, updateDeanery, deleteDeanery } = useDeaneries();
  const { dioceses, fetchDioceses } = useDioceses();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeanery, setEditingDeanery] = useState<Deanery | null>(null);
  const [search, setSearch] = useState('');
  const [dioceseFilter, setDioceseFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchDioceses({ pageSize: 100, isActive: 'true' });
  }, [fetchDioceses]);

  useEffect(() => {
    fetchDeaneries({
      page,
      search: search || undefined,
      dioceseId: dioceseFilter || undefined,
    });
  }, [fetchDeaneries, page, search, dioceseFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDeaneries({
      page: 1,
      search: search || undefined,
      dioceseId: dioceseFilter || undefined,
    });
  };

  const handleCreate = () => {
    setEditingDeanery(null);
    setIsFormOpen(true);
  };

  const handleEdit = (deanery: Deanery) => {
    setEditingDeanery(deanery);
    setIsFormOpen(true);
  };

  const handleDelete = async (deanery: Deanery) => {
    await deleteDeanery(deanery.id);
  };

  const handleSubmit = async (data: Partial<Deanery>) => {
    if (editingDeanery) {
      return await updateDeanery(editingDeanery.id, data);
    }
    return await createDeanery(data);
  };

  const dioceseOptions = dioceses.map((d) => ({
    value: d.id,
    label: `${d.code} - ${d.name}`,
  }));

  const columns = [
    { key: 'code', header: 'Cod' },
    { key: 'name', header: 'Denumire' },
    { key: 'dioceseName', header: 'Dieceză' },
    { key: 'city', header: 'Oraș' },
    { key: 'deanName', header: 'Protopop' },
    {
      key: 'isActive',
      header: 'Status',
      render: (item: Deanery) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Protopopiate</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestionează protopopiatele din sistem
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <Input
              placeholder="Caută după cod, nume..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
            <Select
              options={dioceseOptions}
              value={dioceseFilter}
              onChange={(e) => {
                setDioceseFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Toate diecezele"
              className="w-48"
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
            Adaugă Protopopiat
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
          data={deaneries}
          loading={loading}
          keyField="id"
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Nu există protopopiate înregistrate"
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
        <DeaneryForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          deanery={editingDeanery}
          dioceses={dioceses}
          loading={loading}
        />
      </div>
    </div>
  );
}
