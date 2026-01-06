import { ChartDataPoint } from './ChartContainer';

/**
 * Converts a record of key-value pairs to chart data points
 */
export function recordToChartData(
  record: Record<string, number>
): ChartDataPoint[] {
  return Object.entries(record).map(([name, value]) => ({
    name,
    value,
  }));
}

/**
 * Combines income and expenses time series data for comparison
 */
export function combineFinancialData(
  incomeOverTime: Array<{ date: string; value: number }>,
  expensesOverTime: Array<{ date: string; value: number }>
): ChartDataPoint[] {
  const financialMap = new Map<string, { income: number; expenses: number }>();

  incomeOverTime.forEach((item) => {
    financialMap.set(item.date, { income: item.value, expenses: 0 });
  });

  expensesOverTime.forEach((item) => {
    const existing = financialMap.get(item.date);
    if (existing) {
      existing.expenses = item.value;
    } else {
      financialMap.set(item.date, { income: 0, expenses: item.value });
    }
  });

  return Array.from(financialMap.entries())
    .map(([date, values]) => ({
      date,
      value: values.income + values.expenses, // Required by ChartDataPoint interface
      income: values.income,
      expenses: values.expenses,
    }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

/**
 * Gets default date range (last month to today)
 */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

