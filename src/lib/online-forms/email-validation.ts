import { randomBytes } from 'crypto';
import { db } from '@/database/client';
import { onlineFormEmailValidations, onlineFormSubmissions } from '@/database/schema';
import { eq, and, gt } from 'drizzle-orm';
import * as brevo from '@getbrevo/brevo';
import { getBrevoApiInstance, SENDER_EMAIL, SENDER_NAME, apiKey } from '@/lib/email';

/**
 * Generate a 6-digit validation code
 */
export function generateValidationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Send validation code email
 */
export async function sendValidationCodeEmail(
  email: string,
  code: string,
  formName: string
): Promise<void> {
  console.log(`Step 1: Sending validation code email to ${email}`);

  // Use centralized Brevo API instance
  const apiInstance = getBrevoApiInstance();
  if (!apiInstance || !apiKey) {
    console.warn('⚠️ BREVO_API_KEY not set - skipping email send');
    console.log(`Would send validation code ${code} to ${email}`);
    return;
  }

  try {
    // Try to use email template from database
    const { getTemplateByName, sendEmailWithTemplate } = await import('@/lib/email');
    const template = await getTemplateByName('Cod Validare Formular');
    
    if (template) {
      console.log(`Step 2: Using email template "Cod Validare Formular"`);
      await sendEmailWithTemplate(
        template.id,
        email,
        email,
        {
          form: {
            name: formName,
          },
          code: code,
        }
      );
      console.log(`✓ Validation code email sent successfully using template`);
      return;
    }

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
    console.log(`✓ Validation code email sent to ${email}`);
    if (result.body?.messageId) {
      console.log(`  Message ID: ${result.body.messageId}`);
    }
    
    if (result.response) {
      console.log(`  Response status: ${result.response.statusCode || 'N/A'}`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to send validation code email to ${email}:`, error);
    
    // Log detailed error information
    if (error.response) {
      console.error(`  Response status: ${error.response.statusCode || 'N/A'}`);
      console.error(`  Response body:`, error.response.body || error.response.text || 'N/A');
    }
    
    if (error instanceof Error) {
      console.error(`  Error message: ${error.message}`);
      console.error(`  Error stack: ${error.stack}`);
    }
    
    throw error;
  }
}

/**
 * Create email validation record
 */
export async function createEmailValidation(
  submissionId: string,
  email: string
): Promise<{ id: string; code: string }> {
  const code = generateValidationCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes validity

  const [validation] = await db
    .insert(onlineFormEmailValidations)
    .values({
      submissionId,
      email,
      validationCode: code,
      expiresAt,
    })
    .returning();

  return { id: validation.id, code };
}

/**
 * Verify email validation code
 */
export async function verifyEmailCode(
  submissionId: string,
  email: string,
  code: string
): Promise<boolean> {
  const [validation] = await db
    .select()
    .from(onlineFormEmailValidations)
    .where(
      and(
        eq(onlineFormEmailValidations.submissionId, submissionId),
        eq(onlineFormEmailValidations.email, email),
        eq(onlineFormEmailValidations.validationCode, code),
        gt(onlineFormEmailValidations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!validation || validation.verifiedAt) {
    return false;
  }

  // Mark as verified
  await db
    .update(onlineFormEmailValidations)
    .set({ verifiedAt: new Date() })
    .where(eq(onlineFormEmailValidations.id, validation.id));

  // Update submission
  await db
    .update(onlineFormSubmissions)
    .set({ emailValidatedAt: new Date() })
    .where(eq(onlineFormSubmissions.id, submissionId));

  return true;
}

