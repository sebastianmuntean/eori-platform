import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { salaries, salaryComponents, employmentContracts, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const [salary] = await db
      .select()
      .from(salaries)
      .where(eq(salaries.id, id))
      .limit(1);

    if (!salary) {
      return NextResponse.json(
        { success: false, error: 'Salary not found' },
        { status: 404 }
      );
    }

    // Get contract to get base salary
    const [contract] = await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.id, salary.contractId))
      .limit(1);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Get employee to get working days info
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, salary.employeeId))
      .limit(1);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Calculate base salary for the period
    const baseSalary = parseFloat(contract.baseSalary.toString());
    const workedDays = salary.workedDays || salary.workingDays;
    const dailySalary = baseSalary / salary.workingDays;
    const calculatedBaseSalary = dailySalary * workedDays;

    // Get existing salary components
    const existingComponents = await db
      .select()
      .from(salaryComponents)
      .where(eq(salaryComponents.salaryId, id));

    // Calculate totals
    let totalBenefits = 0;
    let totalDeductions = 0;
    let grossSalary = calculatedBaseSalary;

    // Process components
    for (const component of existingComponents) {
      const amount = parseFloat(component.amount.toString());
      
      if (component.componentType === 'base') {
        // Base salary - already included
        continue;
      } else if (['bonus', 'overtime', 'allowance'].includes(component.componentType)) {
        // Benefits - add to gross
        totalBenefits += amount;
        grossSalary += amount;
      } else if (['tax', 'social_contribution'].includes(component.componentType)) {
        // Deductions - calculate from gross
        let deductionAmount = amount;
        if (component.isPercentage) {
          const percentage = parseFloat(component.percentageValue?.toString() || '0');
          deductionAmount = grossSalary * (percentage / 100);
        }
        totalDeductions += deductionAmount;
      } else if (component.componentType === 'other') {
        // Other - determine if benefit or deduction based on amount sign
        if (amount > 0) {
          totalBenefits += amount;
          grossSalary += amount;
        } else {
          totalDeductions += Math.abs(amount);
        }
      }
    }

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    // Update salary record
    const [updatedSalary] = await db
      .update(salaries)
      .set({
        baseSalary: calculatedBaseSalary.toString(),
        grossSalary: grossSalary.toString(),
        netSalary: netSalary.toString(),
        totalBenefits: totalBenefits.toString(),
        totalDeductions: totalDeductions.toString(),
        status: 'calculated',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(salaries.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedSalary,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/salaries/[id]/calculate', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



