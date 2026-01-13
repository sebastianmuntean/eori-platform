# Translation Verification Report

Generated: 2026-01-13T15:16:44.385Z

## Executive Summary

### Key Findings

1. **Critical Issues**: 306 keys used in code but missing in ALL locales
2. **Missing Keys**: 17 keys missing in some locales
3. **Inconsistent Keys**: 19 keys inconsistent between locales

---

## 1. Critical Issues (Keys Missing in ALL Locales)

⚠️ **These keys are used in code but do not exist in any locale file. The application will show missing translation errors.**

### common.cemeteries

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/cemeteries/page.tsx`
- `src/components/cemeteries/CemeteriesFiltersCard.tsx`
- `src/components/cemeteries/CemeteryAddModal.tsx`
- `src/components/cemeteries/CemeteryEditModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.Failed to generate fake data

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/data-statistics/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.T

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`
- `src/app/[locale]/dashboard/pilgrimages/[id]/payments/page.tsx`
- `src/components/accounting/stock-movements/StockMovementsPageContent.tsx`
- `src/components/catechesis/classes/ClassesPageContent.tsx`
- `src/components/catechesis/students/StudentsPageContent.tsx`
- `src/components/events/EventCalendar.tsx`
- `src/components/parishioners/birthdays/BirthdaysPageContent.tsx`
- `src/components/parishioners/name-days/NameDaysPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.spotCheckSaved

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorSavingSpotCheck

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.sessionUpdated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.sessionCreated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorSavingSession

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCompletingSession

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.sessionDeleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingSession

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/inventar/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.utilizatori

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/utilizatori/page.tsx`
- `src/components/administration/users/UsersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.pageUnderConstruction

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pangare/utilizatori/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.birthdays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/parishioners/birthdays/page.tsx`
- `src/components/parishioners/birthdays/BirthdaysPageContent.tsx`
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.parishioners

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/parishioners/contracts/[id]/page.tsx`
- `src/app/[locale]/dashboard/parishioners/page.tsx`
- `src/components/parishioners/birthdays/BirthdaysPageContent.tsx`
- `src/components/parishioners/contracts/ParishionerContractsPageContent.tsx`
- `src/components/parishioners/name-days/NameDaysPageContent.tsx`
- `src/components/parishioners/ParishionersPageContent.tsx`
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`
- `src/components/parishioners/search/ParishionerSearchPageContent.tsx`
- `src/components/parishioners/types/ParishionerTypesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.parishioner

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/parishioners/contracts/[id]/page.tsx`
- `src/components/parishioners/contracts/ParishionerContractsPageContent.tsx`
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.nameDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/parishioners/name-days/page.tsx`
- `src/components/parishioners/name-days/NameDaysPageContent.tsx`
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.receipts

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/parishioners/receipts/page.tsx`
- `src/components/parishioners/ParishionersPageContent.tsx`
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.parishionerTypes

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/parishioners/types/page.tsx`
- `src/components/parishioners/ParishionersPageContent.tsx`
- `src/components/parishioners/types/ParishionerTypesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.fieldRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pilgrimages/new/page.tsx`
- `src/app/[locale]/dashboard/pilgrimages/[id]/edit/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.size

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pilgrimages/[id]/documents/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.file

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pilgrimages/[id]/documents/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.uploading

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pilgrimages/[id]/documents/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.upload

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pilgrimages/[id]/documents/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectParticipant

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pilgrimages/[id]/payments/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.statistics

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/pilgrimages/[id]/statistics/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.registerId

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/registry/general-register/new/page.tsx`
- `src/app/[locale]/dashboard/registry/registratura/registrul-general/new/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.copyFrom

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/registry/general-register/new/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.person

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/ClientForm.tsx`
- `src/components/accounting/ClientsFiltersCard.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.company

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/ClientForm.tsx`
- `src/components/accounting/ClientsFiltersCard.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.organization

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/ClientForm.tsx`
- `src/components/accounting/ClientsFiltersCard.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.companyName

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/ClientForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.regCom

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/ClientForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.updating

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/clients/ClientsPageContent.tsx`
- `src/components/accounting/SupplierEditModal.tsx`
- `src/components/accounting/suppliers/SupplierEditModal.tsx`
- `src/components/administration/DeaneryEditModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.dateRangeInvalid

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/clients/ClientStatementPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCreatingContract

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/contracts/ContractsPageContent.tsx`
- `src/components/parishioners/contracts/ParishionerContractsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorUpdatingContract

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/contracts/ContractsPageContent.tsx`
- `src/components/parishioners/contracts/ParishionerContractsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorRenewingContract

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/contracts/ContractsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorLoadingInvoices

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/contracts/ContractsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.invoiceGenerated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/contracts/ContractsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorGeneratingInvoice

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/contracts/ContractsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteClient

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/DeleteClientDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteSupplier

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/DeleteSupplierDialog.tsx`
- `src/components/accounting/suppliers/DeleteSupplierDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.donationCreated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/donations/DonationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCreatingDonation

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/donations/DonationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.donationUpdated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/donations/DonationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorUpdatingDonation

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/donations/DonationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.donationDeleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/donations/DonationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingDonation

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/donations/DonationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCreatingInvoice

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/invoices/InvoicesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorUpdatingInvoice

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/invoices/InvoicesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingInvoice

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/invoices/InvoicesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.quick

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/payments/PaymentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.updateProductError

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/products/ProductsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.destinationWarehouseRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/stock-movements/StockMovementsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.supplierCreated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/suppliers/SuppliersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCreatingSupplier

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/suppliers/SuppliersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.supplierUpdated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/suppliers/SuppliersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorUpdatingSupplier

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/suppliers/SuppliersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.supplierDeleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/suppliers/SuppliersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingSupplier

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/suppliers/SuppliersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.noResults

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/accounting/TablePageLayout.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.createError

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/deaneries/DeaneriesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.updateError

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/deaneries/DeaneriesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.allDioceses

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/DeaneriesFiltersCard.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.diocese

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/DeaneryFormFields.tsx`
- `src/components/administration/dioceses/DiocesesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectDiocese

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/DeaneryFormFields.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.deanName

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/DeaneryFormFields.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteDeanery

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/DeleteDeaneryDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteDepartment

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/DeleteDepartmentDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteTemplate

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/DeleteEmailTemplateDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.departmentCreated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/departments/DepartmentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.departmentCreationFailed

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/departments/DepartmentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.departmentUpdated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/departments/DepartmentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.departmentUpdateFailed

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/departments/DepartmentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.departmentDeleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/departments/DepartmentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.departmentDeletionFailed

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/departments/DepartmentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.dioceses

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/dioceses/DiocesesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.country

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/dioceses/DiocesesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.website

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/dioceses/DiocesesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.bishopName

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/dioceses/DiocesesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteDiocese

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/dioceses/DiocesesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.noVariables

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/email-templates/EmailTemplatesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.updated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/email-templates/EmailTemplatesPageContent.tsx`
- `src/components/catechesis/classes/ClassesPageContent.tsx`
- `src/components/catechesis/students/StudentsPageContent.tsx`
- `src/components/events/FuneralsPageContent.tsx`
- `src/hooks/useCatechesisCRUD.ts`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.markAsReadSuccess

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/notifications/NotificationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.markAllAsReadSuccess

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/notifications/NotificationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.warning

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/notifications/NotificationsPageContent.tsx`
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`
- `src/components/notifications/NotificationsList.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.info

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/notifications/NotificationsPageContent.tsx`
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`
- `src/components/notifications/NotificationsList.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.message

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/notifications/NotificationsPageContent.tsx`
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.unread

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/notifications/NotificationsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.parohii

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/parishes/ParishesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectAtLeastOneRecipient

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.titleRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`
- `src/components/hr/PositionForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.messageRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.notificationsSentSuccessfully

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.sendNotification

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.recipients

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.searchUsers

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.enterTitle

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.enterMessage

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.module

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.enterModule

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.moduleHelperText

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.link

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.enterLink

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.linkHelperText

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.send

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/send-notification/SendNotificationPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.Te rugăm să selectezi un fișier Excel pentru import.

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/users/UsersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common..

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/users/UsersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.Te rugăm să selectezi un fișier Excel (.xlsx sau .xls).

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/administration/users/UsersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.created

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassesPageContent.tsx`
- `src/components/catechesis/students/StudentsPageContent.tsx`
- `src/components/events/FuneralsPageContent.tsx`
- `src/hooks/useCatechesisCRUD.ts`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorOccurred

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassesPageContent.tsx`
- `src/components/catechesis/students/StudentsPageContent.tsx`
- `src/components/events/FuneralsPageContent.tsx`
- `src/components/hr/ContractsPageContent.tsx`
- `src/components/hr/PositionsPageContent.tsx`
- `src/components/hr/SalariesPageContent.tsx`
- `src/components/hr/TimeTrackingPageContent.tsx`
- `src/components/pilgrimages/PilgrimageParticipantsPageContent.tsx`
- `src/components/pilgrimages/PilgrimagesPageContent.tsx`
- `src/hooks/useCatechesisCRUD.ts`
- `src/hooks/useHRCrudOperations.ts`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.deleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassesPageContent.tsx`
- `src/components/catechesis/students/StudentsPageContent.tsx`
- `src/components/events/FuneralsPageContent.tsx`
- `src/hooks/useCatechesisCRUD.ts`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.classId

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/lessons/LessonsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalArea

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/cemeteries/CemeteryAddModal.tsx`
- `src/components/cemeteries/CemeteryEditModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalPlots

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/cemeteries/CemeteryAddModal.tsx`
- `src/components/cemeteries/CemeteryEditModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteCemetery

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/cemeteries/DeleteCemeteryDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCreatingEvent

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/events/EventsPageContent.tsx`
- `src/components/events/FuneralsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorUpdatingEvent

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/events/EventsPageContent.tsx`
- `src/components/events/FuneralsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorConfirmingEvent

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/events/FuneralsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCancellingEvent

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/events/FuneralsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingEvent

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/events/FuneralsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.acquisitionInformation

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/fixed-assets/FixedAssetForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.depreciationInformation

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/fixed-assets/FixedAssetForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.disposalInformation

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/fixed-assets/FixedAssetForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.additionalNotes

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/fixed-assets/FixedAssetForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.terminate

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/ContractsTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.employeeNumberRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/EmployeeForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.lastNameRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/EmployeeForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.hireDateRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/EmployeeForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.allPositions

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/EmployeesTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.calculated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`
- `src/components/hr/SalariesTable.tsx`
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.count

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.leaveType

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`
- `src/components/hr/LeaveRequestForm.tsx`
- `src/components/hr/LeaveRequestsTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.maxDaysPerYear

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.usedDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.pendingDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.remainingDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectReport

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.report

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.attendance

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.leave-balance

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.leaveBalance

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.filters

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.periodFrom

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`
- `src/components/hr/SalariesTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.periodTo

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`
- `src/components/hr/SalariesTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.generateReport

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.excel

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.exportExcel

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.pdf

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.exportPDF

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalEmployees

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.activeContracts

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.statusBreakdown

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalGross

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalNet

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalBenefits

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalDeductions

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalWorkedHours

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalOvertimeHours

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.presentDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.absentDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.totalDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`
- `src/components/hr/LeaveRequestForm.tsx`
- `src/components/hr/LeaveRequestsTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.noDataAvailable

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/HRReports.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.leaveTypeRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.endDateRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.editLeaveRequest

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.addLeaveRequest

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectLeaveType

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.leaveRequestReasonPlaceholder

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.to

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestsTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.days

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestsTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.approve

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestsTable.tsx`
- `src/components/hr/SalariesTable.tsx`
- `src/components/hr/TimeEntriesTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.reject

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestsTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.allLeaveTypes

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestsTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.noLeaveRequests

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/LeaveRequestsTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.codeRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/PositionForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.maxSalaryMustBeGreaterThanMin

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/PositionForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.minSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/PositionForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.maxSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/PositionForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.salaryApproved

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorApprovingSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.salaryPaid

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorPayingSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.salaryUpdated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.salaryCreated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.salaryDeleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.addSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.deleteSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.salaryPeriod

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesTable.tsx`
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.grossSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesTable.tsx`
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.netSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesTable.tsx`
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.workedDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesTable.tsx`
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.pay

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.noSalaries

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalariesTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.contractRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.salaryPeriodRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.grossSalaryRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.netSalaryRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.workingDaysInvalid

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.workedDaysInvalid

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.editSalary

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectContract

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.workingDays

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/SalaryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.checkInTime

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.checkOutTime

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.overtimeHours

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.present

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.absent

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.late

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.halfDay

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.holiday

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.sickLeave

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.vacation

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.noTimeEntries

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntriesTable.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.entryDateRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.breakDurationInvalid

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.checkOutTimeMustBeAfterCheckIn

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.editTimeEntry

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.addTimeEntry

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntryForm.tsx`
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.entryDate

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.breakDurationMinutes

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeEntryForm.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.timeEntryApproved

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorApprovingTimeEntry

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.timeEntryUpdated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.timeEntryCreated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.timeEntryDeleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingTimeEntry

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.deleteTimeEntry

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmDeleteTimeEntry

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/hr/TimeTrackingPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.confirmCompleteMessage

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/inventory/CompleteSessionDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.invalidDate

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/notifications/NotificationsList.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.vatAndOther

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/pangare/ProductAddModal.tsx`
- `src/components/pangare/ProductEditModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.stock

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/pangare/ProductAddModal.tsx`
- `src/components/pangare/ProductEditModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.birthday

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/birthdays/BirthdaysPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.age

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/birthdays/BirthdaysPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.daysUntil

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/birthdays/BirthdaysPageContent.tsx`
- `src/components/parishioners/name-days/NameDaysPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.daysAhead

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/birthdays/BirthdaysPageContent.tsx`
- `src/components/parishioners/name-days/NameDaysPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectParishioner

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/contracts/ParishionerContractsPageContent.tsx`
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.nameDay

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/name-days/NameDaysPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.receiptsDescription

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.contractsDescription

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.parishionerTypesDescription

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.birthdaysDescription

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.nameDaysDescription

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.complexSearch

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/ParishionersPageContent.tsx`
- `src/components/parishioners/search/ParishionerSearchPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.complexSearchDescription

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.parishionersDescription

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/ParishionersPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCreatingReceipt

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorUpdatingReceipt

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingReceipt

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.receiptNumber

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.receipt

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.purpose

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/receipts/ReceiptsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.birthDateFrom

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/search/ParishionerSearchPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.birthDateTo

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/search/ParishionerSearchPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorCreatingType

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/types/ParishionerTypesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorUpdatingType

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/types/ParishionerTypesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.errorDeletingType

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/parishioners/types/ParishionerTypesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.manage

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/pilgrimages/PilgrimageDetailsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.textarea

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/registry/online-forms/OnlineFormsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.rolePermissions

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/superadmin/role-permissions/RolePermissionsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.configureRolePermissions

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/superadmin/role-permissions/RolePermissionsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.configurePermissions

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/superadmin/role-permissions/RolePermissionsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectAllPermissions

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/superadmin/role-permissions/RolePermissionsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.userRoles

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/superadmin/user-roles/UserRolesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.assignUserRoles

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/superadmin/user-roles/UserRolesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.selectRole

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/superadmin/user-roles/UserRolesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### common.assign

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/superadmin/user-roles/UserRolesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/common.json`
- `src/locales/en/common.json`
- `src/locales/it/common.json`

