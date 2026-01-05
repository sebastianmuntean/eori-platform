import { db } from '@/database/client';
import { 
  leaveRequests, 
  employees, 
  leaveTypes, 
  timeEntries, 
  salaries, 
  evaluations,
  employmentContracts,
  employeeDocuments,
  users,
  parishes
} from '@/database/schema';
import { eq } from 'drizzle-orm';
import { sendEmailWithTemplateName } from '@/lib/email';

/**
 * Format date for email display
 */
function formatDate(dateString: string | null | Date): string {
  if (!dateString) return 'Nespecificat';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return typeof dateString === 'string' ? dateString : 'Nespecificat';
  }
}

/**
 * Format date and time for email display
 */
function formatDateTime(dateString: string | null | Date): string {
  if (!dateString) return 'Nespecificat';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return typeof dateString === 'string' ? dateString : 'Nespecificat';
  }
}

/**
 * Get employee email address - tries employee.email first, then linked user.email
 */
async function getEmployeeEmail(employeeId: string): Promise<string | null> {
  const [employee] = await db
    .select({
      email: employees.email,
      userId: employees.userId,
    })
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);

  if (!employee) {
    return null;
  }

  // Try employee email first
  if (employee.email) {
    return employee.email;
  }

  // If no email, try linked user account
  if (employee.userId) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, employee.userId))
      .limit(1);

    if (user?.email) {
      return user.email;
    }
  }

  return null;
}

/**
 * Get employee name
 */
