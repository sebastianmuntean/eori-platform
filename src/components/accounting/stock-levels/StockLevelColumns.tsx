import { Badge } from '@/components/ui/Badge';
import { StockLevel } from '@/hooks/useStockLevels';
import { Column } from '@/components/ui/Table';

export function getStockLevelColumns(t: (key: string) => string): Column<StockLevel>[] {
  return [
    {
      key: 'warehouseId' as keyof StockLevel,
      label: t('warehouse') || 'Warehouse',
      sortable: false,
      render: (_: any, row: StockLevel) => row.warehouse?.name || '-',
    },
    {
      key: 'productId' as keyof StockLevel,
      label: t('product') || 'Product',
      sortable: false,
      render: (_: any, row: StockLevel) => row.product?.name || '-',
    },
    {
      key: 'quantity' as keyof StockLevel,
      label: t('quantity') || 'Quantity',
      sortable: true,
      render: (value: number, row: StockLevel) => {
        const unit = row.product?.unit || '';
        const isLow = row.product?.minStock && value < row.product.minStock;
        return (
          <div className="flex items-center gap-2">
            <span>
              {value.toFixed(3)} {unit}
            </span>
            {isLow && (
              <Badge variant="warning" size="sm">
                {t('lowStock') || 'Low Stock'}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'totalValue' as keyof StockLevel,
      label: t('totalValue') || 'Total Value',
      sortable: true,
      render: (value: number) => `${value.toFixed(2)} RON`,
    },
    {
      key: 'lastMovementDate' as keyof StockLevel,
      label: t('lastMovement') || 'Last Movement',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];
}





