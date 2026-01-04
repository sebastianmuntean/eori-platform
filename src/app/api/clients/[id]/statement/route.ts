import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { clients, invoices, payments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, gte, lte, or, sql, isNull } from 'drizzle-orm';

/**
 * GET /api/clients/[id]/statement - Get client financial statement
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
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
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

    // Build invoice conditions
    const invoiceConditions = [eq(invoices.clientId, id)];
    if (dateFrom) {
      invoiceConditions.push(gte(invoices.date, dateFrom));
    }
    if (dateTo) {
      invoiceConditions.push(lte(invoices.date, dateTo));
    }
    if (invoiceType) {
      invoiceConditions.push(eq(invoices.type, invoiceType as 'issued' | 'received'));
    }
    if (invoiceStatus) {
      invoiceConditions.push(eq(invoices.status, invoiceStatus as any));
    }
    const invoiceWhereClause = invoiceConditions.length > 0 
      ? (invoiceConditions.length === 1 ? invoiceConditions[0] : and(...invoiceConditions as any[]))
      : undefined;

    // Get invoices
    let invoiceQuery = db.select().from(invoices);
    if (invoiceWhereClause) {
      invoiceQuery = invoiceQuery.where(invoiceWhereClause);
    }
    const allInvoices = await invoiceQuery.orderBy(invoices.date);

    // Calculate invoice totals
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

    // Build payment conditions
    const paymentConditions = [eq(payments.clientId, id)];
    if (dateFrom) {
      paymentConditions.push(gte(payments.date, dateFrom));
    }
    if (dateTo) {
      paymentConditions.push(lte(payments.date, dateTo));
    }
    if (paymentType) {
      paymentConditions.push(eq(payments.type, paymentType as 'income' | 'expense'));
    }
    const paymentWhereClause = paymentConditions.length > 0 
      ? (paymentConditions.length === 1 ? paymentConditions[0] : and(...paymentConditions as any[]))
      : undefined;

    // Get payments
    let paymentQuery = db.select().from(payments);
    if (paymentWhereClause) {
      paymentQuery = paymentQuery.where(paymentWhereClause);
    }
    const allPayments = await paymentQuery.orderBy(payments.date);

    // Calculate payment totals
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

    const summary = {
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

    return NextResponse.json({
      success: true,
      data: {
        partner: client, // Keep 'partner' key for backward compatibility with frontend
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

