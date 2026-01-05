import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { contractInvoices, invoices, contracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

/**
 * GET /api/accounting/contracts/[id]/invoices - Get all invoices generated for a contract
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/accounting/contracts/${id}/invoices - Fetching contract invoices`);

  try {
    // Check if contract exists
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (!contract) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Get all contract invoices with invoice details
    const contractInvoicesList = await db
      .select({
        contractInvoice: contractInvoices,
        invoice: invoices,
      })
      .from(contractInvoices)
      .innerJoin(invoices, eq(contractInvoices.invoiceId, invoices.id))
      .where(eq(contractInvoices.contractId, id));

    console.log(`✓ Found ${contractInvoicesList.length} invoices for contract ${id}`);
    return NextResponse.json({
      success: true,
      data: contractInvoicesList.map(ci => ({
        ...ci.contractInvoice,
        invoice: ci.invoice,
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching contract invoices:', error);
    logError(error, { endpoint: '/api/accounting/contracts/[id]/invoices', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}





