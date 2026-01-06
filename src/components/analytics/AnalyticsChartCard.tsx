import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ChartContainer, ChartDataPoint, ChartType } from './ChartContainer';

interface AnalyticsChartCardProps {
  title: string;
  type: ChartType;
  data: ChartDataPoint[];
  dataKey?: string;
  height?: number;
  className?: string;
  subtitle?: string;
}

export function AnalyticsChartCard({
  title,
  type,
  data,
  dataKey = 'value',
  height = 250,
  className,
  subtitle,
}: AnalyticsChartCardProps) {
  return (
    <Card variant="elevated" className={className}>
      <CardHeader>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </CardHeader>
      <CardBody>
        {subtitle && (
          <h4 className="text-sm font-medium text-text-primary mb-4">
            {subtitle}
          </h4>
        )}
        <ChartContainer
          type={type}
          data={data}
          dataKey={dataKey}
          height={height}
        />
      </CardBody>
    </Card>
  );
}

