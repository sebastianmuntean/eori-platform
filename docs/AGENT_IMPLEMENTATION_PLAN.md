# 🏗️ Plan de Implementare - EORI Next.js 16 + PostgreSQL + Drizzle

**Versiune:** 1.0  
**Data:** 31 Decembrie 2025  
**Destinatar:** Agent AI pentru implementare  
**Stack:** Next.js 16 + PostgreSQL + Drizzle ORM

---

## 📋 Context General

Ai acces doar la repo-ul nou (Next.js 16 + PostgreSQL + Drizzle). Implementezi funcționalitățile EORI DB-first, bazându-te pe arhitectura și pattern-urile definite în repo-ul legacy.

### Ce face aplicația EORI?

EORI = **Sistem de Administrare Episcopie** - o aplicație multi-tenant pentru gestionarea:
- Parohiilor și enoriașilor
- Cimitirelor și concesiunilor
- Registraturii (documente intrare/ieșire)
- Contabilității (încasări, plăți, chitanțe, facturi)
- Bibliotecii parohiale
- Parcului auto
- Gestiunilor și inventarului (pangar, materiale)
- Mijloacelor fixe (imobile, bunuri culturale)
- HR (angajați, concedii, pontaje)

---

## 🔐 Reguli Obligatorii (NU LE ÎNCĂLCA)

### 1. UUID Primary Keys Peste Tot
```typescript
// ✅ CORECT
id: uuid('id').defaultRandom().primaryKey()

// ❌ GREȘIT
id: serial('id').primaryKey()
```

### 2. Convenții de Denumire
```typescript
// Database: snake_case
parish_id, created_at, user_roles

// TypeScript: camelCase
parishId, createdAt, userRoles
```

### 3. Multi-Tenant Strict
**TOATE tabelele operaționale** au `parish_id`:
```typescript
// ✅ CORECT - Toate operațiunile filtrează după parish_id
const documents = await db.query.documents.findMany({
  where: eq(documents.parishId, currentParishId)
});

// ❌ GREȘIT - Query fără parish_id
const documents = await db.query.documents.findMany();
```

### 4. Câmpuri de Audit Standard
Fiecare tabel operațional are:
```typescript
createdAt: timestamp('created_at').defaultNow().notNull(),
createdBy: uuid('created_by').references(() => users.id),
updatedAt: timestamp('updated_at').defaultNow().notNull(),
updatedBy: uuid('updated_by').references(() => users.id),
deletedAt: timestamp('deleted_at'), // Soft delete unde are sens
```

### 5. Unicități pe Parohie
```typescript
// Constraint compus pentru unicitate pe tenant
.unique(['parish_id', 'code'])
.unique(['parish_id', 'year', 'direction', 'number'])
```

### 6. Indexuri Tenant-Aware
```typescript
// Index principal pentru filtrare
.index('idx_documents_parish_created', ['parish_id', 'created_at'])
// Indexuri specifice per modul
.index('idx_concessions_parish_expiry', ['parish_id', 'expiry_date'])
```

---

## 📐 Arhitectură Ierarhică Multi-Tenant

```
DIOCEZĂ (Episcopie)
    └── PROTOPOPIATE (Deaneries)
            └── PAROHII (Parishes) ← Unitatea de tenant
                    ├── Enoriași
                    ├── Cimitire → Parcele → Rânduri → Locuri
                    ├── Documente (Registratură)
                    ├── Tranzacții Financiare
                    ├── Gestiuni → Stocuri
                    ├── Bibliotecă → Cărți
                    ├── Parc Auto → Vehicule
                    └── Mijloace Fixe
```

**Reguli de vizibilitate:**
- **Paroh** → Vede/editează DOAR parohia lui
- **Admin Protopopiat** → Vede toate parohiile din protopopiat
- **Admin Diecezan** → Vede toate parohiile din dieceză
- **Super Admin (Episcop)** → Acces complet

---

## 🗄️ Ordine de Implementare (DB-First, Minim Risc)

### FAZA 1: Core + RBAC + Multi-Tenant (FUNDAȚIA) ✅ IMPLEMENTED

