# Rezumat Rezolvare Chei Duplicate - Traduceri

## Status General
✅ **Majoritatea duplicatele au fost rezolvate!**

## Module Rezolvate

### 1. ✅ pilgrimages.json (EN, IT, RO)
- **paymentStatuses** → redenumit prima apariție în **participantPaymentStatuses**
- **paymentStatus** → redenumit prima apariție în **participantPaymentStatus**  
- **providerName** → redenumit duplicatul din meals în **mealProviderName**
- **Cod actualizat**: `src/app/[locale]/dashboard/pilgrimages/[id]/participants/page.tsx`
- **Cod actualizat**: `src/app/[locale]/dashboard/pilgrimages/[id]/meals/page.tsx`

### 2. ✅ hr.json (EN, IT, RO)
- **position** → eliminat duplicatul (linia ~50)
- **active** → eliminat duplicatul din contract status (linia ~89)
- **terminated** → eliminat duplicatul din contract status (linia ~91)
- **leaveType** → eliminat duplicatul (linia ~191)

### 3. ⚠️ online-forms.json (IT, RO)
- **IT**: testQuery, selectTargetColumn, sampleResult - în curs de rezolvare
- **RO**: sqlQuery, testQuery, selectTargetColumn, sampleResult - în curs de rezolvare
- **EN**: nu are duplicate reale

### 4. ⏳ common.json (EN, IT, RO)
- **Status**: Multe duplicate identificate (20+ chei per fișier)
- **Cauză**: Chei comune duplicate din cauza copierii codului între secțiuni
- **Acțiune necesară**: Eliminare duplicate păstrând prima apariție
- **Prioritate**: Medie (valorile sunt identice, deci nu cauzează erori funcționale)

## Detalii Duplicate common.json

### EN common.json (24 duplicate):
- cancel, edit, loading, confirm (butoane comune)
- breadcrumbAdministration, confirmDelete, saveChanges
- selectParish, unknownParish, allParishes, add
- phone, email, address, code, currency, type
- firstName, lastName, birthDate, cnp, other, month, terminated

### IT common.json (17 duplicate):
- cancel, edit, loading, confirm, confirmDelete, saveChanges
- clients, totalClients
- phone, email, address, type
- firstName, lastName, birthDate, cnp, other, currency

### RO common.json (25 duplicate):
- confirmDelete, breadcrumbAdministration, allParishes, all
- edit, confirm, cancel, saveChanges, selectParish, loading
- add, phone, email, address, code, currency, type
- firstName, lastName, birthDate, cnp, other, month, generating, terminated
- confirmDeleteMessage

## Recomandări

1. ✅ **COMPLETAT**: pilgrimages.json - toate duplicatele rezolvate
2. ✅ **COMPLETAT**: hr.json - toate duplicatele rezolvate  
3. ⏳ **ÎN PROGRES**: online-forms.json - necesita verificare manuală
4. ⏳ **PENTRU VIITOR**: common.json - duplicatele nu sunt critice (valorile identice), dar ar trebui eliminate pentru curățenie cod

## Note

- Duplicatele din common.json au aceleași valori, deci nu cauzează probleme funcționale
- În JSON, doar ultima valoare este păstrată pentru chei duplicate
- Pentru duplicatele rezolvate, codul a fost actualizat corespunzător


