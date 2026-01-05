import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, registerConfigurations } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { generateRegistrationNumber } from '@/lib/services/register-number-service';

const createDocumentSchema = z.object({
  registerConfigurationId: z.string().uuid('Invalid register configuration ID'),
  documentType: z.enum(['incoming', 'outgoing', 'internal']),
  subject: z.string().min(1, 'Subject is required').max(500),
  from: z.string().max(255).optional().nullable(),
  petitionerClientId: z.string().uuid().optional().nullable(),
  to: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  filePath: z.string().optional().nullable(),
  status: z.enum(['draft', 'in_work', 'distributed', 'resolved', 'cancelled']).optional().default('draft'),
});

/**
 * GET /api/registratura/general-register - List documents
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const registerConfigId = searchParams.get('registerConfigurationId');
    const year = searchParams.get('year');
    const documentType = searchParams.get('documentType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const offset = (page - 1) * pageSize;

    // Build query conditions
    const conditions = [];
    if (registerConfigId) {
      conditions.push(eq(generalRegister.registerConfigurationId, registerConfigId));
    }
    if (year) {
      conditions.push(eq(generalRegister.year, parseInt(year)));
    }
    if (documentType) {
      const validTypes = ['incoming', 'outgoing', 'internal'];
      if (validTypes.includes(documentType)) {
        conditions.push(eq(generalRegister.documentType, documentType as 'incoming' | 'outgoing' | 'internal'));
      }
    }
    if (status) {
      const validStatuses = ['draft', 'in_work', 'distributed', 'resolved', 'cancelled'];
      if (validStatuses.includes(status)) {
        conditions.push(eq(generalRegister.status, status as 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled'));
      }
    }
    if (search) {
      conditions.push(
        or(
          like(generalRegister.subject, `%${search}%`),
          like(generalRegister.from, `%${search}%`),
          like(generalRegister.to, `%${search}%`)
        )
      );
    }

    // Get total count for pagination
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generalRegister)
      .where(whereClause);
    
    const total = Number(countResult?.count || 0);

    // Get paginated documents
    const documents = await db
      .select({
        id: generalRegister.id,
        registerConfigurationId: generalRegister.registerConfigurationId,
        parishId: generalRegister.parishId,
        documentNumber: generalRegister.documentNumber,
        year: generalRegister.year,
        documentType: generalRegister.documentType,
        date: generalRegister.date,
        subject: generalRegister.subject,
        from: generalRegister.from,
        to: generalRegister.to,
        description: generalRegister.description,
        filePath: generalRegister.filePath,
        status: generalRegister.status,
        createdBy: generalRegister.createdBy,
        createdAt: generalRegister.createdAt,
        updatedAt: generalRegister.updatedAt,
        updatedBy: generalRegister.updatedBy,
      })
      .from(generalRegister)
      .where(whereClause)
      .orderBy(desc(generalRegister.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json(
      {
        success: true,
        data: documents,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/general-register', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/registratura/general-register - Create new document
 */
export async function POST(request: Request) {
  console.log('[API POST /api/registratura/general-register] Request received');
  
  try {
    const { userId } = await getCurrentUser();
    console.log('[API POST /api/registratura/general-register] User ID:', userId);
    
    if (!userId) {
      console.log('[API POST /api/registratura/general-register] ❌ Not authenticated');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[API POST /api/registratura/general-register] Request body:', {
      ...body,
      petitionerClientId: body.petitionerClientId || 'null',
    });
    
    const validation = createDocumentSchema.safeParse(body);
    console.log('[API POST /api/registratura/general-register] Validation result:', validation.success);

    if (!validation.success) {
      console.log('[API POST /api/registratura/general-register] ❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    console.log('[API POST /api/registratura/general-register] Validated data:', {
      ...data,
      petitionerClientId: data.petitionerClientId || 'null',
    });

    // Get register configuration
    console.log('[API POST /api/registratura/general-register] Fetching register configuration:', data.registerConfigurationId);
    const [registerConfig] = await db
      .select()
      .from(registerConfigurations)
      .where(eq(registerConfigurations.id, data.registerConfigurationId))
      .limit(1);

    if (!registerConfig) {
      console.log('[API POST /api/registratura/general-register] ❌ Register configuration not found');
      return NextResponse.json(
        { success: false, error: 'Register configuration not found' },
        { status: 400 }
      );
    }
    console.log('[API POST /api/registratura/general-register] ✓ Register configuration found:', registerConfig.id);

    // Set date to current date (not editable)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    console.log('[API POST /api/registratura/general-register] Current date:', currentDate.toISOString().split('T')[0], 'Year:', currentYear);

    // Generate registration number
    console.log('[API POST /api/registratura/general-register] Generating registration number...');
    const numberData = await generateRegistrationNumber({
      registerConfigId: data.registerConfigurationId,
      year: currentYear,
    });
    console.log('[API POST /api/registratura/general-register] Generated number:', numberData);

    // Create document
    const insertData = {
      registerConfigurationId: data.registerConfigurationId,
      parishId: registerConfig.parishId, // Get from register config (or null)
      documentNumber: numberData.documentNumber,
      year: numberData.year,
      documentType: data.documentType,
      date: currentDate.toISOString().split('T')[0], // Current date as YYYY-MM-DD
      subject: data.subject,
      from: data.from || null,
      petitionerClientId: data.petitionerClientId || null,
      to: data.to || null,
      description: data.description || null,
      filePath: data.filePath || null,
      status: data.status || 'draft',
      createdBy: userId,
      updatedBy: userId,
    };
    
    console.log('[API POST /api/registratura/general-register] Inserting document into table: general_register');
    console.log('[API POST /api/registratura/general-register] Insert data:', {
      ...insertData,
      petitionerClientId: insertData.petitionerClientId || 'null',
    });
    
    const [newDocument] = await db
      .insert(generalRegister)
      .values(insertData)
      .returning();

    console.log('[API POST /api/registratura/general-register] ✓ Document saved successfully in table: general_register');
    console.log('[API POST /api/registratura/general-register] Document ID:', newDocument?.id);
    console.log('[API POST /api/registratura/general-register] Document data:', {
      id: newDocument?.id,
      documentNumber: newDocument?.documentNumber,
      year: newDocument?.year,
      subject: newDocument?.subject,
    });

    return NextResponse.json(
      {
        success: true,
        data: newDocument,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API POST /api/registratura/general-register] ❌ Error:', error);
    logError(error, { endpoint: '/api/registratura/general-register', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


