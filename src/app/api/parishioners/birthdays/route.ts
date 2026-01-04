import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, gte, lte, isNull, sql } from 'drizzle-orm';

/**
 * GET /api/parishioners/birthdays - Get upcoming birthdays
 * Query params: dateFrom, dateTo, parishId, daysAhead (default 30)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const parishId = searchParams.get('parishId');
    const daysAhead = parseInt(searchParams.get('daysAhead') || '30');

    const conditions = [
      eq(clients.isParishioner, true),
      isNull(clients.deletedAt),
      sql`${clients.birthDate} IS NOT NULL`,
    ];

    if (parishId) {
      conditions.push(eq(clients.parishId, parishId));
    }

    // Calculate date range
    const today = new Date();
    const fromDate = dateFrom || today.toISOString().split('T')[0];
    const toDate = dateTo || new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all parishioners with birthdays
    const allParishioners = await db
      .select({
        id: clients.id,
        code: clients.code,
        firstName: clients.firstName,
        lastName: clients.lastName,
        birthDate: clients.birthDate,
        phone: clients.phone,
        email: clients.email,
        parishId: clients.parishId,
      })
      .from(clients)
      .where(and(...conditions));

    // Filter by upcoming birthdays within date range
    const upcomingBirthdays = allParishioners
      .filter((p) => {
        if (!p.birthDate) return false;
        
        const birthDate = new Date(p.birthDate);
        // Validate date
        if (isNaN(birthDate.getTime())) {
          return false; // Skip invalid dates
        }
        
        const currentYear = today.getFullYear();
        const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        const nextYearBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
        
        // Check if birthday is in the date range
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        // Validate date range
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
          return false;
        }
        
        return (thisYearBirthday >= from && thisYearBirthday <= to) ||
               (nextYearBirthday >= from && nextYearBirthday <= to);
      })
      .map((p) => {
        const birthDate = new Date(p.birthDate!);
        const currentYear = today.getFullYear();
        const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        const nextYearBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        let upcomingDate = thisYearBirthday >= from && thisYearBirthday <= to 
          ? thisYearBirthday 
          : nextYearBirthday;
        
        const age = currentYear - birthDate.getFullYear();
        const daysUntil = Math.ceil((upcomingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...p,
          upcomingBirthday: upcomingDate.toISOString().split('T')[0],
          age: age + (upcomingDate.getFullYear() > currentYear ? 1 : 0),
          daysUntil,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.upcomingBirthday).getTime();
        const dateB = new Date(b.upcomingBirthday).getTime();
        return dateA - dateB;
      });

    return NextResponse.json({
      success: true,
      data: upcomingBirthdays,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/birthdays', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

