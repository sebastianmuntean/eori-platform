# Analiză Module și Resurse pentru Permisiuni

## Data Analizei
$(date)

## Rezumat Executiv

Această analiză identifică toate modulele din aplicație, resursele acestora și permisiunile necesare, bazându-se pe:
- Structura sidebar-ului (`src/components/layouts/Sidebar.tsx`)
- Rutele API (`src/app/api/`)
- Paginile dashboard-ului (`src/app/[locale]/dashboard/`)

### Permisiuni Existente ✓
- **HR Module**: `hr.*` (52 permisiuni definite în `0049_add_hr_permissions.sql`)
- **Cemeteries Module**: `cemeteries.*` (permisiuni definite, folosesc pattern `cemeteries.{resource}.{action}`)

### Module Fără Permisiuni (de adăugat)
14 module identificate care necesită definirea permisiunilor

---

## 1. REGISTRATURA (Registry Module)

### Resurse Identificate
- **Documents** (`/api/registratura/documents`)
- **General Register** (`/api/registratura/general-register`)
- **Online Forms** (`/api/online-forms`, `/api/registry/online-forms`)
- **Mapping Datasets** (`/api/online-forms/mapping-datasets`)
- **Register Configurations** (`/api/registratura/register-configurations`)

### Rute Sidebar
- `registry/general-register`
- `registry/online-forms`
- `registry/online-forms/mapping-datasets`
- `registry/register-configurations`

### Pagini Dashboard
- `registry/general-register/page.tsx`
- `registry/general-register/[id]/page.tsx`
- `registry/general-register/new/page.tsx`
- `registry/online-forms/page.tsx`
- `registry/online-forms/mapping-datasets/page.tsx`
- `registry/register-configurations/page.tsx`

### Permisiuni Recomandate
```
registratura.documents.view
registratura.documents.create
registratura.documents.update
registratura.documents.delete
registratura.documents.manage (workflow: redirect, approve, reject, etc.)

registratura.generalRegister.view
registratura.generalRegister.create
registratura.generalRegister.update
registratura.generalRegister.delete

registratura.onlineForms.view
registratura.onlineForms.create
registratura.onlineForms.update
registratura.onlineForms.delete

registratura.mappingDatasets.view
registratura.mappingDatasets.create
registratura.mappingDatasets.update
registratura.mappingDatasets.delete

registratura.registerConfigurations.view
registratura.registerConfigurations.create
registratura.registerConfigurations.update
registratura.registerConfigurations.delete
```

---

## 2. ACCOUNTING Module

### Resurse Identificate
- **Invoices** (`/api/accounting/invoices`)
- **Contracts** (`/api/accounting/contracts`)
- **Payments** (`/api/accounting/payments`)
- **Donations** (`/api/accounting/donations`)
- **Clients** (`/api/clients`)
- **Suppliers** (`/api/accounting/suppliers` - implicit în structură)
- **Warehouses** (`/api/accounting/warehouses`)
- **Products** (`/api/accounting/products`)
- **Stock Movements** (`/api/accounting/stock-movements`)
- **Fixed Assets** (`/api/accounting/fixed-assets`)
- **Stock Levels** (`/api/accounting/stock-levels`)

### Rute Sidebar
- `accounting/payments` (quick payment)
- `accounting/payments` (regular)
- `accounting/donations`
- `accounting/invoices`
- `accounting/contracts`
- `accounting/suppliers`
- `accounting/clients`
- `accounting/products`
- `accounting/warehouses` (în Pangare section)
- `accounting/stock-movements` (în Pangare section)
- `accounting/stock-levels` (în Pangare section)
- `accounting/fixed-assets` (în Pangare section)

### Pagini Dashboard
Toate resursele au pagini dedicate în `accounting/`

