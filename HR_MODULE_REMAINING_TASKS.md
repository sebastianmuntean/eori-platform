# Plan Implementare - Teme Rămase pentru Modulul HR

Acest document descrie task-urile rămase pentru finalizarea completă a modulului HR, după implementarea de bază.

## Status Curent

✅ **Complet implementat:**
- Scheme baza de date (toate tabelele HR)
- API Routes (CRUD + endpoints speciale pentru toate entitățile)
- Hooks React (useEmployees, usePositions, useContracts, useSalaries, etc.)
- Pagini principale (Employees, Positions, Contracts, Salaries, Time Tracking, Reports)
- HR Dashboard
- Traduceri (ro/en/it)
- Navigation în Sidebar
- Logică calculare salarii (endpoint calculate)
- Workflows aprobare (approve/reject endpoints în API)

⏳ **Rămâne de implementat:**

---

## 1. Permisiuni RBAC pentru HR Module

### 1.1. Definiție Permisiuni

Permisiunile trebuie adăugate în baza de date conform pattern-ului existent (`database/seed.ts`).

**Permisiuni necesare:**

```typescript
// Employees
hr.employees.view
hr.employees.create
hr.employees.update
hr.employees.delete

// Positions
hr.positions.view
hr.positions.create
hr.positions.update
hr.positions.delete

// Employment Contracts
hr.contracts.view
hr.contracts.create
hr.contracts.update
hr.contracts.delete
hr.contracts.renew
hr.contracts.terminate

// Salaries
hr.salaries.view
hr.salaries.create
hr.salaries.update
hr.salaries.delete
hr.salaries.calculate
hr.salaries.approve
hr.salaries.pay

// Time Entries
hr.timeEntries.view
hr.timeEntries.create
hr.timeEntries.update
hr.timeEntries.delete
hr.timeEntries.approve

// Leave Types
hr.leaveTypes.view
hr.leaveTypes.create
hr.leaveTypes.update
hr.leaveTypes.delete

// Leave Requests
hr.leaveRequests.view
hr.leaveRequests.create
hr.leaveRequests.update
hr.leaveRequests.delete
hr.leaveRequests.approve
hr.leaveRequests.reject

// Evaluations
hr.evaluations.view
hr.evaluations.create
hr.evaluations.update
hr.evaluations.delete
hr.evaluations.acknowledge

// Evaluation Criteria
hr.evaluationCriteria.view
hr.evaluationCriteria.create
hr.evaluationCriteria.update
hr.evaluationCriteria.delete

// Training Courses
hr.trainingCourses.view
hr.trainingCourses.create
hr.trainingCourses.update
hr.trainingCourses.delete

// Employee Training
hr.employeeTraining.view
hr.employeeTraining.create
hr.employeeTraining.update
hr.employeeTraining.delete
hr.employeeTraining.complete

// Employee Documents
hr.documents.view
hr.documents.create
hr.documents.update
hr.documents.delete
hr.documents.download

// Reports
hr.reports.view
hr.reports.export
```

### 1.2. Implementare

**Opțiunea 1: SQL Migration**
- Creați fișier SQL `0049_add_hr_permissions.sql`
- INSERT statements pentru toate permisiunile HR
- Adăugare permisiuni la rolurile existente (admin, moderator, etc.)

**Opțiunea 2: Seed Script**
- Actualizare `database/seed.ts` cu permisiunile HR
- Adăugare în `rolePermissionMappings`

**Opțiunea 3: Manual**
- Adăugare manuală prin UI-ul de administrare (Superadmin > Permissions)

### 1.3. Integrare în API Routes

Adăugare verificare permisiuni în toate endpoint-urile HR:

```typescript
// Exemplu în src/app/api/hr/employees/route.ts
import { checkPermission } from '@/lib/auth';

export async function POST(request: Request) {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const hasPermission = await checkPermission('hr.employees.create');
  if (!hasPermission) {
    return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
  }
  
  // ... rest of code
}
```

---

## 2. Notificări Email pentru Evenimente HR

### 2.1. Evenimente Care Necesită Notificări

- **Leave Requests:**
  - Notificare manager când se creează o cerere de concediu
  - Notificare angajat când cererea este aprobată/respinsă

