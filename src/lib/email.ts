import * as brevo from '@getbrevo/brevo';
import { db } from '@/database/client';
import { emailTemplates } from '@/database/schema';
import { eq, and } from 'drizzle-orm';

// Use BREVO_VERIFIED_SENDER from .env (the verified sender email from Brevo)
export const SENDER_EMAIL = process.env.BREVO_VERIFIED_SENDER || process.env.BREVO_SENDER_EMAIL || 'noreply@example.com';
export const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Platform';
const APP_URL = process.env.APP_URL || 'http://localhost:4058';

/**
 * Initialize Brevo API client
 * This function is called lazily to avoid issues with Next.js module loading
 */
export function getBrevoApiInstance(): brevo.TransactionalEmailsApi | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY not set - email functionality will be disabled');
    return null;
  }

  try {
    // Create TransactionalEmailsApi instance directly (Brevo v3+)
    const instance = new brevo.TransactionalEmailsApi();
    
    // Set API key using the setApiKey method with the apiKey enum value
    instance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    
    return instance;
  } catch (error) {
    console.error('❌ Failed to initialize Brevo API client:', error);
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    }
    return null;
  }
}

// Lazy initialization - will be created on first use
let apiInstance: brevo.TransactionalEmailsApi | null = null;
export const apiKey = process.env.BREVO_API_KEY;

/**
 * Generate HTML email template for user confirmation
 */
function generateConfirmationEmailHTML(
  userName: string,
  confirmationLink: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmă contul tău</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Bun venit în platformă!</h1>
    
    <p>Salut <strong>${userName}</strong>,</p>
    
    <p>Contul tău a fost creat în platformă. Pentru a activa contul și a-ți seta parola, te rugăm să accesezi link-ul de mai jos:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationLink}" 
         style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Confirmă contul și setează parola
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Sau copiază acest link în browser:<br>
      <a href="${confirmationLink}" style="color: #007bff; word-break: break-all;">${confirmationLink}</a>
    </p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Important:</strong> Link-ul este valabil pentru 7 zile.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Dacă nu ai solicitat crearea acestui cont, te rugăm să ignori acest email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      Cu respect,<br>
      Echipa Platformă
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send user confirmation email with password setup link
 * Uses email template from database if available, falls back to hardcoded HTML
 */
export async function sendUserConfirmationEmail(
  userEmail: string,
  userName: string,
  confirmationLink: string
): Promise<void> {

  // Initialize API instance if not already done
  if (!apiInstance) {
    apiInstance = getBrevoApiInstance();
  }

  if (!apiInstance || !apiKey) {
    console.warn('⚠️ Email service not configured - skipping email send');
    console.log(`Would send confirmation email to ${userEmail} with link: ${confirmationLink}`);
    return;
  }

  try {
    // Try to use email template from database
    const template = await getTemplateByName('Confirmare Cont');
    
    if (template) {
      await sendEmailWithTemplate(
        template.id,
        userEmail,
        userName,
        {
          user: {
            name: userName,
            email: userEmail,
          },
          link: {
            confirmation: confirmationLink,
          },
          app: {
            name: SENDER_NAME,
          },
        }
      );
      return;
    }

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
  } catch (error: any) {
    console.error(`❌ Failed to send confirmation email to ${userEmail}:`, error);
    
    // Log detailed error information
    if (error.response) {
      console.error(`  Response status: ${error.response.statusCode || 'N/A'}`);
      console.error(`  Response body:`, error.response.body || error.response.text || 'N/A');
    }
    
    if (error instanceof Error) {
      console.error(`  Error message: ${error.message}`);
      console.error(`  Error stack: ${error.stack}`);
    }
    
    // Don't throw - email failure shouldn't break user creation
    // But log it for monitoring
  }
}

/**
 * Send user created email (alias for consistency)
 */
export async function sendUserCreatedEmail(
  userEmail: string,
  userName: string,
  confirmationLink: string
): Promise<void> {
  return sendUserConfirmationEmail(userEmail, userName, confirmationLink);
}

/**
 * Replace template variables with actual values
 * Supports {{variableName}} and {{object.property}} syntax
 */
