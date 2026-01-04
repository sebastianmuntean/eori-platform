import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, like, or, desc, asc, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

const createPartnerSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  cnp: z.string().max(13).optional(),
  birthDate: z.string().optional().nullable(),
  companyName: z.string().optional(),
  cui: z.string().max(20).optional(),
  regCom: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  bankName: z.string().optional(),
  iban: z.string().max(34).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'code';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    // Always filter active and non-deleted clients
    conditions.push(eq(clients.isActive, true));
    conditions.push(isNull(clients.deletedAt));

    if (search) {
      conditions.push(
        or(
          like(clients.code, `%${search}%`),
          like(clients.firstName || '', `%${search}%`),
          like(clients.lastName || '', `%${search}%`),
          like(clients.companyName || '', `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;

    const totalCountResult = await db
      .select({ count: clients.id })
      .from(clients)
      .where(whereClause);
    const totalCount = totalCountResult.length;

    let query = db.select().from(clients);
    if (whereClause) {
      query = query.where(whereClause);
    }

    if (sortBy === 'code') {
      query = sortOrder === 'desc' 
        ? query.orderBy(desc(clients.code))
        : query.orderBy(asc(clients.code));
    } else if (sortBy === 'name') {
      query = sortOrder === 'desc'
        ? query.orderBy(desc(clients.companyName || clients.lastName || ''))
        : query.orderBy(asc(clients.companyName || clients.lastName || ''));
    } else {
      query = query.orderBy(desc(clients.createdAt));
    }

    const offset = (page - 1) * pageSize;
    const allPartners = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allPartners,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/partners', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createPartnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingPartner = await db
      .select()
      .from(clients)
      .where(eq(clients.code, data.code))
      .limit(1);

    if (existingPartner.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Client with this code already exists' },
        { status: 400 }
      );
    }

    const [newPartner] = await db
      .insert(clients)
      .values({
        code: data.code,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        cnp: data.cnp || null,
        birthDate: data.birthDate || null,
        companyName: data.companyName || null,
        cui: data.cui || null,
        regCom: data.regCom || null,
        address: data.address || null,
        city: data.city || null,
        county: data.county || null,
        postalCode: data.postalCode || null,
        phone: data.phone || null,
        email: data.email || null,
        bankName: data.bankName || null,
        iban: data.iban || null,
        notes: data.notes || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newPartner,
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/partners', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


