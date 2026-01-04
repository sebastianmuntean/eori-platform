import { db } from '@/database/client';
import {
  users,
  generalRegister,
  churchEvents,
  invoices,
  payments,
  parishes,
  clients,
  auditLogs,
} from '@/database/schema';
import { sql, and, gte, lte, eq, desc, count, sum, isNull } from 'drizzle-orm';

export interface DateRange {
  start: string; // ISO date string
  end: string; // ISO date string
}

export interface AnalyticsFilters {
  dateRange?: DateRange;
  parishId?: string;
  dioceseId?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DashboardMetrics {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    activityOverTime: TimeSeriesDataPoint[];
  };
  documentCreation: {
    totalDocuments: number;
    documentsByType: Record<string, number>;
    documentsOverTime: TimeSeriesDataPoint[];
  };
  eventStatistics: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsOverTime: TimeSeriesDataPoint[];
  };
  financialSummary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    incomeOverTime: TimeSeriesDataPoint[];
    expensesOverTime: TimeSeriesDataPoint[];
  };
  parishionerGrowth: {
    totalParishioners: number;
    growthOverTime: TimeSeriesDataPoint[];
  };
}

/**
 * Get user activity metrics
 */
export async function getUserActivityMetrics(filters: AnalyticsFilters = {}) {
  const conditions = [];
  
  if (filters.dateRange) {
    conditions.push(gte(users.createdAt, new Date(filters.dateRange.start)));
    conditions.push(lte(users.createdAt, new Date(filters.dateRange.end)));
  }

  // Total users
  const [totalUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Active users (users who logged in within the date range)
  const activeUsersConditions = [];
  if (filters.dateRange) {
    activeUsersConditions.push(
      gte(auditLogs.createdAt, new Date(filters.dateRange.start)),
      lte(auditLogs.createdAt, new Date(filters.dateRange.end))
    );
  }
  activeUsersConditions.push(eq(auditLogs.action, 'login'));

  const [activeUsersResult] = await db
    .select({ count: sql<number>`count(distinct ${auditLogs.userId})` })
    .from(auditLogs)
    .where(and(...activeUsersConditions));

  // New users in date range
  const newUsersConditions = [];
  if (filters.dateRange) {
    newUsersConditions.push(
      gte(users.createdAt, new Date(filters.dateRange.start)),
      lte(users.createdAt, new Date(filters.dateRange.end))
    );
  }

  const [newUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(newUsersConditions.length > 0 ? and(...newUsersConditions) : undefined);

  // Activity over time (daily login counts)
  const activityOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${auditLogs.createdAt})::text`,
      value: sql<number>`count(*)`,
    })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.action, 'login'),
        filters.dateRange
          ? and(
              gte(auditLogs.createdAt, new Date(filters.dateRange.start)),
              lte(auditLogs.createdAt, new Date(filters.dateRange.end))
            )
          : undefined
      )
    )
    .groupBy(sql`date_trunc('day', ${auditLogs.createdAt})`)
    .orderBy(sql`date_trunc('day', ${auditLogs.createdAt})`);

  return {
    totalUsers: Number(totalUsersResult?.count || 0),
    activeUsers: Number(activeUsersResult?.count || 0),
    newUsers: Number(newUsersResult?.count || 0),
    activityOverTime: activityOverTime.map((row) => ({
      date: row.date,
      value: Number(row.value),
    })),
  };
}

/**
 * Get document creation metrics
 */
export async function getDocumentCreationMetrics(filters: AnalyticsFilters = {}) {
  const conditions = [];
  
  if (filters.dateRange) {
    conditions.push(gte(generalRegister.createdAt, new Date(filters.dateRange.start)));
    conditions.push(lte(generalRegister.createdAt, new Date(filters.dateRange.end)));
  }
  
  if (filters.parishId) {
    conditions.push(eq(generalRegister.parishId, filters.parishId));
  }

  // Total documents
  const [totalDocumentsResult] = await db
    .select({ count: count() })
    .from(generalRegister)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Documents by type
  const documentsByTypeResult = await db
    .select({
      type: generalRegister.documentType,
      count: sql<number>`count(*)`,
    })
    .from(generalRegister)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(generalRegister.documentType);

  const documentsByType: Record<string, number> = {};
  documentsByTypeResult.forEach((row) => {
    documentsByType[row.type] = Number(row.count);
  });

  // Documents over time
  const documentsOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${generalRegister.createdAt})::text`,
      value: sql<number>`count(*)`,
    })
    .from(generalRegister)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`date_trunc('day', ${generalRegister.createdAt})`)
    .orderBy(sql`date_trunc('day', ${generalRegister.createdAt})`);

  return {
    totalDocuments: Number(totalDocumentsResult?.count || 0),
    documentsByType,
    documentsOverTime: documentsOverTime.map((row) => ({
      date: row.date,
      value: Number(row.value),
    })),
  };
}

/**
 * Get event statistics
 */
