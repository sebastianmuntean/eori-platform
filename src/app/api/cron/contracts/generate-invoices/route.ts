import { validateCronAuth, createCronSuccessResponse, createCronErrorResponse, createHealthCheckResponse } from '@/lib/cron';
import { formatErrorResponse, logError } from '@/lib/errors';
import {
  findActiveMonthlyContracts,
  validateContractForInvoice,
  checkInvoiceExists,
  createContractInvoice,
  generateInvoiceNumber,
  extractSeriesAndNumber,
  calculateDueDate,
} from '@/lib/services/contract-invoice-service';
import { generateContractInvoiceItems, generateContractInvoiceDescription } from '@/lib/invoice-templates';

/**
 * POST /api/cron/contracts/generate-invoices - Cron endpoint for generating monthly invoices from contracts
 * 
 * This endpoint should be called daily (e.g., at 00:00 or 01:00) to generate invoices
 * for contracts with monthly payment frequency.
 * 
 * Security: Protected with CRON_SECRET
 */
export async function POST(request: Request) {
  console.log('Step 1: Contracts invoice generator cron job triggered');

  try {
    validateCronAuth(request);
  } catch (error) {
    return createCronErrorResponse(error, 401);
  }

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const today = now.toISOString().split('T')[0];

    console.log(`Step 2: Processing contracts for ${currentYear}-${currentMonth}`);

    // Find all active contracts with monthly payment frequency
    const monthlyContracts = await findActiveMonthlyContracts(today);

    console.log(`Step 3: Found ${monthlyContracts.length} active monthly contracts`);

    const stats = {
      processed: 0,
      generated: 0,
      errors: [] as Array<{ contractId: string; error: string }>,
    };

    // Process each contract
    for (const contractRow of monthlyContracts) {
      try {
        stats.processed++;
        const contractData = contractRow.contract;
        const clientData = contractRow.client;

        if (!contractData) {
          console.log('  ❌ Contract data is missing');
          continue;
        }

        // Check if invoice already exists for this month
        const invoiceExists = await checkInvoiceExists(
          contractData.id,
          currentYear,
          currentMonth
        );

        if (invoiceExists) {
          console.log(`  ✓ Contract ${contractData.contractNumber} already has invoice for ${currentYear}-${currentMonth}`);
          continue;
        }

        // Validate required fields
        try {
          validateContractForInvoice(contractData);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Validation failed';
          console.log(`  ❌ ${errorMessage}`);
          stats.errors.push({
            contractId: contractData.id,
            error: errorMessage,
          });
          continue;
        }

        // Generate invoice
        console.log(`  → Generating invoice for contract ${contractData.contractNumber}`);

        // Prepare contract data with client for template generation
        const contractWithClient = {
          ...contractData,
          client: clientData,
        };

        // Determine invoice type based on contract direction
        const invoiceType = contractData.direction === 'outgoing' ? 'issued' : 'received';

        // Generate invoice number and extract series/number
        const invoiceNumber = generateInvoiceNumber(
          contractData.contractNumber,
          currentYear,
          currentMonth
        );
        const { series, number } = extractSeriesAndNumber(invoiceNumber);

        // Calculate due date (default: 30 days from today)
        const dueDate = calculateDueDate(now, 30);

        // Generate invoice items and description using templates
        const items = generateContractInvoiceItems(contractWithClient, currentYear, currentMonth);
        const invoiceDescription = generateContractInvoiceDescription(contractData, currentYear, currentMonth);

        // Create invoice
        const result = await createContractInvoice(
          contractData,
          clientData,
          items,
          invoiceDescription,
          {
            contractId: contractData.id,
            periodYear: currentYear,
            periodMonth: currentMonth,
            invoiceNumber,
            series,
            number,
            invoiceType,
            dueDate,
            today,
          }
        );

        stats.generated++;
        console.log(`  ✓ Generated invoice ${result.invoiceNumber} for contract ${contractData.contractNumber}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const contractId = contractRow.contract?.id || 'unknown';
        console.error(`  ❌ Error processing contract ${contractId}:`, errorMessage);
        stats.errors.push({
          contractId,
          error: errorMessage,
        });
      }
    }

    console.log(
      `✓ Invoice generation completed: ${stats.processed} processed, ${stats.generated} generated, ${stats.errors.length} errors`
    );

    return createCronSuccessResponse({
      processed: stats.processed,
      generated: stats.generated,
      errors: stats.errors.length,
      errorDetails: stats.errors,
    });
  } catch (error) {
    console.error('❌ Error in contracts invoice generator cron:', error);
    logError(error, { endpoint: '/api/cron/contracts/generate-invoices', method: 'POST' });
    const errorResponse = formatErrorResponse(error);
    return createCronErrorResponse(error, errorResponse.statusCode);
  }
}

/**
 * GET /api/cron/contracts/generate-invoices - Health check endpoint
 */
export async function GET() {
  return createHealthCheckResponse('Contracts invoice generator');
}
