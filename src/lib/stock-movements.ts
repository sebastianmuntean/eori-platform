import { db } from '@/database/client';
import { stockMovements, invoices, products } from '@/database/schema';
import { eq, and, sql } from 'drizzle-orm';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vat?: number;
  total: number;
  productId?: string;
  warehouseId?: string;
  unitCost?: number;
}

/**
 * Generate stock movements from invoice items
 */
export async function generateStockMovementsFromInvoice(
  invoiceId: string,
  invoiceType: 'issued' | 'received',
  invoiceDate: string,
  invoiceItems: InvoiceItem[],
  parishId: string,
  clientId: string,
  userId: string
): Promise<void> {
  // Only process items that have productId and warehouseId
  const itemsWithStock = invoiceItems.filter(
    (item, index) => item.productId && item.warehouseId
  );

  if (itemsWithStock.length === 0) {
    return; // No stock items to process
  }

  // Determine movement type based on invoice type
  const movementType = invoiceType === 'issued' ? 'out' : 'in';

  // Create stock movements for each item
  for (let i = 0; i < itemsWithStock.length; i++) {
    const item = itemsWithStock[i];
    
    // Verify product exists and tracks stock
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId!))
      .limit(1);

    if (!product || !product.trackStock) {
      continue; // Skip if product doesn't exist or doesn't track stock
    }

    // Calculate unit cost (use provided unitCost or calculate from item)
    const unitCost = item.unitCost || (item.total / item.quantity);
    const totalValue = item.quantity * unitCost;

    // For 'out' movements, check stock availability
    if (movementType === 'out') {
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
            eq(stockMovements.warehouseId, item.warehouseId!),
            eq(stockMovements.productId, item.productId!)
          )
        );

      const currentStock = Number(stockResult[0]?.quantity || 0);
      
      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${product.name}. Available: ${currentStock}, Required: ${item.quantity}`
        );
      }
    }

    // Create stock movement
    await db.insert(stockMovements).values({
      warehouseId: item.warehouseId!,
      productId: item.productId!,
      parishId: parishId,
      type: movementType,
      movementDate: invoiceDate,
      quantity: item.quantity.toString(),
      unitCost: unitCost.toString(),
      totalValue: totalValue.toString(),
      invoiceId: invoiceId,
      invoiceItemIndex: i,
      documentType: 'invoice',
      documentNumber: invoiceId,
      documentDate: invoiceDate,
      clientId: clientId,
      notes: `Generated from invoice ${invoiceId}`,
      createdBy: userId,
    });
  }
}

/**
 * Reverse stock movements when invoice is cancelled
 */
export async function reverseStockMovementsFromInvoice(
  invoiceId: string,
  userId: string
): Promise<void> {
  // Find all stock movements linked to this invoice
  const movements = await db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.invoiceId, invoiceId));

  if (movements.length === 0) {
    return; // No movements to reverse
  }

  // Create reverse movements
  for (const movement of movements) {
    const reverseType = movement.type === 'in' ? 'out' : 'in';
    
    await db.insert(stockMovements).values({
      warehouseId: movement.warehouseId,
      productId: movement.productId,
      parishId: movement.parishId,
      type: reverseType,
      movementDate: new Date().toISOString().split('T')[0],
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      totalValue: movement.totalValue,
      invoiceId: movement.invoiceId,
      invoiceItemIndex: movement.invoiceItemIndex,
      documentType: 'invoice_cancellation',
      documentNumber: movement.documentNumber,
      documentDate: movement.documentDate,
      clientId: movement.clientId,
      notes: `Reversal of movement from cancelled invoice ${invoiceId}`,
      createdBy: userId,
    });
  }
}