### menu.departments

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/administration/departments/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/menu.json`
- `src/locales/en/menu.json`
- `src/locales/it/menu.json`

### auth.redirect

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/(auth)/login/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/auth.json`
- `src/locales/en/auth.json`
- `src/locales/it/auth.json`

### auth.registered

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/(auth)/login/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/auth.json`
- `src/locales/en/auth.json`
- `src/locales/it/auth.json`

### auth.auth-refresh

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/(auth)/login/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/auth.json`
- `src/locales/en/auth.json`
- `src/locales/it/auth.json`

### online-forms.pleaseSelectTableAndColumn

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/online-forms/MappingEditorModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/online-forms.json`
- `src/locales/en/online-forms.json`
- `src/locales/it/online-forms.json`

### online-forms.pleaseEnterSqlQueryAndSelectColumn

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/online-forms/MappingEditorModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/online-forms.json`
- `src/locales/en/online-forms.json`
- `src/locales/it/online-forms.json`

### online-forms.invalidJsonFormat

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/online-forms/MappingEditorModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/online-forms.json`
- `src/locales/en/online-forms.json`
- `src/locales/it/online-forms.json`

### catechesis.validations.titleRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/catechesis/lessons/new/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.errors.parishRequired

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/catechesis/lessons/new/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.actions.create

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/catechesis/lessons/new/page.tsx`
- `src/components/catechesis/ClassAddModal.tsx`
- `src/components/catechesis/classes/ClassesPageContent.tsx`
- `src/components/catechesis/LessonEditor.tsx`
- `src/components/catechesis/lessons/LessonsPageContent.tsx`
- `src/components/catechesis/StudentAddModal.tsx`
- `src/components/catechesis/students/StudentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.lessons.createDescription

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/app/[locale]/dashboard/catechesis/lessons/new/page.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.actions.edit

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/ClassEditModal.tsx`
- `src/components/catechesis/LessonEditor.tsx`
- `src/components/catechesis/lessons/LessonsPageContent.tsx`
- `src/components/catechesis/StudentEditModal.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.classes.enrolledStudents

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassDetailsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.classes.assignedLessons

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassDetailsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.classes.noProgressData

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassDetailsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.classes.created

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.classes.updated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.classes.deleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/classes/ClassesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.classes.confirmDelete

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/DeleteClassDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.students.confirmDelete

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/DeleteStudentDialog.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.actions.cancel

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/LessonEditor.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.actions.save

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/LessonEditor.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.actions.delete

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/lessons/LessonsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.filters.allClasses

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/lessons/LessonsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.filters.allStatus

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/lessons/LessonsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.confirmations.deleteLesson

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/lessons/LessonsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.students.born

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/students/StudentDetailsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.students.classEnrollments

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/students/StudentDetailsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.students.completedLessons

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/students/StudentDetailsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.students.created

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/students/StudentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.students.updated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/students/StudentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### catechesis.students.deleted

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/catechesis/students/StudentsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/catechesis.json`
- `src/locales/en/catechesis.json`
- `src/locales/it/catechesis.json`

