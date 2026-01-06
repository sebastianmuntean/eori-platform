import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients, invoices, payments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { isValidUUID, isValidDateString } from '@/lib/api-utils/validation';
import { eq, and, gte, lte, isNull, SQL } from 'drizzle-orm';

// Type definitions
type InvoiceType = 'issued' | 'received';
type PaymentType = 'income' | 'expense';

interface StatementSummary {
  issuedInvoices: number;
  receivedInvoices: number;
  paymentsReceived: number;
  paymentsMade: number;
  balance: number;
  issuedInvoicesCount: number;
  receivedInvoicesCount: number;
  paymentsReceivedCount: number;
  paymentsMadeCount: number;
}

/**
 * Validate and parse date query parameter
 * @param dateParam - Date string from query parameter
 * @returns Validated date string or null
 */
function validateDateParam(dateParam: string | null): string | null {
  if (!dateParam) return null;
  return isValidDateString(dateParam) ? dateParam : null;
}

/**
 * Build invoice filter conditions
 * @param clientId - Client ID
 * @param dateFrom - Start date filter
 * @param dateTo - End date filter
 * @param invoiceType - Invoice type filter
 * @param invoiceStatus - Invoice status filter
 * @returns SQL where clause or undefined
 */
function buildInvoiceConditions(
  clientId: string,
  dateFrom: string | null,
  dateTo: string | null,
  invoiceType: string | null,
  invoiceStatus: string | null
): SQL | undefined {
  const conditions: SQL[] = [eq(invoices.clientId, clientId)];
  
  if (dateFrom) {
    conditions.push(gte(invoices.date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(invoices.date, dateTo));
  }
  if (invoiceType === 'issued' || invoiceType === 'received') {
    conditions.push(eq(invoices.type, invoiceType));
  }
  if (invoiceStatus) {
    // Validate invoice status is one of the valid enum values
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
    if (validStatuses.includes(invoiceStatus as any)) {
      conditions.push(eq(invoices.status, invoiceStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'));
    }
  }
  
  return conditions.length > 0 
    ? (conditions.length === 1 ? conditions[0] : and(...conditions))
    : undefined;
}

/**
 * Build payment filter conditions
 * @param clientId - Client ID
 * @param dateFrom - Start date filter
 * @param dateTo - End date filter
 * @param paymentType - Payment type filter
 * @returns SQL where clause or undefined
 */
function buildPaymentConditions(
  clientId: string,
  dateFrom: string | null,
  dateTo: string | null,
  paymentType: string | null
): SQL | undefined {
  const conditions: SQL[] = [eq(payments.clientId, clientId)];
  
  if (dateFrom) {
    conditions.push(gte(payments.date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(payments.date, dateTo));
  }
  if (paymentType === 'income' || paymentType === 'expense') {
    conditions.push(eq(payments.type, paymentType));
  }
  
  return conditions.length > 0 
    ? (conditions.length === 1 ? conditions[0] : and(...conditions))
    : undefined;
}

/**
 * Calculate statement summary from invoices and payments
 * @param allInvoices - All filtered invoices
 * @param allPayments - All filtered payments
 * @returns Statement summary with totals and counts
 */
function calculateStatementSummary(
  allInvoices: Array<{ type: string; total: string | null }>,
  allPayments: Array<{ type: string; amount: string | null }>
): StatementSummary {
  const issuedInvoices = allInvoices.filter(inv => inv.type === 'issued');
  const receivedInvoices = allInvoices.filter(inv => inv.type === 'received');
  
  const issuedInvoicesTotal = issuedInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total || '0'),
    0
  );
  const receivedInvoicesTotal = receivedInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total || '0'),
    0
  );

  const paymentsReceived = allPayments.filter(pay => pay.type === 'income');
  const paymentsMade = allPayments.filter(pay => pay.type === 'expense');
  
  const paymentsReceivedTotal = paymentsReceived.reduce(
    (sum, pay) => sum + parseFloat(pay.amount || '0'),
    0
  );
  const paymentsMadeTotal = paymentsMade.reduce(
    (sum, pay) => sum + parseFloat(pay.amount || '0'),
    0
  );

  // Calculate balance
  // For clients: positive balance = client owes us, negative = we owe client
  // Balance = (issued invoices - received invoices) + (payments received - payments made)
  const balance = (issuedInvoicesTotal - receivedInvoicesTotal) + (paymentsReceivedTotal - paymentsMadeTotal);

  return {
    issuedInvoices: issuedInvoicesTotal,
    receivedInvoices: receivedInvoicesTotal,
    paymentsReceived: paymentsReceivedTotal,
    paymentsMade: paymentsMadeTotal,
    balance,
    issuedInvoicesCount: issuedInvoices.length,
    receivedInvoicesCount: receivedInvoices.length,
    paymentsReceivedCount: paymentsReceived.length,
    paymentsMadeCount: paymentsMade.length,
  };
}

/**
 * GET /api/clients/[id]/statement - Get client financial statement
 * 
 * Query parameters:
 * - dateFrom: Start date filter (YYYY-MM-DD)
 * - dateTo: End date filter (YYYY-MM-DD)
 * - invoiceType: Filter by invoice type (issued, received)
 * - invoiceStatus: Filter by invoice status
 * - paymentType: Filter by payment type (income, expense)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing client ID
 * @returns Client financial statement with invoices, payments, and summary
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID format' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and parse date parameters
    const dateFrom = validateDateParam(searchParams.get('dateFrom'));
    const dateTo = validateDateParam(searchParams.get('dateTo'));
    
    if (searchParams.get('dateFrom') && !dateFrom) {
      return NextResponse.json(
        { success: false, error: 'Invalid dateFrom format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    if (searchParams.get('dateTo') && !dateTo) {
      return NextResponse.json(
        { success: false, error: 'Invalid dateTo format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const invoiceType = searchParams.get('invoiceType');
    const invoiceStatus = searchParams.get('invoiceStatus');
    const paymentType = searchParams.get('paymentType');

    // Get client information (excluding deleted clients)
    const [client] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, id),
          isNull(clients.deletedAt)
        )
      )
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Build and execute invoice query
    const invoiceWhereClause = buildInvoiceConditions(
      id,
      dateFrom,
      dateTo,
      invoiceType,
      invoiceStatus
    );
    
    const allInvoices = await (invoiceWhereClause
      ? db.select().from(invoices).where(invoiceWhereClause).orderBy(invoices.date)
      : db.select().from(invoices).orderBy(invoices.date)
    );

    // Build and execute payment query
    const paymentWhereClause = buildPaymentConditions(
      id,
      dateFrom,
      dateTo,
      paymentType
    );
    
    const allPayments = await (paymentWhereClause
      ? db.select().from(payments).where(paymentWhereClause).orderBy(payments.date)
      : db.select().from(payments).orderBy(payments.date)
    );

    // Calculate summary
    const summary = calculateStatementSummary(allInvoices, allPayments);

    return NextResponse.json({
      success: true,
      data: {
        client,
        summary,
        invoices: allInvoices,
        payments: allPayments,
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/clients/[id]/statement', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

