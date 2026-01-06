import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
  t: (key: string) => string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  t,
}: DateRangeFilterProps) {
  return (
    <Card variant="elevated" className="mb-6">
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="date"
            label={t('startDate') || 'Start Date'}
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
          <Input
            type="date"
            label={t('endDate') || 'End Date'}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={onApply} variant="primary" className="w-full">
              {t('apply') || 'Apply'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

