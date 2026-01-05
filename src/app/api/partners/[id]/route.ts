import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updatePartnerSchema = z.object({
  code: z.string().min(1).max(50).optional(),
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
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [partner] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/partners/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updatePartnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    if (data.code) {
      const existingPartner = await db
        .select()
        .from(clients)
        .where(eq(clients.code, data.code))
        .limit(1);

      if (existingPartner.length > 0 && existingPartner[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'Client with this code already exists' },
          { status: 400 }
        );
      }
    }

    // Filter out undefined values and fields that don't exist in clients schema
    const updateData: Record<string, any> = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.cnp !== undefined) updateData.cnp = data.cnp;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.cui !== undefined) updateData.cui = data.cui;
    if (data.regCom !== undefined) updateData.regCom = data.regCom;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.county !== undefined) updateData.county = data.county;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.iban !== undefined) updateData.iban = data.iban;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    updateData.updatedAt = new Date();

    const [updatedPartner] = await db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();

    if (!updatedPartner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPartner,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/partners/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deletedPartner] = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning();

    if (!deletedPartner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedPartner,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/partners/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


