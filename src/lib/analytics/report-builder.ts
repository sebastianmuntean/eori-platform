import { db } from '@/database/client';
import { savedReports } from '@/database/schema';
import { eq, and, desc } from 'drizzle-orm';
import {
  getDashboardMetrics,
  getUserActivityMetrics,
  getDocumentCreationMetrics,
  getEventStatistics,
  getFinancialSummary,
  getParishionerGrowthMetrics,
  AnalyticsFilters,
} from './analytics-service';

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';
export type ReportType =
  | 'user_activity'
  | 'document_creation'
  | 'event_statistics'
  | 'financial_summary'
  | 'parishioner_growth'
  | 'custom';

export interface ReportConfig {
  metrics: string[];
  chartOptions?: {
    showLegend?: boolean;
    showGrid?: boolean;
    colors?: string[];
  };
  aggregation?: 'daily' | 'weekly' | 'monthly';
}

export interface SavedReport {
  id: string;
  userId: string;
  name: string;
  description?: string;
  reportType: ReportType;
  chartType: ChartType;
  dateRange?: { start: string; end: string };
  parishId?: string;
  dioceseId?: string;
  config: ReportConfig;
  isPublic: boolean;
  sharedWith?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastGeneratedAt?: Date;
}

export interface ReportData {
  report: SavedReport;
  data: any;
  generatedAt: Date;
}

/**
 * Generate report data based on saved report configuration
 */
export async function generateReportData(
  reportId: string,
  userId: string
): Promise<ReportData> {
  // Get saved report
  const [report] = await db
    .select()
    .from(savedReports)
    .where(
      and(
        eq(savedReports.id, reportId),
        // User must own the report or it must be public
        eq(savedReports.userId, userId)
      )
    )
    .limit(1);

  if (!report) {
    throw new Error('Report not found or access denied');
  }

  const filters: AnalyticsFilters = {
    dateRange: report.dateRange as { start: string; end: string } | undefined,
    parishId: report.parishId || undefined,
    dioceseId: report.dioceseId || undefined,
  };

  let data: any;

  // Generate data based on report type
  switch (report.reportType) {
    case 'user_activity':
      data = await getUserActivityMetrics(filters);
      break;
    case 'document_creation':
      data = await getDocumentCreationMetrics(filters);
      break;
    case 'event_statistics':
      data = await getEventStatistics(filters);
      break;
    case 'financial_summary':
      data = await getFinancialSummary(filters);
      break;
    case 'parishioner_growth':
      data = await getParishionerGrowthMetrics(filters);
      break;
    case 'custom':
      // For custom reports, use dashboard metrics and filter by config
      const dashboardData = await getDashboardMetrics(filters);
      data = dashboardData;
      break;
    default:
      throw new Error(`Unknown report type: ${report.reportType}`);
  }

  // Update last generated timestamp
  await db
    .update(savedReports)
    .set({ lastGeneratedAt: new Date() })
    .where(eq(savedReports.id, reportId));

  return {
    report: {
      id: report.id,
      userId: report.userId,
      name: report.name,
      description: report.description || undefined,
      reportType: report.reportType as ReportType,
      chartType: report.chartType as ChartType,
      dateRange: report.dateRange as { start: string; end: string } | undefined,
      parishId: report.parishId || undefined,
      dioceseId: report.dioceseId || undefined,
      config: report.config as ReportConfig,
      isPublic: report.isPublic,
      sharedWith: report.sharedWith as string[] | undefined,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      lastGeneratedAt: report.lastGeneratedAt || undefined,
    },
    data,
    generatedAt: new Date(),
  };
}

/**
 * Create a new saved report
 */
