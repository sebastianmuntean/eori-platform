import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { emailTemplates } from '@/database/schema';
import { formatErrorResponse, logError, ValidationError, NotFoundError } from '@/lib/errors';
import { extractTemplateVariables } from '@/lib/email';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less').optional(),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject must be 500 characters or less').optional(),
  htmlContent: z.string().min(1, 'HTML content is required').max(50000, 'HTML content must be 50000 characters or less').optional(),
  textContent: z.string().max(50000, 'Text content must be 50000 characters or less').optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/email-templates/[id] - Get a single email template
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Require authentication
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!template) {
      logger.warn('Template not found', { templateId: id, userId });
      return createErrorResponse('Template not found', 404);
    }

    logger.info('Fetched email template', { templateId: id, userId });
    return createSuccessResponse(template);
  } catch (error) {
    logger.error('Error fetching email template', error, { endpoint: `/api/email-templates/${id}`, method: 'GET' });
    logError(error, { endpoint: `/api/email-templates/${id}`, method: 'GET' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * PUT /api/email-templates/[id] - Update an email template
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Require authentication
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = updateTemplateSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Template update validation failed', { errors: validation.error.errors, templateId: id, userId });
      const firstError = validation.error.errors[0];
      return createErrorResponse(firstError.message, 400);
    }

    // Check if template exists
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!existingTemplate) {
      logger.warn('Template not found for update', { templateId: id, userId });
      return createErrorResponse('Template not found', 404);
    }

    // Check if name is being changed and if it's already taken
    if (validation.data.name && validation.data.name !== existingTemplate.name) {
      const [nameTemplate] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, validation.data.name))
        .limit(1);

      if (nameTemplate && nameTemplate.id !== id) {
        logger.warn('Template name already taken', { name: validation.data.name, templateId: id, userId });
        return createErrorResponse('Template name is already taken', 400);
      }
    }

    // Prepare update data with proper types
    const updateData: {
      updatedAt: Date;
      name?: string;
      subject?: string;
      htmlContent?: string;
      textContent?: string | null;
      variables?: string[];
      isActive?: boolean;
    } = {
      updatedAt: new Date(),
    };

    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }
    if (validation.data.subject !== undefined) {
      updateData.subject = validation.data.subject;
    }
    if (validation.data.htmlContent !== undefined) {
      updateData.htmlContent = validation.data.htmlContent;
    }
    if (validation.data.textContent !== undefined) {
      updateData.textContent = validation.data.textContent || null;
    }
    if (validation.data.isActive !== undefined) {
      updateData.isActive = validation.data.isActive;
    }

    // Re-extract variables if content changed (handle both htmlContent and textContent updates)
    if (validation.data.htmlContent !== undefined || validation.data.textContent !== undefined) {
      const htmlContent = validation.data.htmlContent ?? existingTemplate.htmlContent;
      const textContent = validation.data.textContent ?? existingTemplate.textContent ?? '';
      updateData.variables = extractTemplateVariables(htmlContent + textContent);
    }

    // Update template
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set(updateData)
      .where(eq(emailTemplates.id, id))
      .returning();

    logger.info('Email template updated', { templateId: id, userId });
    return createSuccessResponse(updatedTemplate);
  } catch (error) {
    logger.error('Error updating email template', error, { endpoint: `/api/email-templates/${id}`, method: 'PUT' });
    logError(error, { endpoint: `/api/email-templates/${id}`, method: 'PUT' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * DELETE /api/email-templates/[id] - Delete an email template
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Require authentication
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    // Check if template exists
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!existingTemplate) {
      logger.warn('Template not found for deletion', { templateId: id, userId });
      return createErrorResponse('Template not found', 404);
    }

    // Prevent deletion of predefined templates
    if (existingTemplate.category === 'predefined') {
      logger.warn('Attempt to delete predefined template', { templateId: id, userId });
      return createErrorResponse('Cannot delete predefined templates', 400);
    }

    // Delete template
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));

    logger.info('Email template deleted', { templateId: id, userId });
    return createSuccessResponse({ message: 'Template deleted successfully' });
  } catch (error) {
    logger.error('Error deleting email template', error, { endpoint: `/api/email-templates/${id}`, method: 'DELETE' });
    logError(error, { endpoint: `/api/email-templates/${id}`, method: 'DELETE' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}