### Permisiuni Recomandate
```
accounting.invoices.view
accounting.invoices.create
accounting.invoices.update
accounting.invoices.delete
accounting.invoices.approve
accounting.invoices.pay
accounting.invoices.export

accounting.contracts.view
accounting.contracts.create
accounting.contracts.update
accounting.contracts.delete
accounting.contracts.renew
accounting.contracts.terminate

accounting.payments.view
accounting.payments.create
accounting.payments.update
accounting.payments.delete
accounting.payments.approve

accounting.donations.view
accounting.donations.create
accounting.donations.update
accounting.donations.delete

accounting.clients.view
accounting.clients.create
accounting.clients.update
accounting.clients.delete
accounting.clients.viewStatement

accounting.suppliers.view
accounting.suppliers.create
accounting.suppliers.update
accounting.suppliers.delete

accounting.warehouses.view
accounting.warehouses.create
accounting.warehouses.update
accounting.warehouses.delete

accounting.products.view
accounting.products.create
accounting.products.update
accounting.products.delete

accounting.stockMovements.view
accounting.stockMovements.create
accounting.stockMovements.update
accounting.stockMovements.delete
accounting.stockMovements.transfer

accounting.stockLevels.view
accounting.stockLevels.export

accounting.fixedAssets.view
accounting.fixedAssets.create
accounting.fixedAssets.update
accounting.fixedAssets.delete
accounting.fixedAssets.manage
```

---

## 3. ADMINISTRATION Module

### Resurse Identificate
- **Dioceses** (`/api/dioceses`)
- **Deaneries** (`/api/deaneries`)
- **Parishes** (`/api/parishes`)
- **Departments** (`/api/departments`)
- **Users** (`/api/users`)
- **Email Templates** (`/api/email-templates`)
- **Notifications** (`/api/notifications`)
- **Send Notification** (pagina, nu API separat)
- **Send Email** (pagina, nu API separat)

### Rute Sidebar
- `administration/dioceses`
- `administration/deaneries`
- `administration/parishes`
- `administration/departments`
- `administration/notifications`
- `administration/send-notification`
- `administration/send-email`
- `administration/users` (în Setări)
- `administration/email-templates` (în Setări)

### Pagini Dashboard
Toate resursele au pagini dedicate

### Permisiuni Recomandate
```
administration.dioceses.view
administration.dioceses.create
administration.dioceses.update
administration.dioceses.delete

administration.deaneries.view
administration.deaneries.create
administration.deaneries.update
administration.deaneries.delete

administration.parishes.view
administration.parishes.create
administration.parishes.update
administration.parishes.delete

administration.departments.view
administration.departments.create
administration.departments.update
administration.departments.delete

administration.users.view
administration.users.create
administration.users.update
administration.users.delete
administration.users.export
administration.users.import

administration.emailTemplates.view
administration.emailTemplates.create
administration.emailTemplates.update
administration.emailTemplates.delete
administration.emailTemplates.send
administration.emailTemplates.sendBulk

administration.notifications.view
administration.notifications.create
administration.notifications.send
administration.notifications.delete
```

---

## 4. EVENTS Module

### Resurse Identificate
- **Events** (`/api/events`)
- **Baptisms** (`/api/events`, `/api/public/events/baptisms`)
- **Weddings** (`/api/events`, `/api/public/events/weddings`)
- **Funerals** (`/api/events`, `/api/public/events/funerals`)
- **Event Documents** (`/api/events/[eventId]/documents`)
- **Event Participants** (`/api/events/[eventId]/participants`)
- **Email Submissions** (`/api/events/email-submissions`)
- **Email Fetcher** (`/api/events/email-fetcher`)

### Rute Sidebar
- `events`
- `events/baptisms`
- `events/weddings`
- `events/funerals`

### Pagini Dashboard
- `events/page.tsx`
- `events/baptisms/page.tsx`
- `events/weddings/page.tsx`
- `events/funerals/page.tsx`
- `events/email-fetcher/page.tsx`