### pilgrimages.participantCreated

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/pilgrimages/PilgrimageParticipantsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/pilgrimages.json`
- `src/locales/en/pilgrimages.json`
- `src/locales/it/pilgrimages.json`

### pilgrimages.confirmDeleteParticipant

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/pilgrimages/PilgrimageParticipantsPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/pilgrimages.json`
- `src/locales/en/pilgrimages.json`
- `src/locales/it/pilgrimages.json`

### pilgrimages.cancel

**Status**: Missing in all locales (ro, en, it)

**Used in files**:
- `src/components/pilgrimages/PilgrimagesPageContent.tsx`

**Recommended fix**: Add this key to all locale files:
- `src/locales/ro/pilgrimages.json`
- `src/locales/en/pilgrimages.json`
- `src/locales/it/pilgrimages.json`

---

## 2. Missing Keys (Per Locale)

⚠️ **These keys are used in code but missing in specific locales.**

### common Namespace

#### Missing in EN (17 keys)

- **`county`** (present in: ro)
  - Used in: `page.tsx`, `ClientForm.tsx`, `DeaneriesPageContent.tsx`...
- **`postalCode`** (present in: ro)
  - Used in: `ClientForm.tsx`, `EmployeeForm.tsx`
- **`bankName`** (present in: ro)
  - Used in: `ClientForm.tsx`, `EmployeeForm.tsx`
