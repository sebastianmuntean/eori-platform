import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { emailTemplates } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { extractTemplateVariables } from '@/lib/email';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  htmlContent: z.string().min(1, 'HTML content is required').optional(),
  textContent: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/email-templates/[id] - Get a single email template
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`Step 1: GET /api/email-templates/${params.id} - Fetching template`);

  try {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, params.id))
      .limit(1);

    if (!template) {
      console.log(`❌ Template not found: ${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Template found: ${template.name}`);
    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('❌ Error fetching email template:', error);
    logError(error, { endpoint: `/api/email-templates/${params.id}`, method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/email-templates/[id] - Update an email template
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`Step 1: PUT /api/email-templates/${params.id} - Updating template`);

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = updateTemplateSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    console.log(`Step 3: Checking if template ${params.id} exists`);
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, params.id))
      .limit(1);

    if (!existingTemplate) {
      console.log(`❌ Template with id ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it's already taken
    if (validation.data.name && validation.data.name !== existingTemplate.name) {
      console.log(`Step 4: Checking if name "${validation.data.name}" is available`);
      const [nameTemplate] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, validation.data.name))
        .limit(1);

      if (nameTemplate && nameTemplate.id !== params.id) {
        console.log(`❌ Name "${validation.data.name}" is already taken`);
        return NextResponse.json(
          { success: false, error: 'Template name is already taken' },
          { status: 400 }
        );
      }
    }

    console.log('Step 5: Preparing update data');
    const updateData: any = {
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
      // Re-extract variables if HTML content changed
      const htmlContent = validation.data.htmlContent;
      const textContent = validation.data.textContent || existingTemplate.textContent || '';
      updateData.variables = extractTemplateVariables(htmlContent + textContent);
      console.log(`  Updated variables: ${updateData.variables.join(', ')}`);
    }
    if (validation.data.textContent !== undefined) {
      updateData.textContent = validation.data.textContent;
      // Re-extract variables if text content changed
      if (!validation.data.htmlContent) {
        const htmlContent = existingTemplate.htmlContent;
        const textContent = validation.data.textContent;
        updateData.variables = extractTemplateVariables(htmlContent + textContent);
        console.log(`  Updated variables: ${updateData.variables.join(', ')}`);
      }
    }
    if (validation.data.isActive !== undefined) {
      updateData.isActive = validation.data.isActive;
    }

    console.log('Step 6: Updating template');
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set(updateData)
      .where(eq(emailTemplates.id, params.id))
      .returning();

    console.log(`✓ Template updated successfully: ${params.id}`);

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error) {
    console.error('❌ Error updating email template:', error);
    logError(error, { endpoint: `/api/email-templates/${params.id}`, method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/email-templates/[id] - Delete an email template
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`Step 1: DELETE /api/email-templates/${params.id} - Deleting template`);

  try {
    console.log(`Step 2: Checking if template ${params.id} exists`);
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, params.id))
      .limit(1);

    if (!existingTemplate) {
      console.log(`❌ Template with id ${params.id} not found`);
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of predefined templates
    if (existingTemplate.category === 'predefined') {
      console.log(`❌ Cannot delete predefined template: ${params.id}`);
      return NextResponse.json(
        { success: false, error: 'Cannot delete predefined templates' },
        { status: 400 }
      );
    }

    console.log('Step 3: Deleting template');
    await db.delete(emailTemplates).where(eq(emailTemplates.id, params.id));

    console.log(`✓ Template deleted successfully: ${params.id}`);
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting email template:', error);
    logError(error, { endpoint: `/api/email-templates/${params.id}`, method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


