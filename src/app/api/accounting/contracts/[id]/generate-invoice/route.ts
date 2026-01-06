import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { contracts, contractInvoices, invoices, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { generateContractInvoiceItems, generateContractInvoiceDescription } from '@/lib/invoice-templates';

const generateInvoiceSchema = z.object({
  periodYear: z.number().int().min(2000).max(2100),
  periodMonth: z.number().int().min(1).max(12),
});

/**
 * POST /api/accounting/contracts/[id]/generate-invoice - Manually generate an invoice for a contract
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/accounting/contracts/${id}/generate-invoice - Generating invoice`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = generateInvoiceSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { periodYear, periodMonth } = validation.data;

    // Check if contract exists and is active, join with clients to get client name
    const [contract] = await db
      .select({
        contract: contracts,
        client: clients,
      })
      .from(contracts)
      .leftJoin(clients, eq(contracts.clientId, clients.id))
      .where(eq(contracts.id, id))
      .limit(1);

    if (!contract || !contract.contract) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    const contractData = contract.contract;
    const clientData = contract.client;

    if (!contractData) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contractData.status !== 'active') {
      console.log(`❌ Contract ${id} is not active`);
      return NextResponse.json(
        { success: false, error: 'Only active contracts can generate invoices' },
        { status: 400 }
      );
    }

    // Check if invoice already exists for this period
    const existingInvoice = await db
      .select()
      .from(contractInvoices)
      .where(
        and(
          eq(contractInvoices.contractId, id),
          eq(contractInvoices.periodYear, periodYear),
          eq(contractInvoices.periodMonth, periodMonth)
        )
      )
      .limit(1);

    if (existingInvoice.length > 0) {
      console.log(`❌ Invoice already exists for contract ${id}, period ${periodYear}-${periodMonth}`);
      return NextResponse.json(
        { success: false, error: `Invoice already exists for period ${periodMonth}/${periodYear}` },
        { status: 400 }
      );
    }

    // Prepare contract data with client for template generation
    const contractWithClient = {
      ...contractData,
      client: clientData,
    };

    // Generate invoice
    console.log(`  → Generating invoice for contract ${contractData.contractNumber}, period ${periodYear}-${periodMonth}`);

    // Determine invoice type based on contract direction
    const invoiceType = contractData.direction === 'outgoing' ? 'issued' : 'received';

    // Generate invoice number
    const invoiceNumber = `CONTRACT-${contractData.contractNumber}-${periodYear}-${String(periodMonth).padStart(2, '0')}`;

    // Extract series and number from invoiceNumber for backward compatibility
    // Always provide a value - never null
    const seriesMatch = invoiceNumber.match(/^([A-Z]+)-/);
    const series = seriesMatch ? seriesMatch[1] : 'CONTRACT';
    const numberMatch = invoiceNumber.match(/-(\d+)$/);
    const number = numberMatch ? parseInt(numberMatch[1]) : 1;
    
    // Ensure series is never empty or null
    if (!series || series.trim() === '') {
      throw new Error('Failed to extract series from invoice number');
    }

    // Calculate due date (default: 30 days from today)
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    // Generate invoice items using template
    const items = generateContractInvoiceItems(contractWithClient, periodYear, periodMonth);
    const invoiceDescription = generateContractInvoiceDescription(contractData, periodYear, periodMonth);

    // Calculate totals from items
    const amount = items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
    const vat = items.reduce((sum, item) => sum + (item.vat || 0), 0);
    const total = amount + vat;

    // Validate required fields
    if (!contractData.parishId) {
      console.log(`❌ Contract ${id} has no parishId`);
      return NextResponse.json(
        { success: false, error: 'Contract must have a parish assigned' },
        { status: 400 }
      );
    }

    if (!contractData.clientId) {
      console.log(`❌ Contract ${id} has no clientId`);
      return NextResponse.json(
        { success: false, error: 'Contract must have a client assigned' },
        { status: 400 }
      );
    }

    // Create invoice using raw SQL to include all required columns for backward compatibility
    const result = await db.execute(sql`
      INSERT INTO invoices (
        parish_id, invoice_number, type, 
        issue_date, date, due_date, 
        client_id,
        amount, subtotal, vat, vat_amount, total, 
        currency, status, description, items,
        series, "number", created_by, created_at, updated_at
      ) VALUES (
        ${contractData.parishId}::uuid, 
        ${invoiceNumber}, 
        ${invoiceType}::invoice_type, 
        ${today}::date,
        ${today}::date, 
        ${dueDateStr}::date, 
        ${contractData.clientId}::uuid,
        ${amount.toString()}::numeric,
        ${amount.toString()}::numeric,
        ${vat.toString()}::numeric,
        ${vat.toString()}::numeric,
        ${total.toString()}::numeric, 
        ${contractData.currency || 'RON'}, 
        'draft'::invoice_status, 
        ${invoiceDescription || null}, 
        ${JSON.stringify(items)}::jsonb,
        ${series}, 
        ${number}, 
        ${userId}::uuid, 
        NOW(), 
        NOW()
      ) RETURNING id
    `);
    
    // Handle different return formats from db.execute
    // postgres-js returns { rows: [...] } format
    let invoiceId: string;
    if (result && typeof result === 'object') {
      if ('rows' in result && Array.isArray(result.rows) && result.rows.length > 0) {
        invoiceId = result.rows[0].id;
      } else if (Array.isArray(result) && result.length > 0) {
        invoiceId = (result[0] as { id: string }).id;
      } else if ('id' in result) {
        invoiceId = (result as any).id;
      } else {
        console.error('❌ Unexpected result format from db.execute:', JSON.stringify(result, null, 2));
        throw new Error('Failed to get invoice ID from insert result');
      }
    } else {
      console.error('❌ Unexpected result type from db.execute:', typeof result, result);
      throw new Error('Failed to get invoice ID from insert result');
    }
    
    // Fetch the created invoice using Drizzle
    const [newInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    
    if (!newInvoice) {
      throw new Error('Failed to retrieve created invoice');
    }

    // Create contract_invoices tracking record
    await db
      .insert(contractInvoices)
      .values({
        contractId: contractData.id,
        invoiceId: newInvoice.id,
        periodYear: periodYear,
        periodMonth: periodMonth,
        generatedBy: userId,
      });

    console.log(`✓ Generated invoice ${invoiceNumber} for contract ${contractData.contractNumber}`);

    return NextResponse.json({
      success: true,
      data: {
        invoice: newInvoice,
        contractInvoice: {
          contractId: contractData.id,
          invoiceId: newInvoice.id,
          periodYear,
          periodMonth,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    logError(error, { endpoint: '/api/accounting/contracts/[id]/generate-invoice', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

