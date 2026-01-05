# Code Review: Email Sending Consistency

## Overview

This review evaluates whether all emails in the codebase use the same Brevo method and templates instead of hardcoded text.

**Review Date:** 2024-12-19  
**Scope:** All email sending functionality across the codebase

---

## Executive Summary

✅ **All emails use Brevo API** - All email sending uses the centralized Brevo API client (`getBrevoApiInstance()` and `sendTransacEmail()`)

⚠️ **Template Usage Issues Found** - Two functions have fallback mechanisms that use hardcoded HTML when templates are not found, which violates the requirement to use templates.

---

## Detailed Findings

### ✅ Positive Findings

1. **Centralized Brevo Integration**
   - All emails use `getBrevoApiInstance()` from `src/lib/email.ts`
   - All emails use `apiInstance.sendTransacEmail()` method
   - Consistent sender configuration (`SENDER_NAME`, `SENDER_EMAIL`)
   - Proper error handling and logging

2. **Template System Implementation**
   - Well-designed template system with `sendEmailWithTemplate()` and `sendEmailWithTemplateName()`
   - Templates stored in database with variable substitution support
   - Template rendering with `renderTemplate()` function

3. **Consistent Template Usage in Modern Code**
   - ✅ HR notifications (`src/lib/services/hr-notifications.ts`) - All use `sendEmailWithTemplateName()`
   - ✅ Event notifications (`src/lib/services/event-notifications.ts`) - All use template functions
   - ✅ Payment receipts (`src/app/api/accounting/payments/quick/route.ts`) - Uses templates correctly
   - ✅ Event confirmation/cancellation (`src/lib/email.ts`) - Uses templates correctly

### ❌ Issues Found

#### Issue 1: Hardcoded HTML Fallback in `sendUserConfirmationEmail()`

**Location:** `src/lib/email.ts:105-180`

**Problem:**
The function has a fallback mechanism that uses hardcoded HTML when the template "Confirmare Cont" is not found:

```147:162:src/lib/email.ts
    // Fallback to hardcoded HTML if template not found
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = 'Bun venit în platformă - Confirmă contul tău';
    sendSmtpEmail.htmlContent = generateConfirmationEmailHTML(userName, confirmationLink);
    sendSmtpEmail.sender = {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    };
    sendSmtpEmail.to = [
      {
        email: userEmail,
        name: userName,
      },
    ];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
```

**Impact:**
- Violates the requirement to use templates exclusively
- Hardcoded HTML bypasses the template system
- Makes it impossible to customize email content without code changes
- Inconsistent with other email sending functions

**Recommendation:**
- Remove the fallback and throw an error if the template is not found
- Ensure the "Confirmare Cont" template exists in the database
- If template is missing, fail gracefully with a clear error message

#### Issue 2: Hardcoded HTML Fallback in `sendValidationCodeEmail()`

**Location:** `src/lib/online-forms/email-validation.ts:19-119`

**Problem:**
The function has a fallback mechanism that uses hardcoded HTML when the template "Cod Validare Formular" is not found:

```56:94:src/lib/online-forms/email-validation.ts
    // Fallback to hardcoded HTML if template not found
    console.log(`Step 2: Template not found, using fallback HTML`);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .code { font-size: 32px; font-weight: bold; text-align: center; 
                  background: #f4f4f4; padding: 20px; margin: 20px 0; 
                  border-radius: 5px; letter-spacing: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Cod de validare - ${formName}</h2>
          <p>Salut,</p>
          <p>Pentru a valida completarea formularului "<strong>${formName}</strong>", te rugăm să introduci următorul cod:</p>
          <div class="code">${code}</div>
          <p>Acest cod este valabil timp de 15 minute.</p>
          <p>Dacă nu ai completat acest formular, te rugăm să ignori acest email.</p>
          <p>Cu respect,<br>Echipa Platformă</p>
        </div>
      </body>
      </html>
    `;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Cod de validare - ${formName}`;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    };
    sendSmtpEmail.to = [{ email, name: email }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
```

**Impact:**
- Violates the requirement to use templates exclusively
- Hardcoded HTML bypasses the template system
- Makes it impossible to customize email content without code changes
- Inconsistent with other email sending functions

**Recommendation:**
- Remove the fallback and throw an error if the template is not found
- Ensure the "Cod Validare Formular" template exists in the database
- If template is missing, fail gracefully with a clear error message

---

## Code Quality Assessment

### Functionality

- ✅ Intended behavior works - All emails are sent successfully
- ⚠️ Edge cases handled inconsistently - Some functions have fallbacks, others don't
- ✅ Error handling is appropriate - Good error logging and non-blocking design

### Code Quality

- ✅ Code structure is clear - Well-organized email service layer
- ⚠️ Duplication concern - Two functions duplicate the hardcoded HTML pattern
- ⚠️ Consistency issue - Not all emails follow the same pattern (some have fallbacks, others don't)

### Security & Safety

- ✅ No obvious security vulnerabilities - Brevo API key is properly configured
- ✅ Inputs validated - Email addresses and template variables are validated
- ✅ Sensitive data handled correctly - API keys in environment variables

---

## Recommendations

### High Priority

1. **Remove hardcoded HTML fallbacks**
   - Update `sendUserConfirmationEmail()` to require template
   - Update `sendValidationCodeEmail()` to require template
   - Ensure required templates exist in database (seed if needed)
   - Fail with clear error messages if templates are missing

2. **Standardize email sending pattern**
   - All emails should use `sendEmailWithTemplate()` or `sendEmailWithTemplateName()`
   - No direct `sendSmtpEmail` usage outside of the centralized `sendEmailWithTemplate()` function
   - Remove `generateConfirmationEmailHTML()` function if no longer needed

### Medium Priority

3. **Add validation for required templates**
   - Create a startup check or migration that verifies all required templates exist
   - Add tests to ensure templates are present before sending emails
   - Document which templates are required for the system to function

4. **Improve error handling**
   - Standardize error handling across all email functions
   - Consider adding retry logic for template lookup failures
   - Add monitoring/alerts for missing templates

### Low Priority

5. **Code cleanup**
   - Remove unused `generateConfirmationEmailHTML()` function after removing fallback
   - Consider creating a types file for template variable structures
   - Add JSDoc comments documenting required template variables

---

## Verification Checklist

- [ ] All emails use Brevo API ✅ (Confirmed)
- [ ] All emails use templates ⚠️ (2 functions have fallbacks)
- [ ] No hardcoded email content ❌ (2 functions have hardcoded HTML)
- [ ] Consistent error handling ⚠️ (Inconsistent patterns)
- [ ] Template system is centralized ✅ (Well-designed)

---

## Summary

**Status:** ⚠️ **Requires Changes**

While the codebase has a well-designed template system and most emails use it correctly, there are two functions that violate the requirement to use templates exclusively:

1. `sendUserConfirmationEmail()` - Has hardcoded HTML fallback
2. `sendValidationCodeEmail()` - Has hardcoded HTML fallback

These should be updated to require templates and fail gracefully if templates are missing, rather than falling back to hardcoded HTML.

**All emails do use the same Brevo method** (`sendTransacEmail`), but **not all emails use templates** - the two functions mentioned above have hardcoded HTML fallbacks that bypass the template system.


