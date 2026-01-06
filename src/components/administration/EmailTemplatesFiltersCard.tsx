'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useTranslations } from 'next-intl';

interface EmailTemplatesFiltersCardProps {
  searchTerm: string;
  categoryFilter: string;
  isActiveFilter: string;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onIsActiveFilterChange: (value: string) => void;
}

/**
 * Card component for email template filters
 * Includes search, category, and status filters
 */
export function EmailTemplatesFiltersCard({
  searchTerm,
  categoryFilter,
  isActiveFilter,
  onSearchChange,
  onCategoryFilterChange,
  onIsActiveFilterChange,
}: EmailTemplatesFiltersCardProps) {
  const t = useTranslations('common');

  return (
    <Card variant="outlined" className="mb-6">
      <CardBody>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder={t('searchByNameOrSubject')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('allCategories')}</option>
            <option value="predefined">{t('predefined')}</option>
            <option value="custom">{t('custom')}</option>
          </select>
          <select
            value={isActiveFilter}
            onChange={(e) => onIsActiveFilterChange(e.target.value)}
            className="px-4 py-2 border border-border rounded-md bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('allStatuses')}</option>
            <option value="true">{t('active')}</option>
            <option value="false">{t('inactive')}</option>
          </select>
        </div>
      </CardBody>
    </Card>
  );
}
