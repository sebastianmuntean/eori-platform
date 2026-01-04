'use client';

import { RegisterPageWithCRUD } from '@/components/fixed-assets/RegisterPageWithCRUD';
import { FIXED_ASSET_CATEGORIES } from '@/lib/fixed-assets/constants';

export default function ReligiousObjectsRegisterPage() {
  return <RegisterPageWithCRUD category={FIXED_ASSET_CATEGORIES.RELIGIOUS_OBJECTS} />;
}
