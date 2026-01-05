'use client';

import { useParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterGrid, FilterClear, ParishFilter } from '@/components/ui/FilterGrid';
import { useTranslations } from 'next-intl';
import { FixedAssetCategory, CATEGORY_TRANSLATION_KEYS } from '@/lib/fixed-assets/constants';
import { getCategoryRoute } from '@/lib/fixed-assets/routes';
import { useFixedAssetsFilters } from '@/hooks/useFixedAssetsFilters';
import { useFixedAssetsTableColumns } from './FixedAssetsTableColumns';
import { FixedAssetsPagination } from './FixedAssetsPagination';
import { useFixedAssetsBreadcrumbs } from '@/lib/fixed-assets/breadcrumbs';
import { usePageTitle } from '@/hooks/usePageTitle';

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

  // Get translation key for this category
  const categoryTranslationKey = CATEGORY_TRANSLATION_KEYS[category];
  const categoryLabel = tMenu(categoryTranslationKey) || categoryTranslationKey;
  usePageTitle(categoryLabel);

  // Use centralized filters hook
  const {
    fixedAssets,
    parishes,
    loading,
    error,
    pagination,
    searchTerm,
    parishFilter,
    handleSearchChange,
    handleParishFilterChange,
    handleClearFilters,
    handlePageChange,
  } = useFixedAssetsFilters({
    category,
  });

  // Use centralized table columns
  const columns = useFixedAssetsTableColumns();

  // Use centralized breadcrumbs
  const breadcrumbItems = useFixedAssetsBreadcrumbs(
    locale,
    categoryLabel,
    getCategoryRoute(category, locale)
  );

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

            {pagination && (
              <FixedAssetsPagination
                pagination={pagination}
                loading={loading}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

