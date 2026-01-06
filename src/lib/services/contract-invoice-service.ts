/**
 * Service for creating invoices from contracts
 */

import { db } from '@/lib/db';
import { contracts, contractInvoices, invoices, clients } from '@/database/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { generateContractInvoiceItems, generateContractInvoiceDescription } from '@/lib/invoice-templates';
import { extractIdFromDbResult } from '@/lib/utils/db-result';

export interface ContractInvoiceCreationParams {
  contractId: string;
  periodYear: number;
  periodMonth: number;
  invoiceNumber: string;
  series: string;
  number: number;
  invoiceType: 'issued' | 'received';
  dueDate: string;
  today: string;
}

export interface ContractInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
}

/**
 * Validates that a contract has all required fields for invoice generation
 */
export function validateContractForInvoice(contract: {
  id: string;
  contractNumber: string;
  parishId: string | null;
  clientId: string | null;
}): void {
  if (!contract.parishId) {
    throw new Error(`Contract ${contract.contractNumber} must have a parish assigned`);
  }
  if (!contract.clientId) {
    throw new Error(`Contract ${contract.contractNumber} must have a client assigned`);
  }
}

/**
 * Checks if an invoice already exists for a contract period
 */
export async function checkInvoiceExists(
  contractId: string,
  periodYear: number,
  periodMonth: number
): Promise<boolean> {
  const existing = await db
    .select()
    .from(contractInvoices)
    .where(
      and(
        eq(contractInvoices.contractId, contractId),
        eq(contractInvoices.periodYear, periodYear),
        eq(contractInvoices.periodMonth, periodMonth)
      )
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Calculates invoice totals from items
 */
export function calculateInvoiceTotals(items: Array<{ unitPrice?: number; quantity: number; vat?: number }>): {
  amount: number;
  vat: number;
  total: number;
} {
  const amount = items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
  const vat = items.reduce((sum, item) => sum + (item.vat || 0), 0);
  const total = amount + vat;

  return { amount, vat, total };
}

/**
 * Creates an invoice from contract data using raw SQL for backward compatibility
 */
export async function createContractInvoice(
  contract: {
    id: string;
    contractNumber: string;
    parishId: string;
    clientId: string;
    currency: string | null;
    createdBy: string;
  },
  client: typeof clients.$inferSelect | null,
  items: Array<{ description: string; quantity: number; unitPrice: number; vat: number; total: number }>,
  description: string | null,
  params: ContractInvoiceCreationParams
): Promise<ContractInvoiceResult> {
  const { amount, vat, total } = calculateInvoiceTotals(items);

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
      ${contract.parishId}::uuid, 
      ${params.invoiceNumber}, 
      ${params.invoiceType}::invoice_type, 
      ${params.today}::date,
      ${params.today}::date, 
      ${params.dueDate}::date, 
      ${contract.clientId}::uuid,
      ${amount.toString()}::numeric,
      ${amount.toString()}::numeric,
      ${vat.toString()}::numeric,
      ${vat.toString()}::numeric,
      ${total.toString()}::numeric, 
      ${contract.currency || 'RON'}, 
      'draft'::invoice_status, 
      ${description || null}, 
      ${JSON.stringify(items)}::jsonb,
      ${params.series}, 
      ${params.number}, 
      ${contract.createdBy}::uuid, 
      NOW(), 
      NOW()
    ) RETURNING id
  `);

  const invoiceId = extractIdFromDbResult(result);

  // Fetch the created invoice using Drizzle to ensure it exists
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
      contractId: contract.id,
      invoiceId: newInvoice.id as string,
      periodYear: params.periodYear,
      periodMonth: params.periodMonth,
      generatedBy: contract.createdBy,
    });

  return {
    invoiceId: newInvoice.id as string,
    invoiceNumber: params.invoiceNumber,
  };
}

/**
 * Generates invoice number from contract number and period
 */
export function generateInvoiceNumber(
  contractNumber: string,
  year: number,
  month: number
): string {
  return `CONTRACT-${contractNumber}-${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Extracts series and number from invoice number
 */
export function extractSeriesAndNumber(invoiceNumber: string): { series: string; number: number } {
  const seriesMatch = invoiceNumber.match(/^([A-Z]+)-/);
  const series = seriesMatch ? seriesMatch[1] : 'CONTRACT';
  
  const numberMatch = invoiceNumber.match(/-(\d+)$/);
  const number = numberMatch ? parseInt(numberMatch[1], 10) : 1;

  if (!series || series.trim() === '') {
    throw new Error(`Failed to extract series from invoice number: ${invoiceNumber}`);
  }

  return { series, number };
}

/**
 * Calculates due date (default: 30 days from today)
 */
export function calculateDueDate(baseDate: Date, days: number = 30): string {
  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString().split('T')[0];
}

/**
 * Finds active monthly contracts that need invoice generation
 */
export async function findActiveMonthlyContracts(today: string) {
  return await db
    .select({
      contract: contracts,
      client: clients,
    })
    .from(contracts)
    .leftJoin(clients, eq(contracts.clientId, clients.id))
    .where(
      and(
        eq(contracts.status, 'active'),
        eq(contracts.paymentFrequency, 'monthly'),
        lte(contracts.startDate, today),
        gte(contracts.endDate, today)
      )
    );
}







