import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { stockMovements, warehouses, products, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

/**
 * GET /api/accounting/stock-levels - Get stock levels
 * Query params:
 * - warehouseId: filter by warehouse
 * - productId: filter by product
 * - parishId: filter by parish
 * - lowStock: only show products below minimum stock
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');
    const parishId = searchParams.get('parishId');
    const lowStock = searchParams.get('lowStock') === 'true';

    // Build base query for stock levels
    // Convert enum to text for comparison to handle both old and new enum types
    let query = db
      .select({
        warehouseId: stockMovements.warehouseId,
        productId: stockMovements.productId,
        quantity: sql<number>`COALESCE(SUM(CASE 
          WHEN ${stockMovements.type}::text = 'in' THEN ${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'out' THEN -${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'transfer' AND ${stockMovements.destinationWarehouseId} IS NOT NULL THEN -${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'transfer' AND ${stockMovements.destinationWarehouseId} IS NULL THEN ${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'adjustment' THEN ${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'return' THEN ${stockMovements.quantity}::numeric
          ELSE 0
        END), 0)`,
        totalValue: sql<number>`COALESCE(SUM(CASE 
          WHEN ${stockMovements.type}::text = 'in' THEN COALESCE(${stockMovements.totalValue}::numeric, 0)
          WHEN ${stockMovements.type}::text = 'out' THEN -COALESCE(${stockMovements.totalValue}::numeric, 0)
          WHEN ${stockMovements.type}::text = 'transfer' AND ${stockMovements.destinationWarehouseId} IS NOT NULL THEN -COALESCE(${stockMovements.totalValue}::numeric, 0)
          WHEN ${stockMovements.type}::text = 'transfer' AND ${stockMovements.destinationWarehouseId} IS NULL THEN COALESCE(${stockMovements.totalValue}::numeric, 0)
          WHEN ${stockMovements.type}::text = 'adjustment' THEN COALESCE(${stockMovements.totalValue}::numeric, 0)
          WHEN ${stockMovements.type}::text = 'return' THEN COALESCE(${stockMovements.totalValue}::numeric, 0)
          ELSE 0
        END), 0)`,
        lastMovementDate: sql<string>`MAX(${stockMovements.movementDate})`,
      })
      .from(stockMovements)
      .groupBy(stockMovements.warehouseId, stockMovements.productId);

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

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const stockLevels = await query;

    // Filter out zero quantities
    let filteredLevels = stockLevels.filter(level => Number(level.quantity) > 0);

    // If lowStock filter, join with products to check min_stock
    if (lowStock) {
      const productsWithMinStock = await db
        .select({
          id: products.id,
          minStock: products.minStock,
        })
        .from(products)
        .where(eq(products.trackStock, true));

      const minStockMap = new Map(
        productsWithMinStock.map(p => [p.id, p.minStock ? Number(p.minStock) : null])
      );

      filteredLevels = filteredLevels.filter(level => {
        const minStock = minStockMap.get(level.productId);
        if (minStock === null) return false;
        return Number(level.quantity) < minStock;
      });
    }

    // Enrich with warehouse and product details
    const enrichedLevels = await Promise.all(
      filteredLevels.map(async (level) => {
        const [warehouse] = await db
          .select({ id: warehouses.id, name: warehouses.name, code: warehouses.code })
          .from(warehouses)
          .where(eq(warehouses.id, level.warehouseId))
          .limit(1);

        const [product] = await db
          .select({
            id: products.id,
            name: products.name,
            code: products.code,
            unit: products.unit,
            minStock: products.minStock,
          })
          .from(products)
          .where(eq(products.id, level.productId))
          .limit(1);

        return {
          ...level,
          warehouse: warehouse || null,
          product: product || null,
          quantity: Number(level.quantity),
          totalValue: Number(level.totalValue),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedLevels,
    });
  } catch (error) {
    console.error('❌ Error fetching stock levels:', error);
    logError(error, { endpoint: '/api/accounting/stock-levels', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

