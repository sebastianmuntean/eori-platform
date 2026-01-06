import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { stockMovements, products, fixedAssets, warehouses } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError, NotFoundError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { isValidUUID, validateEnum } from '@/lib/api-utils/validation';
import { parsePaginationParams, calculatePagination } from '@/lib/api-utils/pagination';
import { createErrorResponse } from '@/lib/api-utils/error-handling';
import { eq, and, sql, inArray } from 'drizzle-orm';

/**
 * TypeScript interfaces for book inventory items
 */
interface BookInventoryItem {
  type: 'product' | 'fixed_asset';
  id: string;
  itemId: string;
  code: string;
  name: string;
  category: string | null;
  unit: string;
  quantity: number;
  value: number;
  warehouse: {
    id: string;
    name: string;
    code: string;
  } | null;
  location?: string | null;
}

interface BookInventoryResponse {
  success: true;
  data: BookInventoryItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  metadata?: {
    productsCount: number;
    fixedAssetsCount: number;
    filteredOutCount: number;
  };
}

/**
 * Build parish and warehouse filter conditions
 */
function buildParishWarehouseConditions(
  parishId: string | null,
  warehouseId: string | null,
  parishColumn: any,
  warehouseColumn?: any
) {
  const conditions = [];
  if (parishId) {
    conditions.push(eq(parishColumn, parishId));
  }
  if (warehouseId && warehouseColumn) {
    conditions.push(eq(warehouseColumn, warehouseId));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * GET /api/pangare/inventar/book-inventory
 * 
 * Retrieves book inventory data (products with stock + fixed assets) for inventory sessions.
 * 
 * @param {string} [parishId] - UUID of the parish to filter by (optional, but recommended)
 * @param {string} [warehouseId] - UUID of the warehouse to filter by (optional, requires parishId)
 * @param {string} [type] - Filter by item type: 'product', 'fixed_asset', or null for both (optional)
 * @param {number} [page] - Page number for pagination (default: 1)
 * @param {number} [limit] - Items per page (default: 100, max: 1000)
 * 
 * @returns {Promise<NextResponse>} JSON response with inventory items, pagination, and metadata
 * 
 * @example
 * GET /api/pangare/inventar/book-inventory?parishId=123&warehouseId=456&type=product&page=1&limit=50
 * 
 * @throws {401} If user is not authenticated
 * @throws {403} If user doesn't have access to the specified parish
 * @throws {400} If invalid parameters are provided (invalid UUIDs, warehouse doesn't belong to parish)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return createErrorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize input parameters
    const rawParishId = searchParams.get('parishId');
    const parishId = rawParishId && isValidUUID(rawParishId) ? rawParishId : null;
    
    const rawWarehouseId = searchParams.get('warehouseId');
    const warehouseId = rawWarehouseId && isValidUUID(rawWarehouseId) ? rawWarehouseId : null;
    
    const type = validateEnum(
      searchParams.get('type'),
      ['product', 'fixed_asset'] as const,
      null
    );

    // Parse pagination (with higher default for inventory data)
    const { page, pageSize, offset } = parsePaginationParams(searchParams);
    const maxPageSize = 1000; // Higher limit for inventory data
    const effectivePageSize = Math.min(maxPageSize, pageSize);

    // Authorization check - verify user has access to the parish
    let userParishId: string | null = null;
    try {
      if (parishId) {
        const access = await requireParishAccess(parishId, false);
        userParishId = access.userParishId;
      } else {
        // If no parishId provided, get user's parish for filtering
        const access = await requireParishAccess(null, false);
        userParishId = access.userParishId;
        
        // If user has a parish, use it for filtering
        if (!userParishId) {
          // User without parish - they might be super admin, but we still need a parish filter
          // For now, return error if no parish specified and user has no parish
          return createErrorResponse(
            'Parish ID is required or user must be assigned to a parish',
            400
          );
        }
      }
    } catch (error) {
      // Handle authorization and not found errors
      if (error instanceof AuthorizationError) {
        return createErrorResponse(error.message, 403);
      }
      if (error instanceof NotFoundError) {
        return createErrorResponse(error.message, 404);
      }
      throw error; // Re-throw if it's an unexpected error
    }

    // Use user's parish if no parishId was provided
    const effectiveParishId = parishId || userParishId;
    if (!effectiveParishId) {
      return createErrorResponse('Parish ID is required', 400);
    }

    // Validate warehouse exists and belongs to parish if warehouseId is provided
    if (warehouseId) {
      const [warehouse] = await db
        .select()
        .from(warehouses)
        .where(and(
          eq(warehouses.id, warehouseId),
          eq(warehouses.parishId, effectiveParishId)
        ))
        .limit(1);
      
      if (!warehouse) {
        return createErrorResponse(
          'Warehouse not found or does not belong to the specified parish',
          400
        );
      }
    }

    const result: BookInventoryItem[] = [];
    let filteredOutCount = 0;

    // Get products (inventory items)
    if (!type || type === 'product') {
      const whereClause = buildParishWarehouseConditions(
        effectiveParishId,
        warehouseId,
        stockMovements.parishId,
        stockMovements.warehouseId
      );

      // Get stock levels for products
      let stockQuery = db
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
        })
        .from(stockMovements)
        .groupBy(stockMovements.warehouseId, stockMovements.productId);

      const stockQueryWithWhere = whereClause ? stockQuery.where(whereClause) : stockQuery;
      const stockLevels = await stockQueryWithWhere;

      // Filter out zero or negative quantities before fetching related data
      const validLevels = stockLevels.filter(level => Number(level.quantity) > 0);

      if (validLevels.length === 0) {
        // No products with stock
      } else {
        // Batch fetch all products and warehouses to avoid N+1 queries
        const productIds = [...new Set(validLevels.map(level => level.productId))];
        const warehouseIds = [...new Set(validLevels.map(level => level.warehouseId))];

        const allProducts = await db
          .select()
          .from(products)
          .where(inArray(products.id, productIds));

        const allWarehouses = await db
          .select({ id: warehouses.id, name: warehouses.name, code: warehouses.code })
          .from(warehouses)
          .where(inArray(warehouses.id, warehouseIds));

        // Create lookup maps for O(1) access
        const productMap = new Map(allProducts.map(p => [p.id, p]));
        const warehouseMap = new Map(allWarehouses.map(w => [w.id, w]));

        // Enrich stock levels with product and warehouse details
        for (const level of validLevels) {
          const product = productMap.get(level.productId);
          if (!product) {
            filteredOutCount++;
            continue; // Product was deleted but has stock movements
          }
          
          if (!product.trackStock) {
            filteredOutCount++;
            continue; // Product doesn't track stock
          }

          const quantity = Number(level.quantity);
          const warehouse = warehouseMap.get(level.warehouseId) || null;

          result.push({
            type: 'product',
            id: product.id,
            itemId: product.id,
            code: product.code,
            name: product.name,
            category: product.category,
            unit: product.unit,
            quantity,
            value: Number(level.totalValue),
            warehouse: warehouse ? { id: warehouse.id, name: warehouse.name, code: warehouse.code } : null,
          });
        }
      }
    }

    // Get fixed assets
    if (!type || type === 'fixed_asset') {
      const whereClause = buildParishWarehouseConditions(
        effectiveParishId,
        null, // Fixed assets don't have warehouses
        fixedAssets.parishId
      );

      let assetsQuery = db
        .select()
        .from(fixedAssets)
        .where(
          whereClause
            ? and(eq(fixedAssets.status, 'active'), whereClause)
            : eq(fixedAssets.status, 'active')
        );

      const assets = await assetsQuery;

      for (const asset of assets) {
        result.push({
          type: 'fixed_asset',
          id: asset.id,
          itemId: asset.id,
          code: asset.inventoryNumber,
          name: asset.name,
          category: asset.category,
          unit: 'buc',
          quantity: 1, // Fixed assets are counted as 1 unit
          value: asset.currentValue ? parseFloat(asset.currentValue.toString()) : asset.acquisitionValue ? parseFloat(asset.acquisitionValue.toString()) : 0,
          location: asset.location,
          warehouse: null, // Fixed assets don't belong to warehouses
        });
      }
    }

    // Apply pagination to results
    const totalCount = result.length;
    const paginatedResult = result.slice(offset, offset + effectivePageSize);
    
    // Separate counts for metadata
    const productsCount = result.filter(item => item.type === 'product').length;
    const fixedAssetsCount = result.filter(item => item.type === 'fixed_asset').length;

    const response: BookInventoryResponse = {
      success: true,
      data: paginatedResult,
      pagination: calculatePagination(totalCount, page, effectivePageSize),
      metadata: {
        productsCount,
        fixedAssetsCount,
        filteredOutCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error fetching book inventory:', error);
    logError(error, { endpoint: '/api/pangare/inventar/book-inventory', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

