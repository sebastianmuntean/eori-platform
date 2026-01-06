import { SimpleModal } from '@/components/ui/SimpleModal';
import { Badge } from '@/components/ui/Badge';
import { Invoice } from '@/hooks/useInvoices';

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  t: (key: string) => string;
}

export function ViewInvoiceModal({ isOpen, onClose, invoice, t }: ViewInvoiceModalProps) {
  if (!invoice) return null;

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title={`${t('view')} ${t('invoice')}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-text-secondary">{t('invoiceNumber')}</p>
            <p className="font-medium">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">{t('status')}</p>
            <Badge variant="success" size="sm">
              {t(invoice.status)}
            </Badge>
          </div>
        </div>
        {/* Add more read-only fields as needed */}
      </div>
    </SimpleModal>
  );
}





