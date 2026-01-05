'use client';

import { ReportPageWithCRUDProps } from './BaseCRUDPage';
import { BaseCRUDPage } from './BaseCRUDPage';

/**
 * Report page component with full CRUD functionality
 * Refactored to use BaseCRUDPage to eliminate code duplication
 */
export function ReportPageWithCRUD(props: ReportPageWithCRUDProps) {
  return <BaseCRUDPage {...props} showCategory={true} />;
}