- **Time Entries:**
  - Notificare manager când există pontaje neaprobate
  - Notificare angajat când pontajul este aprobat

- **Salaries:**
  - Notificare angajat când salariul este calculat/aprobat/plătit

- **Contracts:**
  - Notificare angajat când contractul este creat/modificat/reînnoit/terminat

- **Evaluations:**
  - Notificare angajat când o evaluare este completată
  - Reminder pentru evaluator să completeze evaluarea

- **Training:**
  - Notificare angajat când este înscris într-un curs
  - Reminder pentru cursuri în desfășurare

### 2.2. Implementare

**Fișiere necesare:**
- `src/lib/notifications/hr.ts` - Funcții helper pentru notificări HR
- `src/lib/email-templates/hr/` - Șabloane email pentru HR
- Integrare în API routes (după acțiuni: approve, reject, create, etc.)

**Pattern de implementare:**
```typescript
// src/lib/notifications/hr.ts
export async function notifyLeaveRequestCreated(leaveRequestId: string) {
  // Get leave request with employee and manager
  // Get email template
  // Send email to manager
}

export async function notifyLeaveRequestApproved(leaveRequestId: string) {
  // Send email to employee
}
```

**Integrare în API:**
```typescript
// src/app/api/hr/leave-requests/[id]/approve/route.ts
import { notifyLeaveRequestApproved } from '@/lib/notifications/hr';

export async function POST(...) {
  // ... approve logic
  await notifyLeaveRequestApproved(id);
  // ...
}
```

---

## 3. Componente UI Avansate

### 3.1. Formulare Complexe

**Fișiere necesare:**
- `src/components/hr/EmployeeForm.tsx` - Formular complet pentru Employee (creare/editare)
- `src/components/hr/ContractForm.tsx` - Formular pentru Contract
- `src/components/hr/SalaryForm.tsx` - Formular pentru Salary
- `src/components/hr/TimeEntryForm.tsx` - Formular pentru Time Entry
- `src/components/hr/LeaveRequestForm.tsx` - Formular pentru Leave Request
- `src/components/hr/EvaluationForm.tsx` - Formular pentru Evaluation

**Funcționalități:**
- Validare completă (Zod schemas)
- Auto-complete pentru câmpuri (departments, positions, etc.)
- Upload documente (pentru employee documents)
- Calcul automat (salarii, zile concediu, etc.)

### 3.2. Tabele Avansate

**Fișiere necesare:**
- `src/components/hr/EmployeesTable.tsx` - Tabel cu filtrare, sortare, paginare
- `src/components/hr/SalariesTable.tsx` - Tabel pentru salarii cu filtre
- `src/components/hr/TimeEntriesTable.tsx` - Tabel pentru pontaje
- `src/components/hr/LeaveRequestsTable.tsx` - Tabel pentru cereri concediu

**Funcționalități:**
- Filtrare avansată (parish, department, status, date range)
- Sortare pe multiple coloane
- Paginare cu page size configurable
- Bulk actions (approve multiple, export, etc.)
- Export Excel/CSV

### 3.3. Widget-uri Dashboard

**Fișiere necesare:**
- `src/components/hr/widgets/EmployeeStatsWidget.tsx`
- `src/components/hr/widgets/SalarySummaryWidget.tsx`
- `src/components/hr/widgets/AttendanceWidget.tsx`
- `src/components/hr/widgets/PendingApprovalsWidget.tsx`
- `src/components/hr/widgets/UpcomingEventsWidget.tsx` (birthdays, contract expirations, etc.)

---

## 4. Rapoarte UI Avansate cu Export

### 4.1. Rapoarte Disponibile

1. **Employee Report**
   - Lista angajaților cu filtre (parish, department, status)
   - Export Excel/PDF

2. **Salary Report**
   - Raport salarii pe perioadă
   - Breakdown pe componente
   - Export Excel/PDF

3. **Attendance Report**
   - Prezență/absenteism pe perioadă
   - Overtime hours
   - Export Excel/PDF

4. **Leave Balance Report**
   - Solduri concediu pe angajat/tip concediu
   - Export Excel/PDF

5. **Evaluation Report**
   - Evaluări pe perioadă
   - Scoruri medii
   - Export Excel/PDF

6. **Training Report**
   - Cursuri finalizate/în desfășurare
   - Export Excel/PDF

