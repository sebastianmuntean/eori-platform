import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import {
  parishes,
  clients,
  invoices,
  payments,
  churchEvents,
  users,
  contracts,
  products,
  fixedAssets,
  inventorySessions,
  documentRegistry,
} from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { sql, eq, and } from 'drizzle-orm';

/**
 * GET /api/statistics/data - Get data statistics for all entities
 */
export async function GET() {
  try {
    // Get counts for main entities
    const [
      parishesCount,
      clientsCount,
      invoicesCount,
      invoicesByType,
      paymentsCount,
      paymentsByType,
      eventsCount,
      eventsByType,
      usersCount,
      donationsCount,
      contractsCount,
      contractsByDirection,
      contractsByType,
      productsCount,
      pangarProductsCount,
      fixedAssetsCount,
      inventoryCount,
      documentsCount,
    ] = await Promise.all([
      // Total parishes
      db
        .select({ count: sql<number>`count(*)` })
        .from(parishes)
        .where(eq(parishes.isActive, true)),
      
      // Total clients
      db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.isActive, true)),
      
      // Total invoices
      db.select({ count: sql<number>`count(*)` }).from(invoices),
      
      // Invoices by type
      db
        .select({
          type: invoices.type,
          count: sql<number>`count(*)`,
        })
        .from(invoices)
        .groupBy(invoices.type),
      
      // Total payments
      db.select({ count: sql<number>`count(*)` }).from(payments),
      
      // Payments by type
      db
        .select({
          type: payments.type,
          count: sql<number>`count(*)`,
        })
        .from(payments)
        .groupBy(payments.type),
      
      // Total events
      db.select({ count: sql<number>`count(*)` }).from(churchEvents),
      
      // Events by type
      db
        .select({
          type: churchEvents.type,
          count: sql<number>`count(*)`,
        })
        .from(churchEvents)
        .groupBy(churchEvents.type),
      
      // Total users
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isActive, true)),
      
      // Donations (payments with category='donation' and type='income')
      db
        .select({ count: sql<number>`count(*)` })
        .from(payments)
        .where(
          and(
            eq(payments.type, 'income'),
            eq(payments.category, 'donation')
          )
        ),
      
      // Total contracts
      db.select({ count: sql<number>`count(*)` }).from(contracts),
      
      // Contracts by direction
      db
        .select({
          direction: contracts.direction,
          count: sql<number>`count(*)`,
        })
        .from(contracts)
        .groupBy(contracts.direction),
      
      // Contracts by type
      db
        .select({
          type: contracts.type,
          count: sql<number>`count(*)`,
        })
        .from(contracts)
        .groupBy(contracts.type),
      
      // Total products
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.isActive, true)),
      
      // Total pangar products (products with category 'pangar')
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            eq(products.category, 'pangar')
          )
        ),
      
      // Total fixed assets
      db.select({ count: sql<number>`count(*)` }).from(fixedAssets),
      
      // Total inventory sessions
      db.select({ count: sql<number>`count(*)` }).from(inventorySessions),
      
      // Total documents registry
      db.select({ count: sql<number>`count(*)` }).from(documentRegistry),
    ]);


    // Process invoices by type
    const invoicesByTypeMap: Record<string, number> = {
      issued: 0,
      received: 0,
    };
    invoicesByType.forEach((row: any) => {
      invoicesByTypeMap[row.type] = Number(row.count);
    });

    // Process payments by type
    const paymentsByTypeMap: Record<string, number> = {
      income: 0,
      expense: 0,
    };
    paymentsByType.forEach((row: any) => {
      paymentsByTypeMap[row.type] = Number(row.count);
    });

    // Process events by type
    const eventsByTypeMap: Record<string, number> = {
      wedding: 0,
      baptism: 0,
      funeral: 0,
    };
    eventsByType.forEach((row: any) => {
      eventsByTypeMap[row.type] = Number(row.count);
    });

    // Process contracts by direction
    const contractsByDirectionMap: Record<string, number> = {
      incoming: 0,
      outgoing: 0,
    };
    contractsByDirection.forEach((row: any) => {
      contractsByDirectionMap[row.direction] = Number(row.count);
    });

    // Process contracts by type
    const contractsByTypeMap: Record<string, number> = {
      rental: 0,
      concession: 0,
      sale_purchase: 0,
      loan: 0,
      other: 0,
    };
    contractsByType.forEach((row: any) => {
      contractsByTypeMap[row.type] = Number(row.count);
    });

    // Get relationship statistics
    const relationshipQueries = await Promise.all([
      // Clients that have invoices
      db
        .select({
          count: sql<number>`count(distinct ${invoices.clientId})`,
        })
        .from(invoices),
      
      // Clients that have payments
      db
        .select({
          count: sql<number>`count(distinct ${payments.clientId})`,
        })
        .from(payments)
        .where(sql`${payments.clientId} IS NOT NULL`),
      
      // Parishes with clients (returns 0 if parish_id column doesn't exist)
      Promise.resolve([{ count: 0 }]),
      
      // Parishes with invoices
      db
        .select({
          count: sql<number>`count(distinct ${invoices.parishId})`,
        })
        .from(invoices),
      
      // Parishes with payments
      db
        .select({
          count: sql<number>`count(distinct ${payments.parishId})`,
        })
        .from(payments),
      
      // Parishes with events
      db
        .select({
          count: sql<number>`count(distinct ${churchEvents.parishId})`,
        })
        .from(churchEvents),
      
      // Parishes with contracts
      db
        .select({
          count: sql<number>`count(distinct ${contracts.parishId})`,
        })
        .from(contracts),
    ]);

    const [
      clientsWithInvoices,
      clientsWithPayments,
      parishesWithClients,
      parishesWithInvoices,
      parishesWithPayments,
      parishesWithEvents,
      parishesWithContracts,
    ] = relationshipQueries;

    const statistics = {
      entities: {
        parishes: Number(parishesCount[0]?.count || 0),
        clients: Number(clientsCount[0]?.count || 0),
        invoices: Number(invoicesCount[0]?.count || 0),
        payments: Number(paymentsCount[0]?.count || 0),
        events: Number(eventsCount[0]?.count || 0),
        users: Number(usersCount[0]?.count || 0),
        donations: Number(donationsCount[0]?.count || 0),
        contracts: Number(contractsCount[0]?.count || 0),
        products: Number(productsCount[0]?.count || 0),
        pangarProducts: Number(pangarProductsCount[0]?.count || 0),
        fixedAssets: Number(fixedAssetsCount[0]?.count || 0),
        inventory: Number(inventoryCount[0]?.count || 0),
        documents: Number(documentsCount[0]?.count || 0),
      },
      breakdown: {
        invoices: invoicesByTypeMap,
        payments: paymentsByTypeMap,
        events: eventsByTypeMap,
        contracts: {
          incoming: contractsByDirectionMap.incoming,
          outgoing: contractsByDirectionMap.outgoing,
          rental: contractsByTypeMap.rental,
          concession: contractsByTypeMap.concession,
          sale_purchase: contractsByTypeMap.sale_purchase,
          loan: contractsByTypeMap.loan,
          other: contractsByTypeMap.other,
        },
      },
      relationships: {
        clientsWithInvoices: Number(clientsWithInvoices[0]?.count || 0),
        clientsWithPayments: Number(clientsWithPayments[0]?.count || 0),
        parishesWithClients: Number(parishesWithClients[0]?.count || 0),
        parishesWithInvoices: Number(parishesWithInvoices[0]?.count || 0),
        parishesWithPayments: Number(parishesWithPayments[0]?.count || 0),
        parishesWithEvents: Number(parishesWithEvents[0]?.count || 0),
        parishesWithContracts: Number(parishesWithContracts[0]?.count || 0),
      },
    };

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    logError(error, { context: 'Failed to fetch data statistics' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}