- [x] Dioceses table
- [x] Deaneries table (Protopopiate)
- [x] Parishes table (actualizat cu diocese_id, deanery_id)
- [x] Users table (actualizat cu câmpuri noi)
- [x] Roles, Permissions, RolePermissions, UserRoles
- [x] UserParishes (mapare user -> parohii accesibile)
- [x] UserPermissionOverrides
- [x] Sessions table
- [x] Seed data pentru RBAC

### FAZA 2: Partners (Entitate Transversală) ✅ IMPLEMENTED

- [x] Partners table cu toate tipurile (person, company, supplier, donor, employee, parishioner)
- [x] Indexuri pentru performanță

### FAZA 3: Registratură (Documents) + Numerotare Atomică ✅ IMPLEMENTED

- [x] Documents table cu numerotare
- [x] DocumentNumberCounters pentru numerotare atomică
- [x] Attachments table (polimorfică)
- [x] Funcție getNextDocumentNumber

### FAZA 4: Cimitir + Concesiuni + Expirări ✅ IMPLEMENTED

- [x] Cemeteries table
- [x] CemeteryParcels table
- [x] CemeteryRows table
- [x] CemeteryGraves table
- [x] Concessions table
- [x] ConcessionPayments table
- [x] Burials table

### FAZA 5: Financiar (RIP) + Facturi ✅ IMPLEMENTED

- [x] Accounts table (plan de conturi)
- [x] Transactions table
- [x] Invoices table
- [x] InvoiceItems table
- [x] InvoicePayments table
- [x] ReceiptSeries table

### FAZA 6: Inventar / Gestiune / Pangar ✅ IMPLEMENTED

- [x] Warehouses table
- [x] Products table
- [x] StockLots table (pentru FIFO/LIFO)
- [x] StockMovements table
- [x] Sales table
- [x] SaleItems table

### FAZA 7: Module Secundare ✅ IMPLEMENTED

- [x] Library (Authors, Publishers, Domains, Books, Loans)
- [x] Fleet (Vehicles, VehicleInsurances, VehicleInspections, VehicleRepairs)
- [x] Fixed Assets
- [x] HR (Employees, Leaves, Timesheets)

### Cross-Cutting ✅ IMPLEMENTED

- [x] ParishSettings table
- [x] ActivityLog table
- [x] Notifications table

---

## ✅ Definition of Done

### Pentru fiecare modul:
- [x] Schema Drizzle completă cu FK, unicități, indexuri
- [x] `parish_id` pe toate tabelele operaționale
- [x] Toate query-urile filtrează după `parish_id`
- [x] Câmpuri de audit (`created_at`, `created_by`, etc.)
- [x] Indexuri pentru query-uri frecvente
- [x] Seed data pentru testare

### Pentru proiect:
- [x] Numerotarea la registratură e atomică (tranzacție)
- [x] Concesiunile suportă expirări + listare eficientă
- [x] Sistemul RBAC e funcțional cu permisiuni pe parohie
- [x] Activity log pentru operațiuni critice
- [x] Notificări pentru expirări și scadențe
- [x] `docs/AGENT_IMPLEMENTATION_PLAN.md` actualizat cu deciziile luate

---

## 📝 Convenții de Cod

### Structura Fișierelor
```
drizzle/
├── schema/
│   ├── core/          # dioceses, deaneries, parishes, partners
│   ├── auth/          # users, roles, permissions
│   ├── documents/     # documents, attachments
│   ├── cemetery/      # cemeteries, concessions
│   ├── accounting/    # accounts, transactions, invoices
│   ├── inventory/     # warehouses, products, movements
│   ├── library/       # books, loans
│   ├── fleet/         # vehicles, insurances
│   ├── assets/        # fixed_assets
│   ├── hr/            # employees, leaves
│   ├── settings/      # parish_settings
│   ├── audit/         # activity_log
│   └── notifications/ # notifications
```

---

## 📚 Resurse

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Notă finală:** Acest plan este un ghid, nu o specificație rigidă. Adaptează-l în funcție de cerințele specifice și feedback-ul utilizatorilor. Documentează toate deciziile majore în acest fișier pentru referință viitoare.