async function getEmployeeName(employeeId: string): Promise<string> {
  const [employee] = await db
    .select({
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);

  if (!employee) {
    return 'Angajat necunoscut';
  }

  return `${employee.firstName} ${employee.lastName}`.trim();
}

/**
 * Send leave request approval notification
 */
export async function sendLeaveRequestApprovalNotification(
  leaveRequestId: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Get leave request with employee and leave type info
    const [request] = await db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        leaveTypeId: leaveRequests.leaveTypeId,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        approvedAt: leaveRequests.approvedAt,
      })
      .from(leaveRequests)
      .where(eq(leaveRequests.id, leaveRequestId))
      .limit(1);

    if (!request) {
      return { sent: false, error: 'Leave request not found' };
    }

    // Get employee info
    const employeeEmail = await getEmployeeEmail(request.employeeId);
    if (!employeeEmail) {
      return { sent: false, error: 'Employee email not found' };
    }

    const employeeName = await getEmployeeName(request.employeeId);

    // Get leave type
    const [leaveType] = await db
      .select({ name: leaveTypes.name })
      .from(leaveTypes)
      .where(eq(leaveTypes.id, request.leaveTypeId))
      .limit(1);

    // Get parish info (optional, for context)
    const [employee] = await db
      .select({ parishId: employees.parishId })
      .from(employees)
      .where(eq(employees.id, request.employeeId))
      .limit(1);

    let parishName = 'Parohie necunoscută';
    if (employee?.parishId) {
      const [parish] = await db
        .select({ name: parishes.name })
        .from(parishes)
        .where(eq(parishes.id, employee.parishId))
        .limit(1);
      if (parish) {
        parishName = parish.name;
      }
    }

    // Send email using template
    await sendEmailWithTemplateName(
      'Aprobare Cerere Concediu',
      employeeEmail,
      employeeName,
      {
        employee: {
          name: employeeName,
          email: employeeEmail,
        },
        leaveRequest: {
          leaveType: leaveType?.name || 'Concediu',
          startDate: formatDate(request.startDate),
          endDate: formatDate(request.endDate),
          totalDays: request.totalDays.toString(),
          reason: request.reason || 'Nespecificat',
        },
        parishName: parishName,
      }
    );

    return { sent: true };
  } catch (error) {
    console.error('Failed to send leave request approval notification:', error);
    return { 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send leave request rejection notification
 */
export async function sendLeaveRequestRejectionNotification(
  leaveRequestId: string,
  rejectionReason?: string | null
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Get leave request with employee and leave type info
    const [request] = await db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        leaveTypeId: leaveRequests.leaveTypeId,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        rejectionReason: leaveRequests.rejectionReason,
        approvedAt: leaveRequests.approvedAt,
      })
      .from(leaveRequests)
      .where(eq(leaveRequests.id, leaveRequestId))
      .limit(1);

    if (!request) {
      return { sent: false, error: 'Leave request not found' };
    }

    // Get employee info
    const employeeEmail = await getEmployeeEmail(request.employeeId);
    if (!employeeEmail) {
      return { sent: false, error: 'Employee email not found' };
    }

    const employeeName = await getEmployeeName(request.employeeId);

    // Get leave type
    const [leaveType] = await db
      .select({ name: leaveTypes.name })
      .from(leaveTypes)
      .where(eq(leaveTypes.id, request.leaveTypeId))
      .limit(1);

    // Get parish info
    const [employee] = await db
      .select({ parishId: employees.parishId })
      .from(employees)
      .where(eq(employees.id, request.employeeId))
      .limit(1);

    let parishName = 'Parohie necunoscută';
    if (employee?.parishId) {
      const [parish] = await db
        .select({ name: parishes.name })
        .from(parishes)
        .where(eq(parishes.id, employee.parishId))
        .limit(1);
      if (parish) {
        parishName = parish.name;
      }
    }

    // Send email using template
    await sendEmailWithTemplateName(
      'Respingere Cerere Concediu',
      employeeEmail,
      employeeName,
      {
        employee: {
          name: employeeName,
          email: employeeEmail,
        },
        leaveRequest: {
          leaveType: leaveType?.name || 'Concediu',
          startDate: formatDate(request.startDate),
          endDate: formatDate(request.endDate),
          totalDays: request.totalDays.toString(),
          reason: request.reason || 'Nespecificat',
          rejectionReason: rejectionReason || request.rejectionReason || 'Nespecificat',
        },
        parishName: parishName,
      }
    );

    return { sent: true };
  } catch (error) {
    console.error('Failed to send leave request rejection notification:', error);
    return { 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send time entry approval notification
 */
export async function sendTimeEntryApprovalNotification(
  timeEntryId: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Get time entry with employee info
    const [entry] = await db
      .select({
        id: timeEntries.id,
        employeeId: timeEntries.employeeId,
        entryDate: timeEntries.entryDate,
        checkInTime: timeEntries.checkInTime,
        checkOutTime: timeEntries.checkOutTime,
        workedHours: timeEntries.workedHours,
        overtimeHours: timeEntries.overtimeHours,
        status: timeEntries.status,
        approvedAt: timeEntries.approvedAt,
      })
      .from(timeEntries)
      .where(eq(timeEntries.id, timeEntryId))
      .limit(1);

    if (!entry) {
      return { sent: false, error: 'Time entry not found' };
    }

    // Get employee info
    const employeeEmail = await getEmployeeEmail(entry.employeeId);
    if (!employeeEmail) {
      return { sent: false, error: 'Employee email not found' };
    }

    const employeeName = await getEmployeeName(entry.employeeId);

    // Get parish info
    const [employee] = await db
      .select({ parishId: employees.parishId })
      .from(employees)
      .where(eq(employees.id, entry.employeeId))
      .limit(1);

    let parishName = 'Parohie necunoscută';
    if (employee?.parishId) {
      const [parish] = await db
        .select({ name: parishes.name })
        .from(parishes)
        .where(eq(parishes.id, employee.parishId))
        .limit(1);
      if (parish) {
        parishName = parish.name;
      }
    }

    // Send email using template
    await sendEmailWithTemplateName(
      'Aprobare Pontaj',
      employeeEmail,
      employeeName,
      {
        employee: {
          name: employeeName,
          email: employeeEmail,
        },
        timeEntry: {
          entryDate: formatDate(entry.entryDate),
          checkInTime: entry.checkInTime ? formatDateTime(entry.checkInTime) : 'Nespecificat',
          checkOutTime: entry.checkOutTime ? formatDateTime(entry.checkOutTime) : 'Nespecificat',
          workedHours: entry.workedHours || '0',
          overtimeHours: entry.overtimeHours || '0',
          status: entry.status || 'present',
        },
        parishName: parishName,
      }
    );

    return { sent: true };
  } catch (error) {
    console.error('Failed to send time entry approval notification:', error);
    return { 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send salary approval notification
 */
export async function sendSalaryApprovalNotification(
  salaryId: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Get salary with employee info
    const [salary] = await db
      .select({
        id: salaries.id,
        employeeId: salaries.employeeId,
        salaryPeriod: salaries.salaryPeriod,
        baseSalary: salaries.baseSalary,
        grossSalary: salaries.grossSalary,
        netSalary: salaries.netSalary,
        totalBenefits: salaries.totalBenefits,
        totalDeductions: salaries.totalDeductions,
        workingDays: salaries.workingDays,
        workedDays: salaries.workedDays,
        status: salaries.status,
      })
      .from(salaries)
      .where(eq(salaries.id, salaryId))
      .limit(1);

    if (!salary) {
      return { sent: false, error: 'Salary not found' };
    }

    // Get employee info
    const employeeEmail = await getEmployeeEmail(salary.employeeId);
    if (!employeeEmail) {
      return { sent: false, error: 'Employee email not found' };
    }

    const employeeName = await getEmployeeName(salary.employeeId);

    // Get parish info
    const [employee] = await db
      .select({ parishId: employees.parishId })
      .from(employees)
      .where(eq(employees.id, salary.employeeId))
      .limit(1);

    let parishName = 'Parohie necunoscută';
    if (employee?.parishId) {
      const [parish] = await db
        .select({ name: parishes.name })
        .from(parishes)
        .where(eq(parishes.id, employee.parishId))
        .limit(1);
      if (parish) {
        parishName = parish.name;
      }
    }

    // Format salary period (e.g., "Ianuarie 2024")
    const salaryPeriodDate = new Date(salary.salaryPeriod);
    const salaryPeriodFormatted = salaryPeriodDate.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
    });

    // Send email using template
    await sendEmailWithTemplateName(
      'Aprobare Salariu',
      employeeEmail,
      employeeName,
      {
        employee: {
          name: employeeName,
          email: employeeEmail,
        },
        salary: {
          period: salaryPeriodFormatted,
          baseSalary: salary.baseSalary || '0',
          grossSalary: salary.grossSalary || '0',
          netSalary: salary.netSalary || '0',
          totalBenefits: salary.totalBenefits || '0',
          totalDeductions: salary.totalDeductions || '0',
          workingDays: salary.workingDays.toString(),
          workedDays: salary.workedDays.toString(),
        },
        parishName: parishName,
      }
    );

    return { sent: true };
  } catch (error) {
    console.error('Failed to send salary approval notification:', error);
    return { 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send salary payment notification
 */
export async function sendSalaryPaymentNotification(
  salaryId: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Get salary with employee info
    const [salary] = await db
      .select({
        id: salaries.id,
        employeeId: salaries.employeeId,
        salaryPeriod: salaries.salaryPeriod,
        netSalary: salaries.netSalary,
        paidDate: salaries.paidDate,
        paymentReference: salaries.paymentReference,
      })
      .from(salaries)
      .where(eq(salaries.id, salaryId))
      .limit(1);

    if (!salary) {
      return { sent: false, error: 'Salary not found' };
    }

    // Get employee info
    const employeeEmail = await getEmployeeEmail(salary.employeeId);
    if (!employeeEmail) {
      return { sent: false, error: 'Employee email not found' };
    }

    const employeeName = await getEmployeeName(salary.employeeId);

    // Get parish info
    const [employee] = await db
      .select({ parishId: employees.parishId })
      .from(employees)
      .where(eq(employees.id, salary.employeeId))
      .limit(1);

    let parishName = 'Parohie necunoscută';
    if (employee?.parishId) {
      const [parish] = await db
        .select({ name: parishes.name })
        .from(parishes)
        .where(eq(parishes.id, employee.parishId))
        .limit(1);
      if (parish) {
        parishName = parish.name;
      }
    }

    // Format salary period
    const salaryPeriodDate = new Date(salary.salaryPeriod);
    const salaryPeriodFormatted = salaryPeriodDate.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
    });

    // Send email using template
    await sendEmailWithTemplateName(
      'Notificare Plata Salariu',
      employeeEmail,
      employeeName,
      {
        employee: {
          name: employeeName,
          email: employeeEmail,
        },
        salary: {
          period: salaryPeriodFormatted,
          netSalary: salary.netSalary || '0',
          paidDate: salary.paidDate ? formatDate(salary.paidDate) : 'Nespecificat',
          paymentReference: salary.paymentReference || 'Nespecificat',
        },
        parishName: parishName,
      }
    );

    return { sent: true };
  } catch (error) {
    console.error('Failed to send salary payment notification:', error);
    return { 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send evaluation completion notification
 */
export async function sendEvaluationCompletionNotification(
  evaluationId: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Get evaluation with employee info
    const [evaluation] = await db
      .select({
        id: evaluations.id,
        employeeId: evaluations.employeeId,
        evaluatorId: evaluations.evaluatorId,
        evaluationPeriodStart: evaluations.evaluationPeriodStart,
        evaluationPeriodEnd: evaluations.evaluationPeriodEnd,
        evaluationDate: evaluations.evaluationDate,
        overallScore: evaluations.overallScore,
        overallComment: evaluations.overallComment,
        status: evaluations.status,
      })
      .from(evaluations)
      .where(eq(evaluations.id, evaluationId))
      .limit(1);

    if (!evaluation) {
      return { sent: false, error: 'Evaluation not found' };
    }

    // Get employee info
    const employeeEmail = await getEmployeeEmail(evaluation.employeeId);
    if (!employeeEmail) {
      return { sent: false, error: 'Employee email not found' };
    }

    const employeeName = await getEmployeeName(evaluation.employeeId);

    // Get evaluator name
    let evaluatorName = 'Evaluator necunoscut';
    if (evaluation.evaluatorId) {
      const [evaluator] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, evaluation.evaluatorId))
        .limit(1);
      if (evaluator) {
        evaluatorName = evaluator.name;
      }
    }

    // Get parish info
    const [employee] = await db
      .select({ parishId: employees.parishId })
      .from(employees)
      .where(eq(employees.id, evaluation.employeeId))
      .limit(1);

    let parishName = 'Parohie necunoscută';
    if (employee?.parishId) {
      const [parish] = await db
        .select({ name: parishes.name })
        .from(parishes)
        .where(eq(parishes.id, employee.parishId))
        .limit(1);
      if (parish) {
        parishName = parish.name;
      }
    }

    // Send email using template
    await sendEmailWithTemplateName(
      'Evaluare Completată',
      employeeEmail,
      employeeName,
      {
        employee: {
          name: employeeName,
          email: employeeEmail,
        },
        evaluation: {
          periodStart: formatDate(evaluation.evaluationPeriodStart),
          periodEnd: formatDate(evaluation.evaluationPeriodEnd),
          evaluationDate: formatDate(evaluation.evaluationDate),
          overallScore: evaluation.overallScore || 'Nespecificat',
          overallComment: evaluation.overallComment || 'Fără comentarii',
          evaluatorName: evaluatorName,
        },
        parishName: parishName,
      }
    );

    return { sent: true };
  } catch (error) {
    console.error('Failed to send evaluation completion notification:', error);
    return { 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send contract expiration notification (for scheduled jobs)
 * This function can be called by a cron job to notify about expiring contracts
 */
export async function sendContractExpirationNotifications(
  contractId: string,
  daysUntilExpiry: number
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Get contract with employee info
    const [contract] = await db
      .select({
        id: employmentContracts.id,
        employeeId: employmentContracts.employeeId,
        contractNumber: employmentContracts.contractNumber,
        contractType: employmentContracts.contractType,
        endDate: employmentContracts.endDate,
        status: employmentContracts.status,
      })
      .from(employmentContracts)
      .where(eq(employmentContracts.id, contractId))
      .limit(1);

    if (!contract) {
      return { sent: false, error: 'Contract not found' };
    }

    // Get employee info
    const employeeEmail = await getEmployeeEmail(contract.employeeId);
    if (!employeeEmail) {
      return { sent: false, error: 'Employee email not found' };
    }

    const employeeName = await getEmployeeName(contract.employeeId);

    // Get parish info
    const [employee] = await db
      .select({ parishId: employees.parishId })
      .from(employees)
      .where(eq(employees.id, contract.employeeId))
      .limit(1);

    let parishName = 'Parohie necunoscută';
    if (employee?.parishId) {
      const [parish] = await db
        .select({ name: parishes.name })
        .from(parishes)
        .where(eq(parishes.id, employee.parishId))
        .limit(1);
      if (parish) {
        parishName = parish.name;
      }
    }

    // Send email using template
    await sendEmailWithTemplateName(
      'Expirare Contract',
      employeeEmail,
      employeeName,
      {
        employee: {
          name: employeeName,
          email: employeeEmail,
        },
        contract: {
          contractNumber: contract.contractNumber,
          contractType: contract.contractType || 'Nespecificat',
          endDate: formatDate(contract.endDate),
          daysUntilExpiry: daysUntilExpiry.toString(),
        },
        parishName: parishName,
      }
    );

    return { sent: true };
  } catch (error) {
    console.error('Failed to send contract expiration notification:', error);
    return { 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send document expiration notification (for scheduled jobs)
 * This function can be called by a cron job to notify about expiring documents
 */
export async function sendDocumentExpirationNotifications(
  documentId: string,
  daysUntilExpiry: number
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Get document with employee info
    const [document] = await db
      .select({
        id: employeeDocuments.id,
        employeeId: employeeDocuments.employeeId,
        title: employeeDocuments.title,
        documentType: employeeDocuments.documentType,
        expiryDate: employeeDocuments.expiryDate,
      })
      .from(employeeDocuments)
      .where(eq(employeeDocuments.id, documentId))
      .limit(1);

    if (!document) {
      return { sent: false, error: 'Document not found' };
    }

    // Get employee info
    const employeeEmail = await getEmployeeEmail(document.employeeId);
    if (!employeeEmail) {
      return { sent: false, error: 'Employee email not found' };
    }

    const employeeName = await getEmployeeName(document.employeeId);

    // Get parish info
    const [employee] = await db
      .select({ parishId: employees.parishId })
      .from(employees)
      .where(eq(employees.id, document.employeeId))
      .limit(1);

    let parishName = 'Parohie necunoscută';
    if (employee?.parishId) {
      const [parish] = await db
        .select({ name: parishes.name })
        .from(parishes)
        .where(eq(parishes.id, employee.parishId))
        .limit(1);
      if (parish) {
        parishName = parish.name;
      }
    }

    // Send email using template
    await sendEmailWithTemplateName(
      'Expirare Document',
      employeeEmail,
      employeeName,
      {
        employee: {
          name: employeeName,
          email: employeeEmail,
        },
        document: {
          title: document.title,
          documentType: document.documentType || 'Nespecificat',
          expiryDate: formatDate(document.expiryDate),
          daysUntilExpiry: daysUntilExpiry.toString(),
        },
        parishName: parishName,
      }
    );

    return { sent: true };
  } catch (error) {
    console.error('Failed to send document expiration notification:', error);
    return { 
      sent: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

