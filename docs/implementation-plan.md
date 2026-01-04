# Plan de Implementare - EORI Platform

## Status Actual

### ✅ Implementat și Funcțional

#### Pagini
- **Administration**:
  - Eparhii (Dioceses) - ✅ Funcțională
  - Protopopiate (Deaneries) - ✅ Funcțională
  - Parohii (Parishes) - ✅ Funcțională
  - Departamente - ⚠️ Placeholder

- **Gestiune**:
  - Parteneri (Partners) - ✅ Funcțională
  - Pangare - ⚠️ Placeholder
  - Facturare - ⚠️ Placeholder
  - Configurari - ⚠️ Placeholder

- **Registratura**:
  - Registrul General - ⚠️ Placeholder

- **Setari**:
  - Utilizatori (Users) - ✅ Funcțională

#### Scheme de Bază de Date
- ✅ Core: `dioceses`, `deaneries`, `parishes`
- ✅ Partners: `partners`
- ✅ Auth: `users`, `sessions`, `roles`, `permissions`, `user_roles`, `role_permissions`
- ✅ Library: `library_authors`, `library_publishers`, `library_domains`, `library_books`, `library_loans`
- ✅ Cemeteries: `cemeteries`, `cemetery_parcels`, `cemetery_rows`, `cemetery_graves`, `cemetery_concessions`, `cemetery_concession_payments`, `burials`
- ✅ Partners: `parishioners`, `parishioner_classifications`
- ✅ Email Templates: `email_templates`

#### API Routes
- ✅ `/api/dioceses` - CRUD complet
- ✅ `/api/deaneries` - CRUD complet
- ✅ `/api/parishes` - CRUD complet
- ✅ `/api/clients` - CRUD complet (migrated from /api/partners)
- ✅ `/api/users` - CRUD + Import/Export
- ✅ `/api/auth/*` - Login, Logout, Me
- ✅ `/api/superadmin/*` - Roles, Permissions, User-Roles, Role-Permissions

#### Hooks
- ✅ `useDioceses`
- ✅ `useDeaneries`
- ✅ `useParishes`
- ✅ `usePartners`
- ✅ `useUsers`
- ✅ `useRoles`, `usePermissions`, `useUserRoles`
- ✅ `useEmailTemplates`

---

## Plan de Implementare - Prioritate

### 🔴 Prioritate Înaltă (Faza 1)

#### 1. Departamente (Administration)
**Status**: Placeholder  
**Scop**: Gestionarea departamentelor din parohii

**Task-uri**:
- [ ] Creează schema `database/schema/core/departments.ts`
  - `id`, `parishId`, `code`, `name`, `description`, `headName`, `phone`, `email`, `isActive`, `createdAt`, `updatedAt`
- [ ] Generează migrația SQL
- [ ] Creează API routes: `/api/departments`
  - `GET /api/departments` - List cu filtrare (parishId, search, pagination)
  - `POST /api/departments` - Create
  - `GET /api/departments/:id` - Get by ID
  - `PUT /api/departments/:id` - Update
  - `DELETE /api/departments/:id` - Delete
- [ ] Creează hook `src/hooks/useDepartments.ts`
- [ ] Implementează pagina `src/app/[locale]/dashboard/modules/administration/departamente/page.tsx`
  - Listare cu tabelă
  - Filtrare după parohie
  - Căutare
  - Modal pentru Create/Edit
  - Ștergere cu confirmare

**Estimare**: 4-6 ore

---

#### 2. Registrul General (Registratura)
**Status**: Placeholder  
**Scop**: Registrul general al documentelor parohiei

**Task-uri**:
- [ ] Creează schema `database/schema/registratura/general_register.ts`
  - `id`, `parishId`, `documentNumber`, `documentType`, `date`, `subject`, `from`, `to`, `description`, `filePath`, `status`, `createdBy`, `createdAt`, `updatedAt`
- [ ] Creează enum pentru `document_type`: 'incoming', 'outgoing', 'internal'
- [ ] Creează enum pentru `status`: 'draft', 'registered', 'archived'
- [ ] Generează migrația SQL
- [ ] Creează API routes: `/api/registratura/general-register`
  - `GET /api/registratura/general-register` - List cu filtrare complexă
  - `POST /api/registratura/general-register` - Create
  - `GET /api/registratura/general-register/:id` - Get by ID
  - `PUT /api/registratura/general-register/:id` - Update
  - `DELETE /api/registratura/general-register/:id` - Delete
  - `POST /api/registratura/general-register/:id/upload` - Upload document
  - `GET /api/registratura/general-register/export` - Export Excel
