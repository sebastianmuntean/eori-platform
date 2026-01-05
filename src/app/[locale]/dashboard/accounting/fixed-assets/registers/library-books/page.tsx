'use client';

import { RegisterPageWithCRUD } from '@/components/fixed-assets/RegisterPageWithCRUD';
import { FIXED_ASSET_CATEGORIES } from '@/lib/fixed-assets/constants';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { ACCOUNTING_PERMISSIONS } from '@/lib/permissions/accounting';
import { useTranslations } from 'next-intl';

export default function LibraryBooksRegisterPage() {
  const { loading: permissionLoading } = useRequirePermission(ACCOUNTING_PERMISSIONS.FIXED_ASSETS_VIEW);
  const t = useTranslations('common');

  if (permissionLoading) {
    return <div>{t('loading')}</div>;
  }

  return <RegisterPageWithCRUD category={FIXED_ASSET_CATEGORIES.LIBRARY_BOOKS} />;
}
