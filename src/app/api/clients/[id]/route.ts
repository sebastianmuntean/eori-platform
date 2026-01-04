import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { formatValidationErrors, isValidUUID } from '@/lib/api-utils/validation';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const updateClientSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  cnp: z.string()
    .refine((val) => !val || val.length === 13, 'CNP must be exactly 13 digits')
    .refine((val) => !val || /^\d{13}$/.test(val), 'CNP must contain only digits')
    .optional(),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  companyName: z.string().max(255).optional(),
  cui: z.string().max(20).optional(),
  regCom: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email format').optional().nullable(),
  bankName: z.string().max(255).optional(),
  iban: z.string()
    .max(34)
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/i, 'Invalid IBAN format')
    .transform((val) => val.toUpperCase())
    .optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/clients/[id] - Get a single client by ID
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing client ID
 * @returns Client object or 404 if not found
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format' },
        { status: 400 }
      );
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, id),
          isNull(clients.deletedAt)
        )
      )
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/clients/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/clients/[id] - Update an existing client
 * 
 * Requires authentication. Validates input and checks for duplicate codes.
 * 
 * @param request - Next.js request object with updated client data in body
 * @param params - Route parameters containing client ID
 * @returns Updated client object or 404 if not found
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format' },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = updateClientSchema.safeParse(body);

    if (!validation.success) {
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if client exists and is not deleted
    const [currentClient] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, id),
          isNull(clients.deletedAt)
        )
      )
      .limit(1);

    if (!currentClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check for duplicate code if code is being updated (excluding deleted clients and current client)
    if (data.code && data.code !== currentClient.code) {
      const existingClient = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.code, data.code),
            isNull(clients.deletedAt)
          )
        )
        .limit(1);

      if (existingClient.length > 0 && existingClient[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'Client with this code already exists' },
          { status: 400 }
        );
      }
    }

    // Update client
    const [updatedClient] = await db
      .update(clients)
      .set({
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(clients.id, id))
      .returning();

    if (!updatedClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClient,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/clients/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/clients/[id] - Soft delete a client
 * 
 * Requires authentication. Performs soft delete by setting deletedAt timestamp.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing client ID
 * @returns Soft-deleted client object or 404 if not found
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format' },
        { status: 400 }
      );
    }
    
    // Check if client exists and is not already deleted
    const [currentClient] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, id),
          isNull(clients.deletedAt)
        )
      )
      .limit(1);

    if (!currentClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Soft delete: set deletedAt timestamp instead of hard delete
    const [deletedClient] = await db
      .update(clients)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(clients.id, id))
      .returning();

    if (!deletedClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedClient,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/clients/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