export async function createSavedReport(
  userId: string,
  reportData: Omit<SavedReport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<SavedReport> {
  const [newReport] = await db
    .insert(savedReports)
    .values({
      userId,
      name: reportData.name,
      description: reportData.description,
      reportType: reportData.reportType,
      chartType: reportData.chartType,
      dateRange: reportData.dateRange,
      parishId: reportData.parishId,
      dioceseId: reportData.dioceseId,
      config: reportData.config,
      isPublic: reportData.isPublic || false,
      sharedWith: reportData.sharedWith,
    })
    .returning();

  return {
    id: newReport.id,
    userId: newReport.userId,
    name: newReport.name,
    description: newReport.description || undefined,
    reportType: newReport.reportType as ReportType,
    chartType: newReport.chartType as ChartType,
    dateRange: newReport.dateRange as { start: string; end: string } | undefined,
    parishId: newReport.parishId || undefined,
    dioceseId: newReport.dioceseId || undefined,
    config: newReport.config as ReportConfig,
    isPublic: newReport.isPublic,
    sharedWith: newReport.sharedWith as string[] | undefined,
    createdAt: newReport.createdAt,
    updatedAt: newReport.updatedAt,
    lastGeneratedAt: newReport.lastGeneratedAt || undefined,
  };
}

/**
 * Get all saved reports for a user
 */
export async function getSavedReports(userId: string): Promise<SavedReport[]> {
  const reports = await db
    .select()
    .from(savedReports)
    .where(
      and(
        // User's own reports or public reports
        eq(savedReports.userId, userId)
      )
    )
    .orderBy(desc(savedReports.updatedAt));

  return reports.map((report) => ({
    id: report.id,
    userId: report.userId,
    name: report.name,
    description: report.description || undefined,
    reportType: report.reportType as ReportType,
    chartType: report.chartType as ChartType,
    dateRange: report.dateRange as { start: string; end: string } | undefined,
    parishId: report.parishId || undefined,
    dioceseId: report.dioceseId || undefined,
    config: report.config as ReportConfig,
    isPublic: report.isPublic,
    sharedWith: report.sharedWith as string[] | undefined,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    lastGeneratedAt: report.lastGeneratedAt || undefined,
  }));
}

/**
 * Get a single saved report
 */
export async function getSavedReport(
  reportId: string,
  userId: string
): Promise<SavedReport | null> {
  const [report] = await db
    .select()
    .from(savedReports)
    .where(
      and(
        eq(savedReports.id, reportId),
        eq(savedReports.userId, userId)
      )
    )
    .limit(1);

  if (!report) {
    return null;
  }

  return {
    id: report.id,
    userId: report.userId,
    name: report.name,
    description: report.description || undefined,
    reportType: report.reportType as ReportType,
    chartType: report.chartType as ChartType,
    dateRange: report.dateRange as { start: string; end: string } | undefined,
    parishId: report.parishId || undefined,
    dioceseId: report.dioceseId || undefined,
    config: report.config as ReportConfig,
    isPublic: report.isPublic,
    sharedWith: report.sharedWith as string[] | undefined,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    lastGeneratedAt: report.lastGeneratedAt || undefined,
  };
}

/**
 * Update a saved report
 */
export async function updateSavedReport(
  reportId: string,
  userId: string,
  updates: Partial<Omit<SavedReport, 'id' | 'userId' | 'createdAt'>>,
): Promise<SavedReport> {
  // Verify ownership
  const [existing] = await db
    .select()
    .from(savedReports)
    .where(
      and(
        eq(savedReports.id, reportId),
        eq(savedReports.userId, userId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error('Report not found or access denied');
  }

  const [updated] = await db
    .update(savedReports)
    .set({
      name: updates.name,
      description: updates.description,
      reportType: updates.reportType,
      chartType: updates.chartType,
      dateRange: updates.dateRange,
      parishId: updates.parishId,
      dioceseId: updates.dioceseId,
      config: updates.config,
      isPublic: updates.isPublic,
      sharedWith: updates.sharedWith,
      updatedAt: new Date(),
    })
    .where(eq(savedReports.id, reportId))
    .returning();

  return {
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    description: updated.description || undefined,
    reportType: updated.reportType as ReportType,
    chartType: updated.chartType as ChartType,
    dateRange: updated.dateRange as { start: string; end: string } | undefined,
    parishId: updated.parishId || undefined,
    dioceseId: updated.dioceseId || undefined,
    config: updated.config as ReportConfig,
    isPublic: updated.isPublic,
    sharedWith: updated.sharedWith as string[] | undefined,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    lastGeneratedAt: updated.lastGeneratedAt || undefined,
  };
}

/**
 * Delete a saved report
 */
export async function deleteSavedReport(
  reportId: string,
  userId: string
): Promise<void> {
  // Verify ownership
  const [existing] = await db
    .select()
    .from(savedReports)
    .where(
      and(
        eq(savedReports.id, reportId),
        eq(savedReports.userId, userId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error('Report not found or access denied');
  }

  await db.delete(savedReports).where(eq(savedReports.id, reportId));
}

