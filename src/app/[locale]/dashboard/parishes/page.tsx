'use client';

import React, { useEffect, useState } from 'react';
import { useParishes, Parish } from '@/src/hooks/useParishes';
import { useDioceses } from '@/src/hooks/useDioceses';
import { useDeaneries } from '@/src/hooks/useDeaneries';
import { ParishForm } from '@/src/components/forms';
import { DataTable } from '@/src/components/DataTable';
import { Pagination } from '@/src/components/Pagination';
import { Button, Input, Select } from '@/src/components/ui';

export default function ParishesPage() {
  const { parishes, loading, error, pagination, fetchParishes, createParish, updateParish, deleteParish } = useParishes();
  const { dioceses, fetchDioceses } = useDioceses();
  const { deaneries, fetchDeaneries } = useDeaneries();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParish, setEditingParish] = useState<Parish | null>(null);
  const [search, setSearch] = useState('');
  const [dioceseFilter, setDioceseFilter] = useState('');
  const [deaneryFilter, setDeaneryFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchDioceses({ pageSize: 100, isActive: 'true' });
    fetchDeaneries({ pageSize: 100, isActive: 'true' });
  }, [fetchDioceses, fetchDeaneries]);

  useEffect(() => {
    fetchParishes({
      page,
      search: search || undefined,
      dioceseId: dioceseFilter || undefined,
      deaneryId: deaneryFilter || undefined,
    });
  }, [fetchParishes, page, search, dioceseFilter, deaneryFilter]);

  // Filter deaneries based on selected diocese
  const filteredDeaneries = dioceseFilter
    ? deaneries.filter((d) => d.dioceseId === dioceseFilter)
    : deaneries;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchParishes({
      page: 1,
      search: search || undefined,
      dioceseId: dioceseFilter || undefined,
      deaneryId: deaneryFilter || undefined,
    });
  };

  const handleCreate = () => {
    setEditingParish(null);
    setIsFormOpen(true);
  };

  const handleEdit = (parish: Parish) => {
    setEditingParish(parish);
    setIsFormOpen(true);
  };

  const handleDelete = async (parish: Parish) => {
    await deleteParish(parish.id);
  };

  const handleSubmit = async (data: Partial<Parish>) => {
    if (editingParish) {
      return await updateParish(editingParish.id, data);
    }
    return await createParish(data);
  };

  const dioceseOptions = dioceses.map((d) => ({
    value: d.id,
    label: `${d.code} - ${d.name}`,
  }));

  const deaneryOptions = filteredDeaneries.map((d) => ({
    value: d.id,
    label: `${d.code} - ${d.name}`,
  }));

  const columns = [
    { key: 'code', header: 'Cod' },
    { key: 'name', header: 'Denumire' },
    { key: 'dioceseName', header: 'Dieceză' },
    { key: 'deaneryName', header: 'Protopopiat' },
    { key: 'city', header: 'Localitate' },
    { key: 'priestName', header: 'Paroh' },
    {
      key: 'parishionerCount',
      header: 'Enoriași',
      render: (item: Parish) =>
        item.parishionerCount ? item.parishionerCount.toLocaleString() : '-',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item: Parish) => (
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
          <h1 className="text-2xl font-bold text-gray-900">Parohii</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestionează parohiile din sistem
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <Input
              placeholder="Caută după cod, nume, localitate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Select
              options={dioceseOptions}
              value={dioceseFilter}
              onChange={(e) => {
                setDioceseFilter(e.target.value);
                setDeaneryFilter(''); // Reset deanery when diocese changes
                setPage(1);
              }}
              placeholder="Toate diecezele"
              className="w-48"
            />
            <Select
              options={deaneryOptions}
              value={deaneryFilter}
              onChange={(e) => {
                setDeaneryFilter(e.target.value);
                setPage(1);
              }}
              placeholder={dioceseFilter ? 'Toate protopopiatele' : 'Selectează dieceza'}
              disabled={!dioceseFilter}
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
            Adaugă Parohie
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
          data={parishes}
          loading={loading}
          keyField="id"
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="Nu există parohii înregistrate"
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
        <ParishForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
          parish={editingParish}
          dioceses={dioceses}
          deaneries={deaneries}
          loading={loading}
        />
      </div>
    </div>
  );
}
