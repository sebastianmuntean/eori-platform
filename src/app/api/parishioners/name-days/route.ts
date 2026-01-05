import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, gte, lte, isNull, sql } from 'drizzle-orm';

/**
 * GET /api/parishioners/name-days - Get upcoming name days
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
      sql`${clients.nameDay} IS NOT NULL`,
    ];

    if (parishId) {
      conditions.push(eq(clients.parishId, parishId));
    }

    // Calculate date range
    const today = new Date();
    const fromDate = dateFrom || today.toISOString().split('T')[0];
    const toDate = dateTo || new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all parishioners with name days
    const allParishioners = await db
      .select({
        id: clients.id,
        code: clients.code,
        firstName: clients.firstName,
        lastName: clients.lastName,
        nameDay: clients.nameDay,
        phone: clients.phone,
        email: clients.email,
        parishId: clients.parishId,
      })
      .from(clients)
      .where(and(...conditions));

    // Filter by upcoming name days within date range
    const upcomingNameDays = allParishioners
      .filter((p) => {
        if (!p.nameDay) return false;
        
        const nameDayDate = new Date(p.nameDay);
        // Validate date
        if (isNaN(nameDayDate.getTime())) {
          return false; // Skip invalid dates
        }
        
        const currentYear = today.getFullYear();
        const thisYearNameDay = new Date(currentYear, nameDayDate.getMonth(), nameDayDate.getDate());
        const nextYearNameDay = new Date(currentYear + 1, nameDayDate.getMonth(), nameDayDate.getDate());
        
        // Check if name day is in the date range
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        // Validate date range
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
          return false;
        }
        
        return (thisYearNameDay >= from && thisYearNameDay <= to) ||
               (nextYearNameDay >= from && nextYearNameDay <= to);
      })
      .map((p) => {
        const nameDayDate = new Date(p.nameDay!);
        const currentYear = today.getFullYear();
        const thisYearNameDay = new Date(currentYear, nameDayDate.getMonth(), nameDayDate.getDate());
        const nextYearNameDay = new Date(currentYear + 1, nameDayDate.getMonth(), nameDayDate.getDate());
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        let upcomingDate = thisYearNameDay >= from && thisYearNameDay <= to 
          ? thisYearNameDay 
          : nextYearNameDay;
        
        const daysUntil = Math.ceil((upcomingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...p,
          upcomingNameDay: upcomingDate.toISOString().split('T')[0],
          daysUntil,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.upcomingNameDay).getTime();
        const dateB = new Date(b.upcomingNameDay).getTime();
        return dateA - dateB;
      });

    return NextResponse.json({
      success: true,
      data: upcomingNameDays,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/name-days', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