function replaceTemplateVariables(
  content: string,
  variables: Record<string, any>
): string {
  let result = content;
  
  // Replace all {{variable}} patterns
  const variablePattern = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  
  result = result.replace(variablePattern, (match, variablePath) => {
    // Handle nested properties like user.name
    const parts = variablePath.split('.');
    let value: any = variables;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        console.warn(`  ⚠️ Variable not found: ${variablePath}`);
        return match; // Return original if not found
      }
    }
    
    const replaced = String(value ?? match);
    return replaced;
  });
  
  return result;
}

/**
 * Extract variable names from template content
 */
export function extractTemplateVariables(content: string): string[] {
  const variablePattern = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  const variables = new Set<string>();
  let match;
  
  while ((match = variablePattern.exec(content)) !== null) {
    variables.add(match[1]);
  }
  
  const variableArray = Array.from(variables);
  console.log(`✓ Found ${variableArray.length} unique variables: ${variableArray.join(', ')}`);
  return variableArray;
}

/**
 * Render email template with variables
 */
export async function renderTemplate(
  templateId: string,
  variables: Record<string, any>
): Promise<{ subject: string; htmlContent: string; textContent?: string }> {
  console.log(`  Variables: ${Object.keys(variables).join(', ')}`);
  
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, templateId))
    .limit(1);
  
  if (!template) {
    console.error(`❌ Template not found: ${templateId}`);
    throw new Error(`Email template not found: ${templateId}`);
  }
  
  if (!template.isActive) {
    console.error(`❌ Template is inactive: ${templateId}`);
    throw new Error(`Email template is inactive: ${templateId}`);
  }
  
  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlContent = replaceTemplateVariables(template.htmlContent, variables);
  const textContent = template.textContent
    ? replaceTemplateVariables(template.textContent, variables)
    : undefined;
  
  console.log(`✓ Template rendered successfully`);
  return { subject, htmlContent, textContent };
}

/**
 * Send email using a template
 */
