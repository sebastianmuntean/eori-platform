import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryConcessions, cemeteryConcessionPayments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { validateUuid } from '@/lib/utils/cemetery';

// Threshold for payment overlap calculation (99% to account for rounding)
const PAYMENT_OVERLAP_THRESHOLD = 0.99;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    // Get concession
    const [concession] = await db
      .select()
      .from(cemeteryConcessions)
      .where(eq(cemeteryConcessions.id, id))
      .limit(1);

    if (!concession) {
      return NextResponse.json(
        { success: false, error: 'Concession not found' },
        { status: 404 }
      );
    }

    // Get all payments for this concession
    const allPayments = await db
      .select()
      .from(cemeteryConcessionPayments)
      .where(eq(cemeteryConcessionPayments.concessionId, id))
      .orderBy(cemeteryConcessionPayments.periodStart);

    // Calculate outstanding periods
    const startDate = new Date(concession.startDate);
    const endDate = new Date(concession.expiryDate);
    const annualFee = Number(concession.annualFee);
    
    // Generate all expected payment periods (yearly)
    const expectedPeriods: Array<{ start: string; end: string; amount: number }> = [];
    let currentYearStart = new Date(startDate);
    
    while (currentYearStart < endDate) {
      const yearEnd = new Date(currentYearStart);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);
      
      // Don't go beyond concession end date
      const periodEnd = yearEnd > endDate ? endDate : yearEnd;
      
      expectedPeriods.push({
        start: currentYearStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
        amount: annualFee,
      });
      
      currentYearStart = yearEnd;
    }

    // Find paid periods
    const paidPeriods = allPayments.map(payment => ({
      start: payment.periodStart,
      end: payment.periodEnd,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate,
      receiptNumber: payment.receiptNumber,
    }));

    // Calculate outstanding periods
    const outstandingPeriods = expectedPeriods.filter(period => {
      // Check if this period is fully or partially covered by payments
      const coveringPayments = paidPeriods.filter(paid => {
        const paidStart = new Date(paid.start);
        const paidEnd = new Date(paid.end);
        const periodStart = new Date(period.start);
        const periodEnd = new Date(period.end);
        
        // Check for overlap
        return paidStart <= periodEnd && paidEnd >= periodStart;
      });

      // If no covering payments, period is outstanding
      if (coveringPayments.length === 0) {
        return true;
      }

      // Calculate total paid amount for this period
      let totalPaid = 0;
      coveringPayments.forEach(paid => {
        const paidStart = new Date(paid.start);
        const paidEnd = new Date(paid.end);
        const periodStart = new Date(period.start);
        const periodEnd = new Date(period.end);
        
        // Calculate overlap
        const overlapStart = paidStart > periodStart ? paidStart : periodStart;
        const overlapEnd = paidEnd < periodEnd ? paidEnd : periodEnd;
        const overlapDays = Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
        const periodDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
        
        if (periodDays > 0) {
          totalPaid += (paid.amount * overlapDays) / periodDays;
        }
      });

      // If paid amount is less than expected, period is outstanding
      // Using threshold to account for rounding errors
      return totalPaid < period.amount * PAYMENT_OVERLAP_THRESHOLD;
    });

    // Calculate total outstanding amount
    const totalOutstanding = outstandingPeriods.reduce((sum, period) => sum + period.amount, 0);

    // Calculate total paid amount
    const totalPaid = paidPeriods.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate total expected amount
    const totalExpected = expectedPeriods.reduce((sum, period) => sum + period.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        concession: {
          id: concession.id,
          contractNumber: concession.contractNumber,
          startDate: concession.startDate,
          expiryDate: concession.expiryDate,
          annualFee: annualFee,
          durationYears: concession.durationYears,
        },
        summary: {
          totalExpected,
          totalPaid,
          totalOutstanding,
          paidPeriodsCount: paidPeriods.length,
          outstandingPeriodsCount: outstandingPeriods.length,
          totalPeriodsCount: expectedPeriods.length,
        },
        expectedPeriods,
        paidPeriods,
        outstandingPeriods,
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions/[id]/outstanding', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