- [ ] Creează hook `src/hooks/useGeneralRegister.ts`
- [ ] Implementează pagina `src/app/[locale]/dashboard/modules/registratura/registrul-general/page.tsx`
  - Listare cu tabelă avansată
  - Filtrare după: tip document, status, dată, parohie
  - Căutare în toate câmpurile
  - Modal pentru Create/Edit cu upload fișier
  - Vizualizare document
  - Export Excel
  - Paginare

**Estimare**: 8-10 ore

---

### 🟡 Prioritate Medie (Faza 2)

#### 3. Pangare (Gestiune)
**Status**: Placeholder  
**Scop**: Gestionarea pangărilor (plăți) parohiei

**Task-uri**:
- [ ] Creează schema `database/schema/gestiune/payments.ts`
  - `id`, `parishId`, `paymentNumber`, `date`, `type` (income/expense), `category`, `partnerId`, `amount`, `currency`, `description`, `paymentMethod`, `referenceNumber`, `status`, `createdBy`, `createdAt`, `updatedAt`
- [ ] Creează enum pentru `payment_type`: 'income', 'expense'
- [ ] Creează enum pentru `payment_method`: 'cash', 'bank_transfer', 'card', 'check'
- [ ] Creează enum pentru `status`: 'pending', 'completed', 'cancelled'
- [ ] Generează migrația SQL
- [ ] Creează API routes: `/api/gestiune/payments`
  - `GET /api/gestiune/payments` - List cu filtrare
  - `POST /api/gestiune/payments` - Create
  - `GET /api/gestiune/payments/:id` - Get by ID
  - `PUT /api/gestiune/payments/:id` - Update
  - `DELETE /api/gestiune/payments/:id` - Delete
  - `GET /api/gestiune/payments/summary` - Sumar (total income/expense per period)
  - `GET /api/gestiune/payments/export` - Export Excel
- [ ] Creează hook `src/hooks/usePayments.ts`
- [ ] Implementează pagina `src/app/[locale]/dashboard/modules/gestiune/pangare/page.tsx`
  - Listare cu tabelă
  - Filtrare după: tip, categorie, perioadă, status
  - Dashboard cu sumar (total venituri/cheltuieli)
  - Grafic pentru evoluție (opțional)
  - Modal pentru Create/Edit
  - Export Excel
  - Paginare

**Estimare**: 8-10 ore

---

#### 4. Facturare (Gestiune)
**Status**: Placeholder  
**Scop**: Gestionarea facturilor (emise și primite)

**Task-uri**:
- [ ] Creează schema `database/schema/gestiune/invoices.ts`
  - `id`, `parishId`, `invoiceNumber`, `type` (issued/received), `date`, `dueDate`, `partnerId`, `amount`, `vat`, `total`, `currency`, `status`, `paymentDate`, `description`, `items` (JSON), `createdBy`, `createdAt`, `updatedAt`
- [ ] Creează enum pentru `invoice_type`: 'issued', 'received'
- [ ] Creează enum pentru `status`: 'draft', 'sent', 'paid', 'overdue', 'cancelled'
- [ ] Generează migrația SQL
- [ ] Creează API routes: `/api/gestiune/invoices`
  - `GET /api/gestiune/invoices` - List cu filtrare
  - `POST /api/gestiune/invoices` - Create
  - `GET /api/gestiune/invoices/:id` - Get by ID
  - `PUT /api/gestiune/invoices/:id` - Update
  - `DELETE /api/gestiune/invoices/:id` - Delete
  - `POST /api/gestiune/invoices/:id/mark-paid` - Marchează ca plătită
  - `GET /api/gestiune/invoices/:id/pdf` - Generează PDF
  - `GET /api/gestiune/invoices/export` - Export Excel
- [ ] Creează hook `src/hooks/useInvoices.ts`
- [ ] Implementează pagina `src/app/[locale]/dashboard/modules/gestiune/facturare/page.tsx`
  - Listare cu tabelă
  - Filtrare după: tip, status, perioadă, partener
  - Dashboard cu sumar (facturi neplătite, totale)
  - Modal pentru Create/Edit cu items (tabelă dinamică)
  - Vizualizare/Download PDF
  - Export Excel
  - Paginare

**Estimare**: 10-12 ore

---

#### 5. Configurari (Gestiune)
**Status**: Placeholder  
**Scop**: Configurări generale pentru modulul de gestiune

**Task-uri**:
- [ ] Creează schema `database/schema/gestiune/settings.ts`
  - `id`, `parishId`, `key`, `value` (JSON), `category`, `description`, `createdAt`, `updatedAt`
