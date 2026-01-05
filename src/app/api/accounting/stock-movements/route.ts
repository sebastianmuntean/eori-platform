import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { stockMovements, warehouses, products, parishes, clients, invoices } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, like, or, desc, asc, and, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const createStockMovementSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  productId: z.string().uuid('Invalid product ID'),
  parishId: z.string().uuid('Invalid parish ID'),
  type: z.enum(['in', 'out', 'transfer', 'adjustment', 'return']),
  movementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Movement date must be in YYYY-MM-DD format'),
  quantity: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Quantity must be a valid number'),
  unitCost: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Unit cost must be a valid number').optional().nullable(),
  totalValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Total value must be a valid number').optional().nullable(),
  invoiceId: z.string().uuid('Invalid invoice ID').optional().nullable(),
  invoiceItemIndex: z.number().int().optional().nullable(),
  documentType: z.string().max(50).optional().nullable(),
  documentNumber: z.string().max(50).optional().nullable(),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Document date must be in YYYY-MM-DD format').optional().nullable(),
  clientId: z.string().uuid('Invalid client ID').optional().nullable(),
  destinationWarehouseId: z.string().uuid('Invalid destination warehouse ID').optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/accounting/stock-movements - Fetch all stock movements with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const parishId = searchParams.get('parishId');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const invoiceId = searchParams.get('invoiceId');
    const clientId = searchParams.get('clientId');
    const sortBy = searchParams.get('sortBy') || 'movementDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query conditions
    const conditions = [];

    if (warehouseId) {
      conditions.push(eq(stockMovements.warehouseId, warehouseId));
    }

    if (productId) {
      conditions.push(eq(stockMovements.productId, productId));
    }

    if (parishId) {
      conditions.push(eq(stockMovements.parishId, parishId));
    }

    if (type) {
      conditions.push(eq(stockMovements.type, type as 'in' | 'out' | 'transfer' | 'adjustment' | 'return'));
    }

    if (dateFrom) {
      conditions.push(gte(stockMovements.movementDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(stockMovements.movementDate, dateTo));
    }

    if (invoiceId) {
      conditions.push(eq(stockMovements.invoiceId, invoiceId));
    }

    if (clientId) {
      conditions.push(eq(stockMovements.clientId, clientId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by clause
    let orderBy;
    if (sortBy === 'movementDate') {
      orderBy = sortOrder === 'desc' ? desc(stockMovements.movementDate) : asc(stockMovements.movementDate);
    } else if (sortBy === 'createdAt') {
      orderBy = sortOrder === 'desc' ? desc(stockMovements.createdAt) : asc(stockMovements.createdAt);
    } else {
      orderBy = desc(stockMovements.movementDate);
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(stockMovements)
      .where(whereClause);
    
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(stockMovements);
    if (whereClause) {
      query = query.where(whereClause);
    }

    const allMovements = await query.orderBy(orderBy).limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allMovements,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching stock movements:', error);
    logError(error, { endpoint: '/api/accounting/stock-movements', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/accounting/stock-movements - Create a new stock movement
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createStockMovementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate warehouse exists
    const [existingWarehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, data.warehouseId))
      .limit(1);

    if (!existingWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found' },
        { status: 400 }
      );
    }

    // Validate product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 400 }
      );
    }

    // Validate product tracks stock
    if (!existingProduct.trackStock) {
      return NextResponse.json(
        { success: false, error: 'Product does not track stock' },
        { status: 400 }
      );
    }

    // Validate destination warehouse for transfers
    if (data.type === 'transfer' && !data.destinationWarehouseId) {
      return NextResponse.json(
        { success: false, error: 'Destination warehouse is required for transfers' },
        { status: 400 }
      );
    }

    if (data.destinationWarehouseId) {
      const [destWarehouse] = await db
        .select()
        .from(warehouses)
        .where(eq(warehouses.id, data.destinationWarehouseId))
        .limit(1);

      if (!destWarehouse) {
        return NextResponse.json(
          { success: false, error: 'Destination warehouse not found' },
          { status: 400 }
        );
      }
    }

    // Calculate total value if not provided
    let totalValue = data.totalValue;
    if (!totalValue && data.unitCost) {
      totalValue = (parseFloat(data.quantity) * parseFloat(data.unitCost)).toFixed(2);
    }

    // Check stock availability for 'out' movements
    if (data.type === 'out') {
      // Calculate current stock
      const stockResult = await db
        .select({
          quantity: sql<number>`COALESCE(SUM(CASE 
            WHEN type = 'in' THEN quantity::numeric
            WHEN type = 'out' THEN -quantity::numeric
            WHEN type = 'transfer' AND destination_warehouse_id IS NOT NULL THEN -quantity::numeric
            WHEN type = 'transfer' AND destination_warehouse_id IS NULL THEN quantity::numeric
            WHEN type = 'adjustment' THEN quantity::numeric
            WHEN type = 'return' THEN quantity::numeric
            ELSE 0
          END), 0)`,
        })
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.warehouseId, data.warehouseId),
            eq(stockMovements.productId, data.productId)
          )
        );

      const currentStock = Number(stockResult[0]?.quantity || 0);
      const requestedQuantity = parseFloat(data.quantity);

      if (currentStock < requestedQuantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock. Available: ${currentStock}, Requested: ${requestedQuantity}` },
          { status: 400 }
        );
      }
    }

    // Create stock movement
    const [newMovement] = await db
      .insert(stockMovements)
      .values({
        ...data,
        totalValue: totalValue || null,
        createdBy: userId,
      })
      .returning();

    // If transfer, create the corresponding movement in destination warehouse
    if (data.type === 'transfer' && data.destinationWarehouseId) {
      await db
        .insert(stockMovements)
        .values({
          warehouseId: data.destinationWarehouseId,
          productId: data.productId,
          parishId: data.parishId,
          type: 'in',
          movementDate: data.movementDate,
          quantity: data.quantity,
          unitCost: data.unitCost,
          totalValue: totalValue || null,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          documentDate: data.documentDate,
          clientId: data.clientId,
          notes: `Transfer from warehouse ${existingWarehouse.name}`,
          createdBy: userId,
        });
    }

    return NextResponse.json({
      success: true,
      data: newMovement,
    });
  } catch (error) {
    console.error('❌ Error creating stock movement:', error);
    logError(error, { endpoint: '/api/accounting/stock-movements', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