### Permisiuni Recomandate
```
events.view
events.create
events.update
events.delete
events.cancel
events.confirm

events.baptisms.view
events.baptisms.create
events.baptisms.update
events.baptisms.delete

events.weddings.view
events.weddings.create
events.weddings.update
events.weddings.delete

events.funerals.view
events.funerals.create
events.funerals.update
events.funerals.delete

events.documents.view
events.documents.create
events.documents.delete

events.participants.view
events.participants.create
events.participants.update
events.participants.delete

events.emailFetcher.view
events.emailFetcher.trigger
```

---

## 5. PARISHIONERS Module

### Resurse Identificate
- **Parishioners** (nu există API direct, probabil prin search)
- **Receipts** (`/api/parishioners/receipts`)
- **Contracts** (`/api/parishioners/contracts`)
- **Types** (`/api/parishioners/types`)
- **Birthdays** (`/api/parishioners/birthdays`)
- **Name Days** (`/api/parishioners/name-days`)
- **Search** (`/api/parishioners/search`)

### Rute Sidebar
- `parishioners`
- `parishioners/receipts`
- `parishioners/contracts`
- `parishioners/types`
- `parishioners/birthdays`
- `parishioners/name-days`

### Pagini Dashboard
Toate resursele au pagini dedicate

### Permisiuni Recomandate
```
parishioners.view
parishioners.create
parishioners.update
parishioners.delete
parishioners.search

parishioners.receipts.view
parishioners.receipts.create
parishioners.receipts.update
parishioners.receipts.delete
parishioners.receipts.print

parishioners.contracts.view
parishioners.contracts.create
parishioners.contracts.update
parishioners.contracts.delete
parishioners.contracts.renew
parishioners.contracts.terminate

parishioners.types.view
parishioners.types.create
parishioners.types.update
parishioners.types.delete

parishioners.birthdays.view

parishioners.nameDays.view
```

---

## 6. CATECHESIS Module

### Resurse Identificate
- **Classes** (`/api/catechesis/classes`)
- **Lessons** (`/api/catechesis/lessons`)
- **Students** (`/api/catechesis/students`)
- **Enrollments** (`/api/catechesis/enrollments`)
- **Progress** (`/api/catechesis/progress`)

### Rute Sidebar
- `catechesis`
- `catechesis/classes`
- `catechesis/students`
- `catechesis/lessons`

### Pagini Dashboard
- `catechesis/page.tsx`
- `catechesis/classes/page.tsx`
- `catechesis/classes/[id]/page.tsx`
- `catechesis/students/page.tsx`
- `catechesis/students/[id]/page.tsx`
- `catechesis/lessons/page.tsx`
- `catechesis/lessons/[id]/page.tsx`
- `catechesis/lessons/new/page.tsx`

### Permisiuni Recomandate
```
catechesis.classes.view
catechesis.classes.create
catechesis.classes.update
catechesis.classes.delete

catechesis.lessons.view
catechesis.lessons.create
catechesis.lessons.update
catechesis.lessons.delete

catechesis.students.view
catechesis.students.create
catechesis.students.update
catechesis.students.delete

catechesis.enrollments.view
catechesis.enrollments.create
catechesis.enrollments.update
catechesis.enrollments.delete

catechesis.progress.view
catechesis.progress.track
```

---

## 7. PILGRIMAGES Module

### Resurse Identificate
- **Pilgrimages** (`/api/pilgrimages`)
- **Participants** (`/api/pilgrimages/[id]/participants`)
- **Payments** (`/api/pilgrimages/[id]/payments`)
- **Documents** (`/api/pilgrimages/[id]/documents`)
- **Meals** (`/api/pilgrimages/[id]/meals`)
- **Accommodation** (`/api/pilgrimages/[id]/accommodation`)
- **Transport** (`/api/pilgrimages/[id]/transport`)
- **Schedule** (`/api/pilgrimages/[id]/schedule`)
- **Statistics** (`/api/pilgrimages/[id]/statistics`)
- **Workflow** (`/api/pilgrimages/[id]/workflow` - approve, publish, close, cancel)

