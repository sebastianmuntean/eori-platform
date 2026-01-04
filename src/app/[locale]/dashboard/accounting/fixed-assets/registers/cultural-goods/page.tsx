'use client';

import { RegisterPageWithCRUD } from '@/components/fixed-assets/RegisterPageWithCRUD';
import { FIXED_ASSET_CATEGORIES } from '@/lib/fixed-assets/constants';

export default function CulturalGoodsRegisterPage() {
  return <RegisterPageWithCRUD category={FIXED_ASSET_CATEGORIES.CULTURAL_GOODS} />;
}
