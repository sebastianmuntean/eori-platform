import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import {
  clients,
  invoices,
  payments,
  churchEvents,
  contracts,
  products,
  fixedAssets,
  inventorySessions,
  inventoryItems,
  documentRegistry,
  users,
  stockMovements,
} from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, or, like, sql } from 'drizzle-orm';

interface DeleteFakeDataRequest {
  type: 'partners' | 'clients' | 'invoices' | 'payments' | 'events' | 'contracts' | 'products' | 'pangarProducts' | 'fixedAssets' | 'inventory' | 'documents' | 'users';
}

/**
 * DELETE /api/statistics/delete-fake-data - Delete fake data by type
 */
export async function DELETE(request: Request) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as DeleteFakeDataRequest['type'] | null;

    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'Type is required',
      }, { status: 400 });
    }

    const validTypes: DeleteFakeDataRequest['type'][] = [
      'partners', 'clients', 'invoices', 'payments', 'events', 
      'contracts', 'products', 'pangarProducts', 'fixedAssets', 
      'inventory', 'documents', 'users'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid type',
      }, { status: 400 });
    }

    let deletedCount = 0;
    const errors: string[] = [];

    try {
      switch (type) {
        case 'partners':
        case 'clients': {
          // Delete clients (both partners and clients are in the same table)
          // Delete by code pattern (AUTO-*, CLI-*, SUP-*)
          // Get count before deletion
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(clients)
            .where(
              or(
                like(clients.code, 'AUTO-%'),
                like(clients.code, 'CLI-%'),
                like(clients.code, 'SUP-%')
              )
            );
          deletedCount = countResult[0]?.count || 0;
          await db
            .delete(clients)
            .where(
              or(
                like(clients.code, 'AUTO-%'),
                like(clients.code, 'CLI-%'),
                like(clients.code, 'SUP-%')
              )
            );
          break;
        }

        case 'invoices': {
          // Delete invoices by invoice number pattern (INV-*)
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(like(invoices.invoiceNumber, 'INV-%'));
          deletedCount = countResult[0]?.count || 0;
          await db
            .delete(invoices)
            .where(like(invoices.invoiceNumber, 'INV-%'));
          break;
        }

        case 'payments': {
          // Delete payments by payment number pattern (PAY-*)
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(payments)
            .where(like(payments.paymentNumber, 'PAY-%'));
          deletedCount = countResult[0]?.count || 0;
          await db
            .delete(payments)
            .where(like(payments.paymentNumber, 'PAY-%'));
          break;
        }

        case 'events': {
          // Delete church events
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(churchEvents);
          deletedCount = countResult[0]?.count || 0;
          // Delete all events (we can't easily distinguish fake ones)
          await db.delete(churchEvents);
          break;
        }

        case 'contracts': {
          // Delete contracts by contract number pattern (CTR-*)
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(contracts)
            .where(like(contracts.contractNumber, 'CTR-%'));
          deletedCount = countResult[0]?.count || 0;
          await db
            .delete(contracts)
            .where(like(contracts.contractNumber, 'CTR-%'));
          break;
        }

        case 'products': {
          // Delete products by code pattern (PROD-*)
          // First delete stock movements for these products
          const productsToDelete = await db
            .select({ id: products.id })
            .from(products)
            .where(like(products.code, 'PROD-%'));
          
          deletedCount = productsToDelete.length;
          
          if (productsToDelete.length > 0) {
            const productIds = productsToDelete.map(p => p.id);
            // Delete stock movements using IN clause
            for (const productId of productIds) {
              await db
                .delete(stockMovements)
                .where(eq(stockMovements.productId, productId));
            }
          }

          await db
            .delete(products)
            .where(like(products.code, 'PROD-%'));
          break;
        }

        case 'pangarProducts': {
          // Delete pangar products (products with category 'pangar' and code pattern PROD-*)
          const productsToDelete = await db
            .select({ id: products.id })
            .from(products)
            .where(
              sql`${products.category} = 'pangar' AND ${products.code} LIKE 'PROD-%'`
            );
          
          deletedCount = productsToDelete.length;
          
          if (productsToDelete.length > 0) {
            const productIds = productsToDelete.map(p => p.id);
            // Delete stock movements using IN clause
            for (const productId of productIds) {
              await db
                .delete(stockMovements)
                .where(eq(stockMovements.productId, productId));
            }
          }

          await db
            .delete(products)
            .where(
              sql`${products.category} = 'pangar' AND ${products.code} LIKE 'PROD-%'`
            );
          break;
        }

        case 'fixedAssets': {
          // Delete fixed assets by inventory number pattern (INV-*)
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(fixedAssets)
            .where(like(fixedAssets.inventoryNumber, 'INV-%'));
          deletedCount = countResult[0]?.count || 0;
          await db
            .delete(fixedAssets)
            .where(like(fixedAssets.inventoryNumber, 'INV-%'));
          break;
        }

        case 'inventory': {
          // Delete inventory sessions and their items
          const sessionsToDelete = await db
            .select({ id: inventorySessions.id })
            .from(inventorySessions);
          
          deletedCount = sessionsToDelete.length;
          
          if (sessionsToDelete.length > 0) {
            const sessionIds = sessionsToDelete.map(s => s.id);
            // Delete inventory items for each session
            for (const sessionId of sessionIds) {
              await db
                .delete(inventoryItems)
                .where(eq(inventoryItems.sessionId, sessionId));
            }
          }

          await db.delete(inventorySessions);
          break;
        }

        case 'documents': {
          // Delete documents from registry (soft delete by setting deletedAt)
          // We'll do a hard delete for fake data
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(documentRegistry);
          deletedCount = countResult[0]?.count || 0;
          // Delete all documents (we can't easily distinguish fake ones)
          await db.delete(documentRegistry);
          break;
        }

        case 'users': {
          // Delete users (be careful - only delete fake ones)
          // We'll delete users with example.com emails (fake generated users)
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(like(users.email, '%@example.com'));
          deletedCount = countResult[0]?.count || 0;
          await db
            .delete(users)
            .where(like(users.email, '%@example.com'));
          break;
        }
      }
    } catch (error: any) {
      errors.push(`Error deleting ${type}: ${error.message}`);
      logError(`Error deleting fake ${type} data`, error);
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: errors.join('; '),
        deletedCount,
      });
    }

    const typeNames: Record<DeleteFakeDataRequest['type'], string> = {
      partners: 'parteneri',
      clients: 'clienți',
      invoices: 'facturi',
      payments: 'plăți',
      events: 'evenimente',
      contracts: 'contracte',
      products: 'produse',
      pangarProducts: 'produse pangar',
      fixedAssets: 'mijloace fixe',
      inventory: 'inventar',
      documents: 'documente registratură',
      users: 'utilizatori',
    };

    return NextResponse.json({
      success: true,
      message: `Șters cu succes: ${deletedCount} ${typeNames[type]}`,
      deletedCount,
    });
  } catch (error) {
    logError('Failed to delete fake data', error);
    return formatErrorResponse(error, 'Failed to delete fake data');
  }
}

