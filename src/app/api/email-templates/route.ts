import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { emailTemplates } from '@/database/schema';
import { formatErrorResponse, logError, ValidationError } from '@/lib/errors';
import { extractTemplateVariables } from '@/lib/email';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { calculatePagination } from '@/lib/api-utils/pagination';
import { sanitizeSearch, parseBoolean, validateEnum } from '@/lib/api-utils/validation';
import { parseSortOrder, createOrderBy } from '@/lib/api-utils/sorting';
import { logger } from '@/lib/utils/logger';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject must be 500 characters or less'),
  htmlContent: z.string().min(1, 'HTML content is required').max(50000, 'HTML content must be 50000 characters or less'),
  textContent: z.string().max(50000, 'Text content must be 50000 characters or less').optional(),
  category: z.enum(['predefined', 'custom']).default('custom'),
  isActive: z.boolean().default(true),
});

// Allowed sort fields
const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'updatedAt'] as const;

// Allowed categories
const ALLOWED_CATEGORIES = ['predefined', 'custom'] as const;

/**
 * GET /api/email-templates - Fetch all email templates with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  try {
    // Require authentication
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate pagination (frontend sends pageSize, utility expects limit)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const rawPageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
    const pageSize = Math.min(100, Math.max(1, rawPageSize));
    const offset = (page - 1) * pageSize;
    
    // Parse and validate filters
    const search = sanitizeSearch(searchParams.get('search'));
    const category = validateEnum(searchParams.get('category'), ALLOWED_CATEGORIES, null);
    const isActive = parseBoolean(searchParams.get('isActive'));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = parseSortOrder(searchParams.get('sortOrder'));

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
      conditions.push(eq(emailTemplates.category, category));
    }

    if (isActive !== undefined) {
      conditions.push(eq(emailTemplates.isActive, isActive));
    }

    // Build where clause with proper AND logic for multiple conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count using proper SQL COUNT
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailTemplates)
      .where(whereClause);
    const totalCount = Number(countResult[0]?.count || 0);

    // Build safe order by
    const orderBy = createOrderBy(
      emailTemplates,
      sortBy,
      'createdAt',
      ALLOWED_SORT_FIELDS,
      sortOrder
    );

    // Get paginated results
    let query = db.select().from(emailTemplates);
    if (whereClause) {
      query = query.where(whereClause);
    }
    const allTemplates = await query.orderBy(orderBy).limit(pageSize).offset(offset);

    logger.info(`Fetched ${allTemplates.length} email templates`, { page, totalCount, userId });

    return createSuccessResponse(allTemplates, undefined, {
      pagination: calculatePagination(totalCount, page, pageSize),
    });
  } catch (error) {
    logger.error('Error fetching email templates', error, { endpoint: '/api/email-templates', method: 'GET' });
    logError(error, { endpoint: '/api/email-templates', method: 'GET' });
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
 * POST /api/email-templates - Create a new email template
 */
export async function POST(request: Request) {
  try {
    // Require authentication
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return createErrorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Template creation validation failed', { errors: validation.error.errors, userId });
      const firstError = validation.error.errors[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { name, subject, htmlContent, textContent, category, isActive } = validation.data;

    // Check if template name already exists
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, name))
      .limit(1);

    if (existingTemplate) {
      logger.warn('Template name already exists', { name, userId });
      return createErrorResponse('Template with this name already exists', 400);
    }

    // Extract template variables from content
    const variables = extractTemplateVariables(htmlContent + (textContent || ''));

    // Insert template into database
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

    logger.info('Email template created', { templateId: newTemplate.id, name, userId });

    return createSuccessResponse(newTemplate, undefined);
  } catch (error) {
    logger.error('Error creating email template', error, { endpoint: '/api/email-templates', method: 'POST' });
    logError(error, { endpoint: '/api/email-templates', method: 'POST' });
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