### 4.2. Implementare Export

**Biblioteci necesare:**
- `exceljs` (deja instalat) - pentru Excel
- `pdfkit` sau `@react-pdf/renderer` - pentru PDF

**Fișiere necesare:**
- `src/lib/reports/hr/excel.ts` - Funcții pentru generare Excel
- `src/lib/reports/hr/pdf.ts` - Funcții pentru generare PDF
- `src/app/api/hr/reports/[type]/export/route.ts` - Endpoint pentru export

---

## 5. Pagini Detail View

### 5.1. Pagini Detail Necessare

- `src/app/[locale]/dashboard/hr/employees/[id]/page.tsx` - Employee detail
- `src/app/[locale]/dashboard/hr/contracts/[id]/page.tsx` - Contract detail
- `src/app/[locale]/dashboard/hr/salaries/[id]/page.tsx` - Salary detail

**Funcționalități:**
- Vizualizare completă date
- Tabs pentru informații conexe (contracts, salaries, documents, etc.)
- Acțiuni rapide (edit, delete, approve, etc.)
- Timeline/history

---

## 6. Validări și Business Logic Avansate

### 6.1. Validări CNP

- Implementare validare CNP românesc
- Verificare unicat în sistem

### 6.2. Calcul Salarii Avansat

- Integrare rate impozite/social security (configurabile)
- Calcul automat bazat pe contract și zile lucrate
- Suport pentru multiple componente salariale

### 6.3. Validări Leave Requests

- Verificare solduri disponibile
- Verificare overlapping requests
- Reguli business (min/max days, approval workflow)

---

## 7. Audit Logging

### 7.1. Integrare cu Audit Logs

- Logging toate operațiunile HR (create, update, delete)
- Logging acțiuni speciale (approve, reject, pay, etc.)
- Tracking schimbări (who, when, what changed)

**Implementare:**
- Folosirea sistemului de audit logs existent
- Adăugare entries în `audit_logs` table pentru fiecare acțiune HR

---

## 8. Bulk Operations

### 8.1. Bulk Import Time Entries

- Import Excel pentru pontaje
- Validare și procesare batch
- Report erori

### 8.2. Bulk Actions

- Bulk approve/reject leave requests
- Bulk approve time entries
- Bulk export (salaries, employees, etc.)

---

## 9. Calendar/Calendar Views

### 9.1. Calendar pentru Leave Requests

- Vizualizare calendar cu concedii aprobate
- Overlay pentru multiple angajați
- Highlight pentru conflicte

### 9.2. Calendar pentru Time Entries

- Vizualizare calendar cu pontaje
- Color coding pentru status (present, absent, holiday, etc.)

---

## 10. Document Management Enhancement

### 10.1. Features Avansate

- Preview documente (PDF, images)
- Versioning documente
- Expiry date reminders
- Confidential access control

---

## Prioritate Implementare

### 🔴 High Priority (Necesare pentru funcționalitate de bază)
1. Permisiuni RBAC (Secțiunea 1)
2. Formulare de bază (Secțiunea 3.1 - Employee, Contract, Salary)
3. Tabele de bază cu filtrare (Secțiunea 3.2 - EmployeesTable)

### 🟡 Medium Priority (Îmbunătățiri importante)
4. Detail Views (Secțiunea 5)
5. Rapoarte UI cu export Excel (Secțiunea 4)
6. Validări avansate (Secțiunea 6)

### 🟢 Low Priority (Nice to have)
7. Notificări email (Secțiunea 2)
8. Widget-uri dashboard (Secțiunea 3.3)
9. Calendar views (Secțiunea 9)
10. Bulk operations (Secțiunea 8)
11. Document management enhancement (Secțiunea 10)
12. Audit logging (Secțiunea 7)

---

## Note

- Migrațiile SQL sunt gata în `database/migrations/0048_add_hr_module.sql` - **APLICĂ MANUAL**
- Toate API routes-urile sunt implementate și funcționale
- Hooks-urile sunt gata pentru utilizare
- Paginile de bază există și pot fi îmbunătățite incremental

**Următorul pas:** Aplicați migrația SQL `0048_add_hr_module.sql` în baza de date și începeți implementarea permisiunilor RBAC.