export async function sendEmailWithTemplate(
  templateId: string,
  recipientEmail: string,
  recipientName: string,
  variables: Record<string, any>
): Promise<void> {
  
  // Initialize API instance if not already done
  if (!apiInstance) {
    apiInstance = getBrevoApiInstance();
  }
  
  if (!apiInstance || !apiKey) {
    console.warn('⚠️ Email service not configured - skipping email send');
    console.log(`Would send email to ${recipientEmail} using template ${templateId}`);
    return;
  }
  
  try {
    console.log(`Step 2: Rendering template`);
    const { subject, htmlContent, textContent } = await renderTemplate(templateId, variables);
    
    console.log(`  Sender: ${SENDER_EMAIL} (${SENDER_NAME})`);
    console.log(`  Recipient: ${recipientEmail} (${recipientName})`);
    console.log(`  Subject: ${subject}`);
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    if (textContent) {
      sendSmtpEmail.textContent = textContent;
    }
    sendSmtpEmail.sender = {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    };
    sendSmtpEmail.to = [
      {
        email: recipientEmail,
        name: recipientName,
      },
    ];
    
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    if (result.body?.messageId) {
      console.log(`  Message ID: ${result.body.messageId}`);
    }
    
    if (result.response) {
      console.log(`  Response status: ${result.response.statusCode || 'N/A'}`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${recipientEmail}:`, error);
    
    if (error.response) {
      console.error(`  Response status: ${error.response.statusCode || 'N/A'}`);
      console.error(`  Response body:`, error.response.body || error.response.text || 'N/A');
    }
    
    if (error instanceof Error) {
      console.error(`  Error message: ${error.message}`);
      console.error(`  Error stack: ${error.stack}`);
    }
    
    throw error; // Re-throw for caller to handle
  }
}

/**
 * Get template by name
 */
export async function getTemplateByName(name: string): Promise<typeof emailTemplates.$inferSelect | null> {
  
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.name, name),
        eq(emailTemplates.isActive, true)
      )
    )
    .limit(1);
  
  if (!template) {
    console.log(`❌ Template "${name}" not found or inactive`);
    return null;
  }
  
  console.log(`✓ Template found: ${template.name} (${template.id})`);
  return template;
}

/**
 * Send email using template name (convenience function)
 */
export async function sendEmailWithTemplateName(
  templateName: string,
  recipientEmail: string,
  recipientName: string,
  variables: Record<string, any>
): Promise<void> {
  
  const template = await getTemplateByName(templateName);
  if (!template) {
    throw new Error(`Email template "${templateName}" not found or inactive`);
  }
  
  return sendEmailWithTemplate(template.id, recipientEmail, recipientName, variables);
}

/**
 * Send event confirmation email to participants
 */
export async function sendEventConfirmationEmail(
  recipientEmail: string,
  recipientName: string,
  event: {
    type: 'wedding' | 'baptism' | 'funeral';
    date: string | null;
    location: string | null;
    priestName: string | null;
    parishName: string;
    notes: string | null;
  }
): Promise<void> {
  
  const typeLabels: Record<'wedding' | 'baptism' | 'funeral', string> = {
    wedding: 'Nuntă',
    baptism: 'Botez',
    funeral: 'Înmormântare',
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nespecificat';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };
  
  try {
    await sendEmailWithTemplateName(
      'Confirmare Eveniment',
      recipientEmail,
      recipientName,
      {
        recipient: {
          name: recipientName,
          email: recipientEmail,
        },
        event: {
          typeLabel: typeLabels[event.type],
          date: formatDate(event.date),
          location: event.location || 'Nespecificat',
          priestName: event.priestName || 'Nespecificat',
          parishName: event.parishName,
          notes: event.notes || 'Fără observații',
        },
      }
    );
    console.log(`✓ Event confirmation email sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send event confirmation email:`, error);
    // Don't throw - email failures shouldn't break event updates
  }
}

/**
 * Send event reminder email to participants
 */
export async function sendEventReminderEmail(
  recipientEmail: string,
  recipientName: string,
  event: {
    type: 'wedding' | 'baptism' | 'funeral';
    date: string | null;
    location: string | null;
    priestName: string | null;
    parishName: string;
    notes: string | null;
  },
  daysUntil: number
): Promise<void> {
  
  const typeLabels: Record<'wedding' | 'baptism' | 'funeral', string> = {
    wedding: 'Nuntă',
    baptism: 'Botez',
    funeral: 'Înmormântare',
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nespecificat';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };
  
  try {
    await sendEmailWithTemplateName(
      'Reminder Eveniment',
      recipientEmail,
      recipientName,
      {
        recipient: {
          name: recipientName,
          email: recipientEmail,
        },
        event: {
          typeLabel: typeLabels[event.type],
          date: formatDate(event.date),
          location: event.location || 'Nespecificat',
          priestName: event.priestName || 'Nespecificat',
          parishName: event.parishName,
          notes: event.notes || 'Fără observații',
          daysUntil: daysUntil.toString(),
        },
      }
    );
    console.log(`✓ Event reminder email sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send event reminder email:`, error);
    // Don't throw - email failures shouldn't break event updates
  }
}

/**
 * Send event cancellation email to participants
 */
export async function sendEventCancellationEmail(
  recipientEmail: string,
  recipientName: string,
  event: {
    type: 'wedding' | 'baptism' | 'funeral';
    date: string | null;
    location: string | null;
    parishName: string;
  },
  cancellationReason?: string
): Promise<void> {
  
  const typeLabels: Record<'wedding' | 'baptism' | 'funeral', string> = {
    wedding: 'Nuntă',
    baptism: 'Botez',
    funeral: 'Înmormântare',
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nespecificat';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };
  
  try {
    await sendEmailWithTemplateName(
      'Anulare Eveniment',
      recipientEmail,
      recipientName,
      {
        recipient: {
          name: recipientName,
          email: recipientEmail,
        },
        event: {
          typeLabel: typeLabels[event.type],
          date: formatDate(event.date),
          location: event.location || 'Nespecificat',
          parishName: event.parishName,
        },
        cancellationReason: cancellationReason || 'Nespecificat',
      }
    );
    console.log(`✓ Event cancellation email sent to ${recipientEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send event cancellation email:`, error);
    // Don't throw - email failures shouldn't break event updates
  }
}

