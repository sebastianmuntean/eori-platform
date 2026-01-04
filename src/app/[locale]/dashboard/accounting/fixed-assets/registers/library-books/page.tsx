'use client';

import { RegisterPageWithCRUD } from '@/components/fixed-assets/RegisterPageWithCRUD';
import { FIXED_ASSET_CATEGORIES } from '@/lib/fixed-assets/constants';

export default function LibraryBooksRegisterPage() {
  return <RegisterPageWithCRUD category={FIXED_ASSET_CATEGORIES.LIBRARY_BOOKS} />;
}