### Rute Sidebar
- `pilgrimages`
- `pilgrimages/new`

### Pagini Dashboard
- `pilgrimages/page.tsx`
- `pilgrimages/new/page.tsx`
- `pilgrimages/[id]/page.tsx`
- `pilgrimages/[id]/edit/page.tsx`
- `pilgrimages/[id]/participants/page.tsx`
- `pilgrimages/[id]/payments/page.tsx`
- `pilgrimages/[id]/documents/page.tsx`
- `pilgrimages/[id]/meals/page.tsx`
- `pilgrimages/[id]/accommodation/page.tsx`
- `pilgrimages/[id]/transport/page.tsx`
- `pilgrimages/[id]/schedule/page.tsx`
- `pilgrimages/[id]/statistics/page.tsx`

### Permisiuni Recomandate
```
pilgrimages.view
pilgrimages.create
pilgrimages.update
pilgrimages.delete
pilgrimages.approve
pilgrimages.publish
pilgrimages.close
pilgrimages.cancel

pilgrimages.participants.view
pilgrimages.participants.create
pilgrimages.participants.update
pilgrimages.participants.delete
pilgrimages.participants.confirm
pilgrimages.participants.cancel

pilgrimages.payments.view
pilgrimages.payments.create
pilgrimages.payments.update
pilgrimages.payments.delete

pilgrimages.documents.view
pilgrimages.documents.create
pilgrimages.documents.delete

pilgrimages.meals.view
pilgrimages.meals.create
pilgrimages.meals.update
pilgrimages.meals.delete

pilgrimages.accommodation.view
pilgrimages.accommodation.create
pilgrimages.accommodation.update
pilgrimages.accommodation.delete

pilgrimages.transport.view
pilgrimages.transport.create
pilgrimages.transport.update
pilgrimages.transport.delete

pilgrimages.schedule.view
pilgrimages.schedule.create
pilgrimages.schedule.update
pilgrimages.schedule.delete

pilgrimages.statistics.view
```

---

## 8. PANGARE Module (Inventory Management)

### Resurse Identificate
- **Pangar** (`/api/pangare/inventar` - există API pentru inventar)
- **Products** (partajat cu Accounting)
- **Warehouses** (partajat cu Accounting)
- **Stock Movements** (partajat cu Accounting)
- **Stock Levels** (partajat cu Accounting)
- **Fixed Assets** (partajat cu Accounting)
- **Inventar** (`/api/pangare/inventar`)
- **Utilizatori** (pagina există, dar nu API dedicat)

### Rute Sidebar
- `pangare/pangar`
- `pangare/produse`
- `pangare/utilizatori`
- `pangare/inventar`
- Plus resurse partajate cu Accounting

### Pagini Dashboard
- `pangare/pangar/page.tsx`
- `pangare/produse/page.tsx`
- `pangare/utilizatori/page.tsx`
- `pangare/inventar/page.tsx`

### Permisiuni Recomandate
```
pangare.view
pangare.inventar.view
pangare.inventar.create
pangare.inventar.update
pangare.inventar.delete
pangare.utilizatori.view
pangare.utilizatori.create
pangare.utilizatori.update
pangare.utilizatori.delete

Notă: Products, Warehouses, Stock Movements, Stock Levels, Fixed Assets sunt gestionate prin Accounting permissions
```

---

## 9. LIBRARY Module

### Resurse Identificate (din schema bazei de date)
- **Books** (`library_books` table exists)
- **Authors** (`library_authors` table exists)
- **Publishers** (`library_publishers` table exists)
- **Domains** (`library_domains` table exists)
- **Loans** (`library_loans` table exists)

### Rute Sidebar
❌ **Nu există în sidebar** (menționat în plan dar nu implementat în UI)