export async function getEventStatistics(filters: AnalyticsFilters = {}) {
  const conditions = [];
  
  if (filters.dateRange) {
    conditions.push(gte(churchEvents.createdAt, new Date(filters.dateRange.start)));
    conditions.push(lte(churchEvents.createdAt, new Date(filters.dateRange.end)));
  }
  
  if (filters.parishId) {
    conditions.push(eq(churchEvents.parishId, filters.parishId));
  }

  // Total events
  const [totalEventsResult] = await db
    .select({ count: count() })
    .from(churchEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Events by type
  const eventsByTypeResult = await db
    .select({
      type: churchEvents.type,
      count: sql<number>`count(*)`,
    })
    .from(churchEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(churchEvents.type);

  const eventsByType: Record<string, number> = {};
  eventsByTypeResult.forEach((row) => {
    eventsByType[row.type] = Number(row.count);
  });

  // Events over time
  const eventsOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${churchEvents.createdAt})::text`,
      value: sql<number>`count(*)`,
    })
    .from(churchEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`date_trunc('day', ${churchEvents.createdAt})`)
    .orderBy(sql`date_trunc('day', ${churchEvents.createdAt})`);

  return {
    totalEvents: Number(totalEventsResult?.count || 0),
    eventsByType,
    eventsOverTime: eventsOverTime.map((row) => ({
      date: row.date,
      value: Number(row.value),
    })),
  };
}

/**
 * Get financial summary
 */
export async function getFinancialSummary(filters: AnalyticsFilters = {}) {
  const conditions = [];
  
  if (filters.dateRange) {
    // payments.date is a date field, so we can compare directly with date strings
    conditions.push(gte(payments.date, filters.dateRange.start));
    conditions.push(lte(payments.date, filters.dateRange.end));
  }
  
  if (filters.parishId) {
    conditions.push(eq(payments.parishId, filters.parishId));
  }

  // Total income
  const [incomeResult] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(
        eq(payments.type, 'income'),
        conditions.length > 0 ? and(...conditions) : undefined
      )
    );

  // Total expenses
  const [expensesResult] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(
      and(
        eq(payments.type, 'expense'),
        conditions.length > 0 ? and(...conditions) : undefined
      )
    );

  const totalIncome = Number(incomeResult?.total || 0);
  const totalExpenses = Number(expensesResult?.total || 0);

  // Income over time
  const incomeOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${payments.date})::text`,
      value: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.type, 'income'),
        conditions.length > 0 ? and(...conditions) : undefined
      )
    )
    .groupBy(sql`date_trunc('day', ${payments.date})`)
    .orderBy(sql`date_trunc('day', ${payments.date})`);

  // Expenses over time
  const expensesOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${payments.date})::text`,
      value: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.type, 'expense'),
        conditions.length > 0 ? and(...conditions) : undefined
      )
    )
    .groupBy(sql`date_trunc('day', ${payments.date})`)
    .orderBy(sql`date_trunc('day', ${payments.date})`);

  return {
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses,
    incomeOverTime: incomeOverTime.map((row) => ({
      date: row.date,
      value: Number(row.value),
    })),
    expensesOverTime: expensesOverTime.map((row) => ({
      date: row.date,
      value: Number(row.value),
    })),
  };
}

/**
 * Get parishioner growth metrics
 */
export async function getParishionerGrowthMetrics(filters: AnalyticsFilters = {}) {
  const conditions = [];
  
  if (filters.parishId) {
    conditions.push(eq(clients.parishId, filters.parishId));
  }

  // Total parishioners (clients) - exclude deleted
  const clientConditions = [
    eq(clients.isActive, true),
    isNull(clients.deletedAt),
  ];
  if (conditions.length > 0) {
    clientConditions.push(...conditions);
  }

  const [totalParishionersResult] = await db
    .select({ count: count() })
    .from(clients)
    .where(and(...clientConditions));

  // Growth over time (new clients per day)
  const growthConditions = [];
  if (filters.dateRange) {
    growthConditions.push(
      gte(clients.createdAt, new Date(filters.dateRange.start)),
      lte(clients.createdAt, new Date(filters.dateRange.end))
    );
  }
  if (filters.parishId) {
    growthConditions.push(eq(clients.parishId, filters.parishId));
  }

  const growthConditionsWithDeleted = [
    eq(clients.isActive, true),
    isNull(clients.deletedAt),
  ];
  if (growthConditions.length > 0) {
    growthConditionsWithDeleted.push(...growthConditions);
  }

  const growthOverTime = await db
    .select({
      date: sql<string>`date_trunc('day', ${clients.createdAt})::text`,
      value: sql<number>`count(*)`,
    })
    .from(clients)
    .where(and(...growthConditionsWithDeleted))
    .groupBy(sql`date_trunc('day', ${clients.createdAt})`)
    .orderBy(sql`date_trunc('day', ${clients.createdAt})`);

  return {
    totalParishioners: Number(totalParishionersResult?.count || 0),
    growthOverTime: growthOverTime.map((row) => ({
      date: row.date,
      value: Number(row.value),
    })),
  };
}

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(filters: AnalyticsFilters = {}): Promise<DashboardMetrics> {
  const [
    userActivity,
    documentCreation,
    eventStatistics,
    financialSummary,
    parishionerGrowth,
  ] = await Promise.all([
    getUserActivityMetrics(filters),
    getDocumentCreationMetrics(filters),
    getEventStatistics(filters),
    getFinancialSummary(filters),
    getParishionerGrowthMetrics(filters),
  ]);

  return {
    userActivity,
    documentCreation,
    eventStatistics,
    financialSummary,
    parishionerGrowth,
  };
}

