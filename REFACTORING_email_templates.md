# Refactoring: Remove Hardcoded HTML Fallbacks from Email Functions

## Overview

Refactored email sending functions to require email templates from the database instead of using hardcoded HTML fallbacks. This ensures consistency and makes all emails customizable through the template system.

**Date:** 2024-12-19  
**Related Review:** CODE_REVIEW_email_consistency.md

---

## Changes Made

### 1. Created SQL Seed File

**File:** `database/seeds/0032_ensure_email_templates_required.sql`

Created a SQL script that ensures both required email templates exist in the database:
- **"Confirmare Cont"** - User account confirmation email
- **"Cod Validare Formular"** - Form validation code email

The script uses idempotent logic (checks if templates exist before inserting) so it can be run safely multiple times.

**Usage:**
```bash
# Run this SQL script manually on your database before deploying the code changes
psql -d your_database -f database/seeds/0032_ensure_email_templates_required.sql
```

### 2. Refactored `sendUserConfirmationEmail()`

**File:** `src/lib/email.ts`

**Changes:**
- ✅ Removed `generateConfirmationEmailHTML()` function (no longer needed)
- ✅ Removed hardcoded HTML fallback logic
- ✅ Now requires "Confirmare Cont" template to exist
- ✅ Throws clear error if template is not found
- ✅ Updated function documentation to reflect template requirement

**Before:**
```typescript
// Had fallback to hardcoded HTML if template not found
if (template) {
  await sendEmailWithTemplate(...);
  return;
}
// Fallback code with generateConfirmationEmailHTML()
```

**After:**
```typescript
// Template is required - no fallback
const template = await getTemplateByName('Confirmare Cont');
if (!template) {
  throw new Error('Email template "Confirmare Cont" not found...');
}
await sendEmailWithTemplate(...);
```

### 3. Refactored `sendValidationCodeEmail()`

**File:** `src/lib/online-forms/email-validation.ts`

**Changes:**
- ✅ Removed hardcoded HTML fallback logic
- ✅ Removed unused Brevo imports (`* as brevo`, `SENDER_EMAIL`, `SENDER_NAME`)
- ✅ Now requires "Cod Validare Formular" template to exist
- ✅ Throws clear error if template is not found
- ✅ Simplified code by removing direct Brevo API usage

**Before:**
```typescript
// Had fallback to hardcoded HTML if template not found
if (template) {
  await sendEmailWithTemplate(...);
  return;
}
// Fallback code with direct SendSmtpEmail usage
```

**After:**
```typescript
// Template is required - no fallback
const template = await getTemplateByName('Cod Validare Formular');
if (!template) {
  throw new Error('Email template "Cod Validare Formular" not found...');
}
await sendEmailWithTemplate(...);
```

---

## Benefits

1. **Consistency** - All emails now use the same template system
2. **Maintainability** - Email content can be changed without code deployment
3. **Customization** - Templates can be customized per environment/customer
4. **No Code Duplication** - Removed duplicate HTML generation logic
5. **Better Error Handling** - Clear errors when templates are missing
6. **Single Source of Truth** - All email content stored in database templates

---

## Migration Steps

### Step 1: Run SQL Script

Before deploying code changes, ensure templates exist in the database:

```bash
# Option 1: Using psql
psql -d your_database -f database/seeds/0032_ensure_email_templates_required.sql

# Option 2: Using pgAdmin or your preferred PostgreSQL client
# Copy and paste the contents of database/seeds/0032_ensure_email_templates_required.sql
```

### Step 2: Verify Templates

Verify that both templates exist and are active:

```sql
SELECT name, is_active, category 
FROM email_templates 
WHERE name IN ('Confirmare Cont', 'Cod Validare Formular');
```

Expected result:
```
        name           | is_active |  category  
-----------------------+-----------+------------
 Confirmare Cont       | t         | predefined
 Cod Validare Formular | t         | predefined
```

### Step 3: Deploy Code Changes

Deploy the refactored code. The functions will now:
- Require templates to exist
- Throw clear errors if templates are missing
- Use templates exclusively (no hardcoded fallbacks)

---

## Testing

After deployment, verify:

1. **User Confirmation Emails**
   - Create a new user
   - Verify confirmation email is sent using "Confirmare Cont" template
   - Check email content matches template

2. **Form Validation Emails**
   - Submit a form with email validation
   - Verify validation code email is sent using "Cod Validare Formular" template
   - Check email content matches template

3. **Error Handling**
   - Temporarily disable a template (`UPDATE email_templates SET is_active = false WHERE name = 'Confirmare Cont'`)
   - Create a new user
   - Verify clear error is logged (but user creation still succeeds)

---

## Rollback Plan

If issues occur, you can temporarily restore the fallback behavior by:

1. Reverting the code changes (git revert)
2. Or, ensuring templates exist and are active in the database

The SQL script is idempotent, so running it again is safe.

---

## Files Modified

- ✅ `src/lib/email.ts` - Removed `generateConfirmationEmailHTML()`, refactored `sendUserConfirmationEmail()`
- ✅ `src/lib/online-forms/email-validation.ts` - Refactored `sendValidationCodeEmail()`, removed unused imports
- ✅ `database/seeds/0032_ensure_email_templates_required.sql` - New SQL script to ensure templates exist

---

## Notes

- Templates must exist in the database before the refactored code is deployed
- Both templates use the `predefined` category
- Template variables are properly documented in the template content
- Error handling ensures email failures don't break user creation/form submission (errors are logged but not thrown)
- All emails continue to use the centralized Brevo API via `sendEmailWithTemplate()`


