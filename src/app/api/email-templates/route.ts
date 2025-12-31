import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { emailTemplates } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { extractTemplateVariables } from '@/lib/email';
import { eq, like, or, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().optional(),
  category: z.enum(['predefined', 'custom']).default('custom'),
  isActive: z.boolean().default(true),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  htmlContent: z.string().min(1, 'HTML content is required').optional(),
  textContent: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/email-templates - Fetch all email templates with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/email-templates - Fetching templates');

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category'); // 'predefined' | 'custom'
    const isActive = searchParams.get('isActive'); // 'true' | 'false'
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, search: ${search}, category: ${category}, isActive: ${isActive}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(emailTemplates.name, `%${search}%`),
          like(emailTemplates.subject, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(emailTemplates.category, category as 'predefined' | 'custom'));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(emailTemplates.isActive, isActive === 'true'));
    }

    console.log(`Step 3: Building query with ${conditions.length} conditions`);

    // Get total count
    let countQuery = db.select({ count: emailTemplates.id }).from(emailTemplates);
    if (conditions.length > 0) {
      countQuery = countQuery.where(conditions[0] as any);
    }
    const totalCountResult = await countQuery;
    const totalCount = totalCountResult.length;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(emailTemplates);

    if (conditions.length > 0) {
      query = query.where(conditions[0] as any);
    }

    // Apply sorting
    if (sortBy === 'createdAt') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(emailTemplates.createdAt))
        : query.orderBy(asc(emailTemplates.createdAt));
    } else if (sortBy === 'name') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(emailTemplates.name))
        : query.orderBy(asc(emailTemplates.name));
    } else if (sortBy === 'updatedAt') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(emailTemplates.updatedAt))
        : query.orderBy(asc(emailTemplates.updatedAt));
    }

    const allTemplates = await query.limit(pageSize).offset(offset);

    console.log(`✓ Found ${allTemplates.length} templates (total: ${totalCount})`);

    return NextResponse.json({
      success: true,
      data: allTemplates,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching email templates:', error);
    logError(error, { endpoint: '/api/email-templates', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/email-templates - Create a new email template
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/email-templates - Creating new template');

  try {
    const body = await request.json();
    console.log('Step 2: Validating request body');
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, subject, htmlContent, textContent, category, isActive } = validation.data;

    console.log(`Step 3: Checking if template with name "${name}" already exists`);
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, name))
      .limit(1);

    if (existingTemplate) {
      console.log(`❌ Template with name "${name}" already exists`);
      return NextResponse.json(
        { success: false, error: 'Template with this name already exists' },
        { status: 400 }
      );
    }

    console.log('Step 4: Extracting template variables');
    const variables = extractTemplateVariables(htmlContent + (textContent || ''));
    console.log(`  Found variables: ${variables.join(', ')}`);

    console.log('Step 5: Inserting template into database');
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values({
        name,
        subject,
        htmlContent,
        textContent: textContent || null,
        variables,
        category,
        isActive,
      })
      .returning();

    console.log(`✓ Template created with ID: ${newTemplate.id}`);

    return NextResponse.json(
      {
        success: true,
        data: newTemplate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating email template:', error);
    logError(error, { endpoint: '/api/email-templates', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/email-templates - Update email template
 */
export async function PUT(request: Request) {
  console.log('Step 1: PUT /api/email-templates - Updating template');

  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      console.log('❌ Missing template ID');
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

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

    console.log(`Step 3: Checking if template ${templateId} exists`);
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (!existingTemplate) {
      console.log(`❌ Template with id ${templateId} not found`);
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

      if (nameTemplate) {
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
      .where(eq(emailTemplates.id, templateId))
      .returning();

    console.log(`✓ Template updated successfully: ${templateId}`);

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error) {
    console.error('❌ Error updating email template:', error);
    logError(error, { endpoint: '/api/email-templates', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/email-templates - Delete an email template
 */
export async function DELETE(request: Request) {
  console.log('Step 1: DELETE /api/email-templates - Deleting template');

  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      console.log('❌ Missing template ID');
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Checking if template ${templateId} exists`);
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (!existingTemplate) {
      console.log(`❌ Template with id ${templateId} not found`);
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of predefined templates
    if (existingTemplate.category === 'predefined') {
      console.log(`❌ Cannot delete predefined template: ${templateId}`);
      return NextResponse.json(
        { success: false, error: 'Cannot delete predefined templates' },
        { status: 400 }
      );
    }

    console.log('Step 3: Deleting template');
    await db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));

    console.log(`✓ Template deleted successfully: ${templateId}`);
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting email template:', error);
    logError(error, { endpoint: '/api/email-templates', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


