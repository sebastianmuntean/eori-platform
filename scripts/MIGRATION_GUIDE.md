# Ghid de Migrare către Vercel Neon

Acest ghid explică cum să migrezi toate datele din baza de date locală către Vercel Neon.

## ⚠️ ATENȚIE

**Această operațiune va șterge TOATE datele existente din baza de date Neon și le va înlocui cu datele din baza de date locală!**

Asigură-te că:
- Ai o copie de siguranță a datelor din Neon (dacă sunt importante)
- Ai acces la ambele baze de date
- Ai connection strings-urile corecte

## Metoda 1: Folosind Vercel CLI (Cel mai Simplu - Recomandat)

Dacă ai Vercel CLI instalat și ești logat, poți folosi script-ul care obține automat connection string-ul de pe Vercel:

```powershell
.\scripts\migrate-to-neon-vercel.ps1
```

Script-ul va:
1. Verifică dacă ești logat în Vercel CLI
2. Obține automat connection string-ul Neon de pe Vercel (POSTGRES_URL)
3. Te va întreba doar pentru connection string-ul bazei de date locale (DATABASE_URL)
4. Va afișa un avertisment și va cere confirmare
5. Va rula migrarea

**Notă:** Dacă nu ai Vercel CLI instalat, instalează-l cu: `npm i -g vercel`

## Metoda 2: Folosind Script-ul Helper Manual

Dacă preferi să introduci manual connection strings-urile:

```powershell
.\scripts\migrate-to-neon-helper.ps1
```

Script-ul va:
1. Te va întreba pentru connection string-ul bazei de date locale (DATABASE_URL)
2. Te va întreba pentru connection string-ul bazei de date Neon (NEON_DATABASE_URL sau POSTGRES_URL)
3. Va afișa un avertisment și va cere confirmare
4. Va rula migrarea

## Metoda 3: Rulare Directă cu Variabile de Mediu

Poți rula direct script-ul de migrare setând variabilele de mediu:

### PowerShell:
```powershell
$env:DATABASE_URL="postgresql://user:password@localhost:5432/local_db"
$env:NEON_DATABASE_URL="postgresql://user:password@host.neon.tech:5432/neon_db"
npm run migrate:to-neon
```

### Command Prompt (CMD):
```cmd
set DATABASE_URL=postgresql://user:password@localhost:5432/local_db
set NEON_DATABASE_URL=postgresql://user:password@host.neon.tech:5432/neon_db
npm run migrate:to-neon
```

### Bash/Linux/Mac:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/local_db"
export NEON_DATABASE_URL="postgresql://user:password@host.neon.tech:5432/neon_db"
npm run migrate:to-neon
```

## Metoda 4: Folosind un Fișier .env.local

Poți crea un fișier `.env.local` în root-ul proiectului:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/local_db
NEON_DATABASE_URL=postgresql://user:password@host.neon.tech:5432/neon_db
# SAU folosește POSTGRES_URL (standard Vercel):
POSTGRES_URL=postgresql://user:password@host.neon.tech:5432/neon_db
```

Script-ul va citi automat din `.env.local`. Apoi rulează:

```bash
npm run migrate:to-neon
```

**Notă:** Script-ul acceptă automat `POSTGRES_URL` (variabila standard de pe Vercel) ca alternativă la `NEON_DATABASE_URL`.

## Ce Face Script-ul

1. **Descoperă tabelele** din ambele baze de date
2. **Analizează dependențele** (foreign keys) pentru a determina ordinea corectă
3. **Șterge toate datele** din Neon (păstrând structura)
4. **Exportă datele** din baza de date locală
5. **Importă datele** în Neon respectând ordinea corectă a dependențelor
6. **Resetează secvențele** (pentru coloanele serial/identity)
7. **Validează migrarea** și afișează un rezumat

## Obținerea Connection String-ului pentru Vercel Neon

### Opțiunea 1: Folosind Vercel CLI (Recomandat)
Dacă folosești script-ul `migrate-to-neon-vercel.ps1`, connection string-ul este obținut automat.

### Opțiunea 2: Din Vercel Dashboard
1. Mergi la [Vercel Dashboard](https://vercel.com/dashboard)
2. Selectează proiectul tău
3. Mergi la **Storage** → **Neon**
4. Click pe baza de date Neon
5. Găsește **Connection String** în secțiunea de conexiuni
6. Copiază connection string-ul complet

Formatul arată de obicei așa:
```
postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Opțiunea 3: Din Variabilele de Mediu Vercel
Connection string-ul este de obicei disponibil ca `POSTGRES_URL` în variabilele de mediu ale proiectului Vercel. Script-ul acceptă automat această variabilă.

## Verificare După Migrare

După ce migrarea este completă, verifică:

1. **Numărul de înregistrări** - ar trebui să fie același în ambele baze
2. **Relațiile** - verifică că foreign keys-urile sunt corecte
3. **Datele critice** - verifică manual câteva înregistrări importante
4. **Secvențele** - verifică că ID-urile noi vor fi generate corect

## Rezolvarea Problemelor

### Eroare: "DATABASE_URL environment variable is not set"
- Asigură-te că ai setat variabila de mediu sau folosește script-ul helper

### Eroare: "Connection refused" sau "Connection timeout"
- Verifică connection string-urile
- Verifică că bazele de date sunt accesibile
- Pentru Neon, verifică că IP-ul tău nu este blocat (dacă ai IP restrictions)

### Eroare: "Foreign key constraint violation"
- Script-ul ar trebui să gestioneze acest lucru automat
- Dacă apare, verifică ordinea migrării în log-uri

### Date lipsă după migrare
- Verifică log-urile pentru erori
- Verifică dacă există tabele care nu au fost migrate
- Verifică dacă există constrângeri care blochează inserarea

## Suport

Dacă întâmpini probleme, verifică:
- Log-urile detaliate afișate de script
- Rezumatul final al migrării
- Erorile specifice pentru fiecare tabel

