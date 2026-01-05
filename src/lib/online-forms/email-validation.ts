import { randomBytes } from 'crypto';
import { db } from '@/database/client';
import { onlineFormEmailValidations, onlineFormSubmissions } from '@/database/schema';
import { eq, and, gt } from 'drizzle-orm';
import { getBrevoApiInstance, apiKey } from '@/lib/email';

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
    // Get email template from database - template is required
    const { getTemplateByName, sendEmailWithTemplate } = await import('@/lib/email');
    const template = await getTemplateByName('Cod Validare Formular');
    
    if (!template) {
      const errorMessage = 'Email template "Cod Validare Formular" not found. Please ensure the template exists in the database.';
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

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