- **`selectGender`** (present in: ro)
  - Used in: `EmployeeForm.tsx`
- **`department`** (present in: ro)
  - Used in: `EmployeeForm.tsx`, `EmployeesTable.tsx`, `PositionForm.tsx`...
- **`selectDepartment`** (present in: ro)
  - Used in: `EmployeeForm.tsx`, `PositionForm.tsx`
- **`position`** (present in: ro)
  - Used in: `EmployeeForm.tsx`, `EmployeesTable.tsx`
- **`selectPosition`** (present in: ro)
  - Used in: `EmployeeForm.tsx`
- **`iban`** (present in: ro)
  - Used in: `EmployeeForm.tsx`
- **`isActive`** (present in: ro)
  - Used in: `EmployeeForm.tsx`, `EmployeesTable.tsx`, `PositionForm.tsx`...
- **`confirmDeleteEmployee`** (present in: ro)
  - Used in: `EmployeesPageContent.tsx`
- **`employeeImportSuccess`** (present in: ro)
  - Used in: `EmployeesPageContent.tsx`
- **`employeeImportFailed`** (present in: ro)
  - Used in: `EmployeesPageContent.tsx`
- **`downloadEmployeeTemplate`** (present in: ro)
  - Used in: `EmployeesPageContent.tsx`