### Pagini Dashboard
❌ **Nu există pagini dedicate** (doar `accounting/fixed-assets/registers/library-books` care este pentru inventariere)

### API Routes
❌ **Nu există API routes dedicate**

### Status
⚠️ **Modulul este definit în schema bazei de date dar nu are implementare în aplicație**

### Permisiuni Recomandate (pentru viitor)
```
library.books.view
library.books.create
library.books.update
library.books.delete

library.authors.view
library.authors.create
library.authors.update
library.authors.delete

library.publishers.view
library.publishers.create
library.publishers.update
library.publishers.delete

library.domains.view
library.domains.create
library.domains.update
library.domains.delete

library.loans.view
library.loans.create
library.loans.update
library.loans.delete
library.loans.return
```

**Recomandare**: Nu adăuga permisiuni pentru Library până când modulul nu este implementat în aplicație.

---

## 10. PARTNERS Module

### Resurse Identificate
- **Partners** (`/api/partners`)

### Rute Sidebar
❌ **Nu există în sidebar** (menționat în plan dar nu apare în meniu)

### Pagini Dashboard
❌ **Nu există pagini dedicate**

### API Routes
✅ `/api/partners` route exists
✅ `/api/partners/[id]` route exists
✅ `/api/partners/[id]/statement` route exists

### Status
⚠️ **API există dar nu are interfață utilizator**

### Permisiuni Recomandate (pentru viitor)
```
partners.view
partners.create
partners.update
partners.delete
partners.viewStatement
```

**Recomandare**: Nu adăuga permisiuni pentru Partners până când modulul nu este complet implementat în UI.

---

## 11. ONLINE FORMS Module

### Resurse Identificate
- **Forms** (`/api/online-forms`)
- **Submissions** (`/api/online-forms/submissions`)
- **Mapping Datasets** (`/api/online-forms/mapping-datasets`)
- **Public Forms** (`/api/public/online-forms/[widgetCode]`)

### Rute Sidebar
- `online-forms` (există pagină dar nu în sidebar)
- `registry/online-forms` (în sidebar)
- `registry/online-forms/mapping-datasets` (în sidebar)

### Pagini Dashboard
- `online-forms/page.tsx`
- `online-forms/new/page.tsx`
- `online-forms/[id]/page.tsx`
- `online-forms/mapping-datasets/page.tsx`

### Permisiuni Recomandate
```
onlineForms.view
onlineForms.create
onlineForms.update
onlineForms.delete

onlineForms.submissions.view
onlineForms.submissions.process
onlineForms.submissions.delete

onlineForms.mappingDatasets.view
onlineForms.mappingDatasets.create
onlineForms.mappingDatasets.update
onlineForms.mappingDatasets.delete

Notă: Mapping Datasets sunt gestionate și prin registratura.mappingDatasets
```

---

## 12. CHAT Module

### Resurse Identificate
- **Conversations** (`/api/chat/conversations`)
- **Messages** (implicit în conversations)
- **Files** (`/api/chat/files`)
- **Users** (`/api/chat/users`)

### Rute Sidebar
- `chat`

### Pagini Dashboard
- `chat/page.tsx`

### Permisiuni Recomandate
```
chat.view
chat.send
chat.manage
chat.files.upload
chat.files.download
```

---

## 13. ANALYTICS Module

### Resurse Identificate
- **Analytics Dashboard** (`/api/analytics/dashboard`)
- **Reports** (`/api/analytics/reports`)

### Rute Sidebar
- `analytics`

### Pagini Dashboard
- `analytics/page.tsx`

### Permisiuni Recomandate
```
analytics.view
analytics.reports.view
analytics.reports.export
```

---

## 14. DATA STATISTICS Module

### Resurse Identificate
- **Data Statistics** (`/api/statistics/data`)
- **Generate Fake Data** (`/api/statistics/generate-fake-data`)
- **Delete Fake Data** (`/api/statistics/delete-fake-data`)