- [ ] Generează migrația SQL
- [ ] Creează API routes: `/api/gestiune/settings`
  - `GET /api/gestiune/settings` - List toate setările
  - `GET /api/gestiune/settings/:key` - Get by key
  - `PUT /api/gestiune/settings/:key` - Update by key
  - `POST /api/gestiune/settings` - Create new setting
- [ ] Creează hook `src/hooks/useGestiuneSettings.ts`
- [ ] Implementează pagina `src/app/[locale]/dashboard/modules/gestiune/configurari/page.tsx`
  - Formular cu secțiuni (Categorii, Conturi bancare, Monede, etc.)
  - Salvare automată sau manuală
  - Validare

**Estimare**: 4-6 ore

---

### 🟢 Prioritate Scăzută (Faza 3)

#### 6. Funcționalități Avansate pentru Module Existente

**Parishes (Parohii)**:
- [ ] Adaugă upload logo/imagine parohie
- [ ] Adaugă hartă cu locația (folosind latitude/longitude)
- [ ] Adaugă statistici (număr parohieni, evenimente, etc.)

**Partners (Parteneri)**:
- [ ] Adaugă istoric tranzacții
- [ ] Adaugă documente atașate
- [ ] Adaugă notificări pentru evenimente importante

**Users (Utilizatori)**:
- [ ] Adaugă resetare parolă prin email
- [ ] Adaugă verificare email
- [ ] Adaugă 2FA (Two-Factor Authentication)

---

#### 7. Integrare Module Existente

**Library**:
- [ ] Implementează paginile pentru bibliotecă
- [ ] Adaugă în meniu
- [ ] Creează API routes și hooks

**Cemeteries**:
- [ ] Implementează paginile pentru cimitire
- [ ] Adaugă în meniu
- [ ] Creează API routes și hooks

**Parishioners**:
- [ ] Implementează paginile pentru enoriași
- [ ] Adaugă în meniu
- [ ] Creează API routes și hooks

---

## Structura de Implementare Recomandată

### Pentru fiecare modul nou:

1. **Schema de Bază de Date** (1-2 ore)
   - Definește structura tabelului
   - Adaugă enums dacă e necesar
   - Generează migrația SQL
   - Rulează migrația manual

2. **API Routes** (2-3 ore)
   - Creează `/api/[module]/[entity]/route.ts`
   - Implementează GET (list), POST (create)
   - Implementează `/api/[module]/[entity]/[id]/route.ts`
   - Implementează GET (by ID), PUT (update), DELETE (delete)
   - Adaugă validare cu Zod
   - Adaugă error handling

3. **Hook** (1-2 ore)
   - Creează `src/hooks/use[Entity].ts`
   - Implementează funcții pentru CRUD
   - Adaugă state management
   - Adaugă error handling

4. **Pagina UI** (3-4 ore)
   - Creează pagina cu listare
   - Adaugă filtrare și căutare
   - Adaugă modal pentru Create/Edit
   - Adaugă ștergere cu confirmare
   - Adaugă paginare
   - Adaugă traduceri

5. **Testare** (1-2 ore)
   - Testează toate operațiile CRUD
   - Testează validările
   - Testează error handling
   - Testează UI/UX

---

## Estimare Totală

- **Faza 1** (Prioritate Înaltă): ~12-16 ore
- **Faza 2** (Prioritate Medie): ~22-28 ore
- **Faza 3** (Prioritate Scăzută): ~30-40 ore

**Total**: ~64-84 ore de dezvoltare

---

## Note Importante

1. **Migrații**: Toate migrațiile trebuie generate cu `npm run db:generate` și rulate manual de utilizator
2. **Validare**: Folosește Zod pentru validarea datelor în API routes
3. **Error Handling**: Implementează error handling consistent în toate API routes
4. **Traduceri**: Adaugă traduceri în `src/locales/ro/` și `src/locales/en/`
5. **TypeScript**: Asigură-te că toate tipurile sunt corect definite
6. **Multi-tenant**: Toate tabelele operaționale trebuie să aibă `parishId`
7. **Audit**: Adaugă `createdAt`, `updatedAt`, `createdBy`, `updatedBy` unde e necesar

---

## Următorii Pași

1. **Începe cu Departamente** (Faza 1, Task 1)
2. **Continuă cu Registrul General** (Faza 1, Task 2)
3. **Implementează Pangare** (Faza 2, Task 3)
4. **Implementează Facturare** (Faza 2, Task 4)
5. **Finalizează cu Configurari** (Faza 2, Task 5)




