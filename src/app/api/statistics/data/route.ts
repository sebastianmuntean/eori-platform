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

// Type definitions for grouped query results
type GroupedResult<T extends string> = {
  [K in T]: string | null;
} & {
  count: string | number;
};

type CountResult = { count: string | number };

// Helper function to extract count from query result
const extractCount = (result: CountResult[]): number => {
  return Number(result[0]?.count ?? 0);
};

// Helper function to process grouped results into a map with default values
const processGroupedResults = <T extends string>(
  results: GroupedResult<T>[],
  keyField: T,
  defaultValues: Record<string, number>
): Record<string, number> => {
  const map = { ...defaultValues };
  results.forEach((row) => {
    const key = row[keyField];
    if (key && typeof key === 'string') {
      map[key] = Number(row.count);
    }
  });
  return map;
};

// Type-safe constants for enum values
const INVOICE_TYPES = ['issued', 'received'] as const;
const PAYMENT_TYPES = ['income', 'expense'] as const;
const EVENT_TYPES = ['wedding', 'baptism', 'funeral'] as const;
const CONTRACT_DIRECTIONS = ['incoming', 'outgoing'] as const;
const CONTRACT_TYPES = ['rental', 'concession', 'sale_purchase', 'loan', 'other'] as const;

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

    // Process grouped results into maps
    const invoicesByTypeMap = processGroupedResults(
      invoicesByType as GroupedResult<'type'>[],
      'type',
      Object.fromEntries(INVOICE_TYPES.map((type) => [type, 0]))
    );

    const paymentsByTypeMap = processGroupedResults(
      paymentsByType as GroupedResult<'type'>[],
      'type',
      Object.fromEntries(PAYMENT_TYPES.map((type) => [type, 0]))
    );

    const eventsByTypeMap = processGroupedResults(
      eventsByType as GroupedResult<'type'>[],
      'type',
      Object.fromEntries(EVENT_TYPES.map((type) => [type, 0]))
    );

    const contractsByDirectionMap = processGroupedResults(
      contractsByDirection as GroupedResult<'direction'>[],
      'direction',
      Object.fromEntries(CONTRACT_DIRECTIONS.map((direction) => [direction, 0]))
    );

    const contractsByTypeMap = processGroupedResults(
      contractsByType as GroupedResult<'type'>[],
      'type',
      Object.fromEntries(CONTRACT_TYPES.map((type) => [type, 0]))
    );

    // Get relationship statistics
    const [
      clientsWithInvoices,
      clientsWithPayments,
      parishesWithClients,
      parishesWithInvoices,
      parishesWithPayments,
      parishesWithEvents,
      parishesWithContracts,
    ] = await Promise.all([
      db
        .select({
          count: sql<number>`count(distinct ${invoices.clientId})`,
        })
        .from(invoices),
      db
        .select({
          count: sql<number>`count(distinct ${payments.clientId})`,
        })
        .from(payments)
        .where(sql`${payments.clientId} IS NOT NULL`),
      // Parishes with clients (returns 0 if parish_id column doesn't exist)
      Promise.resolve<CountResult[]>([{ count: 0 }]),
      db
        .select({
          count: sql<number>`count(distinct ${invoices.parishId})`,
        })
        .from(invoices),
      db
        .select({
          count: sql<number>`count(distinct ${payments.parishId})`,
        })
        .from(payments),
      db
        .select({
          count: sql<number>`count(distinct ${churchEvents.parishId})`,
        })
        .from(churchEvents),
      db
        .select({
          count: sql<number>`count(distinct ${contracts.parishId})`,
        })
        .from(contracts),
    ]);

    const statistics = {
      entities: {
        parishes: extractCount(parishesCount),
        clients: extractCount(clientsCount),
        invoices: extractCount(invoicesCount),
        payments: extractCount(paymentsCount),
        events: extractCount(eventsCount),
        users: extractCount(usersCount),
        donations: extractCount(donationsCount),
        contracts: extractCount(contractsCount),
        products: extractCount(productsCount),
        pangarProducts: extractCount(pangarProductsCount),
        fixedAssets: extractCount(fixedAssetsCount),
        inventory: extractCount(inventoryCount),
        documents: extractCount(documentsCount),
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
        clientsWithInvoices: extractCount(clientsWithInvoices),
        clientsWithPayments: extractCount(clientsWithPayments),
        parishesWithClients: extractCount(parishesWithClients),
        parishesWithInvoices: extractCount(parishesWithInvoices),
        parishesWithPayments: extractCount(parishesWithPayments),
        parishesWithEvents: extractCount(parishesWithEvents),
        parishesWithContracts: extractCount(parishesWithContracts),
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

