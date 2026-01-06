import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients, parishes, parishionerTypes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, like, or, and, ilike, sql, gte, lte, isNull } from 'drizzle-orm';
import { z } from 'zod';

/**
 * GET /api/parishioners/search - Complex search across parishioners
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100); // Max 100 items per page
    
    // Search fields
    const search = (searchParams.get('search') || '').trim().substring(0, 255); // Limit length and sanitize
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const cnp = searchParams.get('cnp');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const address = searchParams.get('address');
    const city = searchParams.get('city');
    
    // Filters
    const parishId = searchParams.get('parishId');
    const parishionerTypeId = searchParams.get('parishionerTypeId');
    const isParishioner = searchParams.get('isParishioner');
    const isActive = searchParams.get('isActive');
    
    // Date filters
    const birthDateFrom = searchParams.get('birthDateFrom');
    const birthDateTo = searchParams.get('birthDateTo');
    const nameDayFrom = searchParams.get('nameDayFrom');
    const nameDayTo = searchParams.get('nameDayTo');
    
    const sortBy = searchParams.get('sortBy') || 'code';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const conditions = [];

    // Always filter non-deleted
    conditions.push(isNull(clients.deletedAt));

    // General search across multiple fields
    if (search) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(clients.code, searchPattern),
          sql`COALESCE(${clients.firstName}, '') ILIKE ${searchPattern}`,
          sql`COALESCE(${clients.lastName}, '') ILIKE ${searchPattern}`,
          sql`COALESCE(${clients.companyName}, '') ILIKE ${searchPattern}`,
          sql`COALESCE(${clients.cnp}, '') ILIKE ${searchPattern}`,
          sql`COALESCE(${clients.phone}, '') ILIKE ${searchPattern}`,
          sql`COALESCE(${clients.email}, '') ILIKE ${searchPattern}`,
          sql`COALESCE(${clients.city}, '') ILIKE ${searchPattern}`,
          sql`COALESCE(${clients.address}, '') ILIKE ${searchPattern}`,
          sql`CONCAT(COALESCE(${clients.firstName}, ''), ' ', COALESCE(${clients.lastName}, '')) ILIKE ${searchPattern}`
        )!
      );
    }

    // Specific field searches
    if (firstName) {
      conditions.push(ilike(clients.firstName || '', `%${firstName}%`));
    }
    if (lastName) {
      conditions.push(ilike(clients.lastName || '', `%${lastName}%`));
    }
    if (cnp) {
      conditions.push(eq(clients.cnp, cnp));
    }
    if (phone) {
      conditions.push(ilike(clients.phone || '', `%${phone}%`));
    }
    if (email) {
      conditions.push(ilike(clients.email || '', `%${email}%`));
    }
    if (address) {
      conditions.push(ilike(clients.address || '', `%${address}%`));
    }
    if (city) {
      conditions.push(ilike(clients.city || '', `%${city}%`));
    }

    // Filters
    if (parishId) {
      conditions.push(eq(clients.parishId, parishId));
    }
    if (parishionerTypeId) {
      conditions.push(eq(clients.parishionerTypeId, parishionerTypeId));
    }
    if (isParishioner !== null && isParishioner !== undefined) {
      conditions.push(eq(clients.isParishioner, isParishioner === 'true'));
    }
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(clients.isActive, isActive === 'true'));
    }

    // Date filters
    if (birthDateFrom) {
      conditions.push(gte(clients.birthDate, birthDateFrom));
    }
    if (birthDateTo) {
      conditions.push(lte(clients.birthDate, birthDateTo));
    }
    if (nameDayFrom) {
      conditions.push(gte(clients.nameDay, nameDayFrom));
    }
    if (nameDayTo) {
      conditions.push(lte(clients.nameDay, nameDayTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(whereClause);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Build query
    const baseQuery = db.select().from(clients);
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;

    // Order by
    let queryWithOrder;
    if (sortBy === 'code') {
      queryWithOrder = sortOrder === 'desc' 
        ? queryWithWhere.orderBy(sql`${clients.code} DESC`)
        : queryWithWhere.orderBy(sql`${clients.code} ASC`);
    } else if (sortBy === 'name') {
      queryWithOrder = sortOrder === 'desc'
        ? queryWithWhere.orderBy(sql`CONCAT(COALESCE(${clients.firstName}, ''), ' ', COALESCE(${clients.lastName}, '')) DESC`)
        : queryWithWhere.orderBy(sql`CONCAT(COALESCE(${clients.firstName}, ''), ' ', COALESCE(${clients.lastName}, '')) ASC`);
    } else {
      queryWithOrder = queryWithWhere.orderBy(sql`${clients.createdAt} DESC`);
    }

    // Pagination
    const offset = (page - 1) * pageSize;
    const results = await queryWithOrder.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/search', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