- **`searchEmploy`** (present in: ro)
  - Used in: `EmployeesTable.tsx`
- **`searchEmployees`** (present in: ro)
  - Used in: `EmployeesTable.tsx`
- **`noEmployees`** (present in: ro)
  - Used in: `EmployeesTable.tsx`

#### Missing in IT (17 keys)

- **`county`** (present in: ro)
  - Used in: `page.tsx`, `ClientForm.tsx`, `DeaneriesPageContent.tsx`...
- **`postalCode`** (present in: ro)
  - Used in: `ClientForm.tsx`, `EmployeeForm.tsx`
- **`bankName`** (present in: ro)
  - Used in: `ClientForm.tsx`, `EmployeeForm.tsx`
- **`selectGender`** (present in: ro)
  - Used in: `EmployeeForm.tsx`
- **`department`** (present in: ro)
  - Used in: `EmployeeForm.tsx`, `EmployeesTable.tsx`, `PositionForm.tsx`...
- **`selectDepartment`** (present in: ro)
  - Used in: `EmployeeForm.tsx`, `PositionForm.tsx`
- **`position`** (present in: ro)
  - Used in: `EmployeeForm.tsx`, `EmployeesTable.tsx`
- **`selectPosition`** (present in: ro)
  - Used in: `EmployeeForm.tsx`