### Rute Sidebar
- `data-statistics`

### Pagini Dashboard
- `data-statistics/page.tsx`

### Permisiuni Recomandate
```
dataStatistics.view
dataStatistics.export
dataStatistics.generateFakeData (dev/admin only)
dataStatistics.deleteFakeData (dev/admin only)
```

---

## 15. SUPERADMIN Module

### Resurse Identificate
- **Roles** (`/api/superadmin/roles`)
- **Permissions** (`/api/superadmin/permissions`)
- **User Roles** (`/api/superadmin/user-roles`)
- **Role Permissions** (`/api/superadmin/role-permissions`)
- **Email Templates** (partajat cu Administration)

### Rute Sidebar
- `superadmin`
- `superadmin/roles`
- `superadmin/permissions`
- `superadmin/user-roles`
- `superadmin/role-permissions`
- `superadmin/email-templates`

### Pagini Dashboard
Toate resursele au pagini dedicate

### Permisiuni Recomandate
```
superadmin.roles.view
superadmin.roles.create
superadmin.roles.update
superadmin.roles.delete

superadmin.permissions.view
superadmin.permissions.create
superadmin.permissions.update
superadmin.permissions.delete
superadmin.permissions.bulkDelete

superadmin.userRoles.view
superadmin.userRoles.assign
superadmin.userRoles.remove

superadmin.rolePermissions.view
superadmin.rolePermissions.assign
superadmin.rolePermissions.remove
```

---

## REZUMAT PERMISIUNI NECESARE

### Module cu Permisiuni Complete Recomandate: 13

1. **Registratura**: ~20 permisiuni
2. **Accounting**: ~40 permisiuni
3. **Administration**: ~30 permisiuni
4. **Events**: ~25 permisiuni
5. **Parishioners**: ~20 permisiuni
6. **Catechesis**: ~15 permisiuni
7. **Pilgrimages**: ~35 permisiuni
8. **Pangare**: ~10 permisiuni
9. **Online Forms**: ~15 permisiuni
10. **Chat**: ~5 permisiuni
11. **Analytics**: ~3 permisiuni
12. **Data Statistics**: ~4 permisiuni
13. **Superadmin**: ~12 permisiuni

**Total estimat: ~234 permisiuni noi**

### Module Deferite (nu au implementare completă)

1. **Library**: Schema DB există dar nu are UI/API implementat
2. **Partners**: API există dar nu are UI implementat

---

## PATTERN PERMISIUNI

### Format Recomandat
```
{module}.{resource}.{action}
```

### Acțiuni Standard
- `view` - Vizualizare/citire
- `create` - Creare
- `update` - Actualizare
- `delete` - Ștergere

### Acțiuni Speciale (după caz)
- `manage` - Gestionare completă
- `approve` - Aprobare
- `reject` - Respingere
- `export` - Export date
- `import` - Import date
- `send` - Trimitere
- `print` - Tipărire
- `assign` - Atribuire
- `remove` - Eliminare
- etc.

---

## NEXT STEPS

1. ✅ Analiza completă (acest document)
2. ⏭️ Creare fișiere TypeScript pentru permisiuni
3. ⏭️ Creare migration SQL pentru toate permisiunile
4. ⏭️ Actualizare index permisiuni
5. ⏭️ Actualizare pagină permisiuni superadmin

---

## NOTE IMPORTANTE

1. **Library și Partners** nu au implementare completă - NU adăuga permisiuni pentru ele până când nu sunt implementate
2. **Online Forms** și **Mapping Datasets** sunt duplicate între Registry și Online Forms - folosește un singur set de permisiuni
3. **Pangare** partajează multe resurse cu Accounting - asigură-te că nu duplici permisiuni
4. **Fixed Assets** este în both Accounting și Pangare sections - folosește un singur set de permisiuni
5. **Email Templates** apare în both Administration și Superadmin - folosește un singur set de permisiuni (administration.emailTemplates)


