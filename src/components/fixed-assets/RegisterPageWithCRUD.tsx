'use client';

import { useParams } from 'next/navigation';
import { BaseCRUDPage } from '@/components/fixed-assets/BaseCRUDPage';
import { FixedAssetCategory, CATEGORY_TRANSLATION_KEYS } from '@/lib/fixed-assets/constants';
import { getCategoryRoute } from '@/lib/fixed-assets/routes';
import { useTranslations } from 'next-intl';

interface RegisterPageWithCRUDProps {
  category: FixedAssetCategory;
}

/**
 * Register page component with full CRUD functionality
 * Refactored to use BaseCRUDPage to eliminate code duplication
 */
export function RegisterPageWithCRUD({ category }: RegisterPageWithCRUDProps) {
  const params = useParams();
  const locale = params.locale as string;
  const tMenu = useTranslations('menu');

  const categoryTranslationKey = CATEGORY_TRANSLATION_KEYS[category];
  const categoryLabel = tMenu(categoryTranslationKey) || categoryTranslationKey;

  return (
    <BaseCRUDPage
      title={categoryLabel}
      titleKey={categoryTranslationKey}
      href={getCategoryRoute(category, locale)}
      category={category}
      defaultCategory={category}
      showCategory={false}
    />
  );
}