- **`iban`** (present in: ro)
  - Used in: `EmployeeForm.tsx`
- **`isActive`** (present in: ro)
  - Used in: `EmployeeForm.tsx`, `EmployeesTable.tsx`, `PositionForm.tsx`...
- **`confirmDeleteEmployee`** (present in: ro)
  - Used in: `EmployeesPageContent.tsx`
- **`employeeImportSuccess`** (present in: ro)
  - Used in: `EmployeesPageContent.tsx`
- **`employeeImportFailed`** (present in: ro)
  - Used in: `EmployeesPageContent.tsx`
- **`downloadEmployeeTemplate`** (present in: ro)
  - Used in: `EmployeesPageContent.tsx`
- **`searchEmploy`** (present in: ro)
  - Used in: `EmployeesTable.tsx`
- **`searchEmployees`** (present in: ro)
  - Used in: `EmployeesTable.tsx`
- **`noEmployees`** (present in: ro)
  - Used in: `EmployeesTable.tsx`

---

## 3. Inconsistent Keys (Between Locales)

⚠️ **These keys exist in some locales but not all. Consider adding them to all locales for consistency.**

### common Namespace

- **`position`**
  - Present in: ro
  - Missing in: en, it
- **`selectGender`**
  - Present in: ro
  - Missing in: en, it
- **`selectPosition`**
  - Present in: ro
  - Missing in: en, it
- **`selectDepartment`**
  - Present in: ro
  - Missing in: en, it
- **`postalCode`**
  - Present in: ro
  - Missing in: en, it
- **`county`**
  - Present in: ro
  - Missing in: en, it
- **`department`**
  - Present in: ro
  - Missing in: en, it
- **`bankName`**
  - Present in: ro
  - Missing in: en, it
- **`iban`**
  - Present in: ro
  - Missing in: en, it
- **`isActive`**
  - Present in: ro
  - Missing in: en, it
- **`confirmDeleteEmployee`**
  - Present in: ro
  - Missing in: en, it
- **`noEmployees`**
  - Present in: ro
  - Missing in: en, it
- **`importEmployees`**
  - Present in: ro
  - Missing in: en, it
- **`downloadEmployeeTemplate`**
  - Present in: ro
  - Missing in: en, it
- **`importEmployeesDescription`**
  - Present in: ro
  - Missing in: en, it
- **`employeeImportSuccess`**
  - Present in: ro
  - Missing in: en, it
- **`employeeImportFailed`**
  - Present in: ro
  - Missing in: en, it
- **`searchEmploy`**
  - Present in: ro
  - Missing in: en, it
- **`searchEmployees`**
  - Present in: ro
  - Missing in: en, it

---

## 4. Summary Statistics

### common
- Keys used in code: 859
- Keys defined in EN: 693
- Keys defined in RO: 712
- Keys defined in IT: 693

### menu
- Keys used in code: 96
- Keys defined in EN: 114
- Keys defined in RO: 114
- Keys defined in IT: 114

### auth
- Keys used in code: 20
- Keys defined in EN: 21
- Keys defined in RO: 21
- Keys defined in IT: 21

### online-forms
- Keys used in code: 94
- Keys defined in EN: 147
- Keys defined in RO: 147
- Keys defined in IT: 147

### registratura
- Keys used in code: 47
- Keys defined in EN: 192
- Keys defined in RO: 192
- Keys defined in IT: 192

### hr
- Keys used in code: 0
- Keys defined in EN: 301
- Keys defined in RO: 301
- Keys defined in IT: 301

### catechesis
- Keys used in code: 92
- Keys defined in EN: 181
- Keys defined in RO: 181
- Keys defined in IT: 181

### pilgrimages
- Keys used in code: 140
- Keys defined in EN: 226
- Keys defined in RO: 226
- Keys defined in IT: 226
