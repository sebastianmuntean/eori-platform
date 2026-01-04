'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter } from '@/components/ui/FilterGrid';
import { useFixedAssets } from '@/hooks/useFixedAssets';
import { useParishes } from '@/hooks/useParishes';
import { useTranslations } from 'next-intl';
import { FixedAssetCategory, CATEGORY_TRANSLATION_KEYS, FIXED_ASSET_STATUS } from '@/lib/fixed-assets/constants';
import { formatMonetaryValue, formatDate } from '@/lib/fixed-assets/formatters';
import { getCategoryRoute } from '@/lib/fixed-assets/routes';

interface RegisterPageProps {
  category: FixedAssetCategory;
}

/**
 * Reusable register page component for fixed assets by category
 * Eliminates code duplication across all register pages
 */
export function RegisterPage({ category }: RegisterPageProps) {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('common');
  const tMenu = useTranslations('menu');

  const {
    fixedAssets,
    loading,
    error,
    pagination,
    fetchFixedAssets,
  } = useFixedAssets();

  const { parishes, fetchParishes } = useParishes();

  const [searchTerm, setSearchTerm] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Get translation key for this category
  const categoryTranslationKey = CATEGORY_TRANSLATION_KEYS[category];
  const categoryLabel = tMenu(categoryTranslationKey) || categoryTranslationKey;

  useEffect(() => {
    fetchParishes({ all: true });
  }, [fetchParishes]);

  useEffect(() => {
    const params: any = {
      page: currentPage,
      pageSize: 10,
      search: searchTerm || undefined,
      parishId: parishFilter || undefined,
      category,
    };
    fetchFixedAssets(params);
  }, [currentPage, searchTerm, parishFilter, category, fetchFixedAssets]);

  // Memoize columns to avoid recreation on every render
  const columns = useMemo(() => [
    { key: 'inventoryNumber', label: t('inventoryNumber') || 'Număr Inventar', sortable: true },
    { key: 'name', label: t('name') || 'Name', sortable: true },
    { key: 'location', label: t('location') || 'Location', sortable: false },
    {
      key: 'acquisitionDate',
      label: t('acquisitionDate') || 'Acquisition Date',
      sortable: false,
      render: formatDate,
    },
    {
      key: 'acquisitionValue',
      label: t('acquisitionValue') || 'Acquisition Value',
      sortable: false,
      render: formatMonetaryValue,
    },
    {
      key: 'currentValue',
      label: t('currentValue') || 'Current Value',
      sortable: false,
      render: formatMonetaryValue,
    },
    {
      key: 'status',
      label: t('status') || 'Status',
      sortable: false,
      render: (value: string) => {
        const statusVariants: Record<string, 'success' | 'secondary' | 'danger' | 'warning'> = {
          [FIXED_ASSET_STATUS.ACTIVE]: 'success',
          [FIXED_ASSET_STATUS.INACTIVE]: 'secondary',
          [FIXED_ASSET_STATUS.DISPOSED]: 'danger',
          [FIXED_ASSET_STATUS.DAMAGED]: 'warning',
        };
        return (
          <Badge variant={statusVariants[value] || 'secondary'} size="sm">
            {value}
          </Badge>
        );
      },
    },
  ], [t]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleParishFilterChange = (value: string) => {
    setParishFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setParishFilter('');
    setCurrentPage(1);
  };

  const breadcrumbItems = [
    { label: t('breadcrumbDashboard'), href: `/${locale}/dashboard` },
    { label: t('accounting') || 'Accounting', href: `/${locale}/dashboard/accounting` },
    { label: tMenu('fixedAssets') || 'Mijloace fixe', href: `/${locale}/dashboard/accounting/fixed-assets` },
    { label: categoryLabel, href: getCategoryRoute(category, locale) },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{categoryLabel}</h1>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-4">
              <SearchInput
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('search') || 'Search...'}
              />
            </div>

            <FilterGrid>
              <ParishFilter
                value={parishFilter}
                onChange={handleParishFilterChange}
                parishes={parishes}
              />
              <FilterClear onClear={handleClearFilters} />
            </FilterGrid>

            {error && (
              <div className="p-4 bg-danger/10 text-danger rounded">
                {error}
              </div>
            )}

            <Table
              data={fixedAssets}
              columns={columns}
              loading={loading}
            />

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="text-sm text-text-secondary">
                  {t('showing')} {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('of')} {pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    {t('previous')}
                  </Button>
                  <span className="text-sm text-text-secondary">
                    {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages || loading}
                  >
                    {t('next')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

