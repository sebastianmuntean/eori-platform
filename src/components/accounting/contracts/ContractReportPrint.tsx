'use client';

import { Contract, ContractInvoice } from '@/hooks/useContracts';
import { Client } from '@/hooks/useClients';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, sanitizeHtml } from '@/lib/utils/accounting';
import { getClientNameById } from '@/lib/utils/contracts';

interface ContractReportPrintProps {
  contract: Contract;
  contractInvoices: ContractInvoice[];
  clients: Client[];
}

/**
 * Component for printing contract reports
 * Extracts report printing logic from the contracts page
 */
export function ContractReportPrint({
  contract,
  contractInvoices,
  clients,
}: ContractReportPrintProps) {
  const t = useTranslations('common');

  const handlePrintReport = () => {
    if (contractInvoices.length === 0) return;

    const months = [
      t('january'),
      t('february'),
      t('march'),
      t('april'),
      t('may'),
      t('june'),
      t('july'),
      t('august'),
      t('september'),
      t('october'),
      t('november'),
      t('december'),
    ];

    const totalAmount = contractInvoices.reduce((sum, ci) => sum + parseFloat(ci.invoice?.amount || '0'), 0);
    const totalVat = contractInvoices.reduce((sum, ci) => sum + parseFloat(ci.invoice?.vat || '0'), 0);
    const totalSum = contractInvoices.reduce((sum, ci) => sum + parseFloat(ci.invoice?.total || '0'), 0);
    const currency = contractInvoices[0]?.invoice?.currency || contract.currency || 'RON';

    const reportHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fișa Contract ${sanitizeHtml(contract.contractNumber)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      color: #333;
      padding: 20px;
      background: white;
    }
    .header {
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 15px;
      color: #1a1a1a;
    }
    .header-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .header-info-item {
      display: flex;
      flex-direction: column;
    }
    .header-info-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .header-info-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 11px;
    }
    thead {
      background-color: #f5f5f5;
      border-bottom: 2px solid #333;
    }
    th {
      text-align: left;
      padding: 10px 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      color: #333;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    tbody tr:hover {
      background-color: #f9f9f9;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .summary {
      margin-top: 30px;
      border-top: 2px solid #333;
      padding-top: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
    }
    .summary-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .summary-total {
      color: #16a34a;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-paid {
      background-color: #dcfce7;
      color: #166534;
    }
    .badge-sent {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .badge-draft {
      background-color: #f3f4f6;
      color: #374151;
    }
    .badge-overdue {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .badge-cancelled {
      background-color: #fee2e2;
      color: #991b1b;
    }
    @media print {
      body {
        padding: 15px;
      }
      .no-print {
        display: none;
      }
      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Fișa Contract ${contract.contractNumber}</h1>
    <div style="margin-bottom: 15px;">
      <div class="header-info-item" style="margin-bottom: 10px;">
        <span class="header-info-label">${t('title') || 'Obiect'}</span>
        <span class="header-info-value">${sanitizeHtml(contract.title || '-')}</span>
      </div>
    </div>
    <div class="header-info">
      <div class="header-info-item">
        <span class="header-info-label">${t('contractNumber')}</span>
        <span class="header-info-value">${sanitizeHtml(contract.contractNumber)}</span>
      </div>
      <div class="header-info-item">
        <span class="header-info-label">${t('clients')}</span>
        <span class="header-info-value">${sanitizeHtml(getClientNameById(contract.clientId, clients))}</span>
      </div>
      <div class="header-info-item">
        <span class="header-info-label">${t('period') || 'Perioadă'}</span>
        <span class="header-info-value">${contract.startDate ? formatDate(contract.startDate) : '-'} - ${contract.endDate ? formatDate(contract.endDate) : '-'}</span>
      </div>
      <div class="header-info-item">
        <span class="header-info-label">${t('amount')}</span>
        <span class="header-info-value">${formatCurrency(contract.amount, contract.currency)}</span>
      </div>
    </div>
    <div class="header-info" style="margin-top: 10px;">
      <div class="header-info-item">
        <span class="header-info-label">${t('status')}</span>
        <span class="header-info-value">${sanitizeHtml(t(contract.status))}</span>
      </div>
      <div class="header-info-item"></div>
      <div class="header-info-item"></div>
      <div class="header-info-item">
        <span class="header-info-label">Generat la</span>
        <span class="header-info-value">${new Date().toLocaleString('ro-RO')}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${t('period')}</th>
        <th>${t('invoiceNumber')}</th>
        <th>${t('date')}</th>
        <th>${t('dueDate')}</th>
        <th class="text-right">${t('amount')}</th>
        <th class="text-right">${t('vat')}</th>
        <th class="text-right">${t('total')}</th>
        <th>${t('status')}</th>
        <th>${t('paymentDate')}</th>
      </tr>
    </thead>
    <tbody>
      ${contractInvoices
        .map((ci: ContractInvoice) => {
          const statusClass =
            ci.invoice?.status === 'paid'
              ? 'badge-paid'
              : ci.invoice?.status === 'sent'
                ? 'badge-sent'
                : ci.invoice?.status === 'draft'
                  ? 'badge-draft'
                  : ci.invoice?.status === 'overdue'
                    ? 'badge-overdue'
                    : ci.invoice?.status === 'cancelled'
                      ? 'badge-cancelled'
                      : 'badge-draft';

          return `
        <tr>
          <td>${sanitizeHtml(`${months[ci.periodMonth - 1] || ci.periodMonth} ${ci.periodYear}`)}</td>
          <td>${sanitizeHtml(ci.invoice?.invoiceNumber || '-')}</td>
          <td>${formatDate(ci.invoice?.date)}</td>
          <td>${formatDate(ci.invoice?.dueDate)}</td>
          <td class="text-right">${ci.invoice?.amount ? formatCurrency(ci.invoice.amount, currency) : '-'}</td>
          <td class="text-right">${ci.invoice?.vat ? formatCurrency(ci.invoice.vat, currency) : '-'}</td>
          <td class="text-right"><strong>${ci.invoice?.total ? formatCurrency(ci.invoice.total, currency) : '-'}</strong></td>
          <td><span class="badge ${statusClass}">${sanitizeHtml(t(ci.invoice?.status || 'draft'))}</span></td>
          <td>${formatDate(ci.invoice?.paymentDate)}</td>
        </tr>
        `;
        })
        .join('')}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-label">${t('totalInvoices')}</span>
        <span class="summary-value">${contractInvoices.length}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">${t('totalAmount')}</span>
        <span class="summary-value">${formatCurrency(totalAmount, currency)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">${t('totalVat')}</span>
        <span class="summary-value">${formatCurrency(totalVat, currency)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">${t('totalSum')}</span>
        <span class="summary-value summary-total">${formatCurrency(totalSum, currency)}</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <Button onClick={handlePrintReport} variant="outline" disabled={contractInvoices.length === 0}>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      {t('printReport') || 'Tipărește Raport'}
    </Button>
  );
}

