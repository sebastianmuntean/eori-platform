/**
 * Invoice item template generator for contracts
 */

export interface InvoiceItemTemplate {
  description: string;
  quantity: number;
  unitPrice: number;
  vat: number;
  total: number;
}

export interface ContractInvoiceTemplate {
  description: string;
  items: InvoiceItemTemplate[];
}

/**
 * Generate invoice item from contract
 * @param contract - Contract data
 * @param periodYear - Year for the invoice period
 * @param periodMonth - Month for the invoice period
 * @param template - Optional template from database
 * @returns Invoice item template
 */
export function generateContractInvoiceItem(
  contract: {
    contractNumber: string;
    title: string | null;
    assetReference: string | null;
    description: string | null;
    amount: string;
    type: string;
    invoiceItemTemplate?: any;
    partner?: { companyName: string | null; firstName: string | null; lastName: string | null; code: string } | null;
    startDate?: string | null;
    endDate?: string | null;
  },
  periodYear: number,
  periodMonth: number,
  template?: any
): InvoiceItemTemplate {
  const contractTemplate = template || contract.invoiceItemTemplate;
  
  // Build description from template or contract data
  let description: string;
  if (contractTemplate?.description) {
    // Replace template variables - get partner name from contract
    const partnerName = contract.partner 
      ? (contract.partner.companyName || `${contract.partner.firstName || ''} ${contract.partner.lastName || ''}`.trim() || contract.partner.code)
      : '';
    const startDate = contract.startDate || '';
    const endDate = contract.endDate || '';
    const amount = contract.amount || '0';
    
    // Replace template variables - order matters: replace longer patterns first
    description = contractTemplate.description
      .replace(/{contractNumber}/g, contract.contractNumber)
      .replace(/{partnerName}/g, partnerName)
      .replace(/{assetReference}/g, contract.assetReference || '')
      .replace(/{title}/g, contract.title || '')
      .replace(/{startDate}/g, startDate)
      .replace(/{endDate}/g, endDate)
      .replace(/{periodYear}/g, periodYear.toString())
      .replace(/{periodMonth}/g, periodMonth.toString())
      .replace(/{amount}/g, parseFloat(amount).toFixed(2));
    
    // Add period if not already in template
    if (!contractTemplate.description.includes('{periodMonth}') && !contractTemplate.description.includes('{periodYear}')) {
      description += ` - Perioada ${periodMonth}/${periodYear}`;
    }
  } else {
    // Default description
    const baseDescription = contract.assetReference || contract.title || `Contract ${contract.contractNumber}`;
    description = `${baseDescription} - Perioada ${periodMonth}/${periodYear}`;
  }

  // Get quantity from template or default to 1
  const quantity = contractTemplate?.quantity || 1;

  // Get unit price from template or contract amount
  let unitPrice: number;
  if (contractTemplate?.useContractAmount === false && contractTemplate?.unitPrice !== undefined && contractTemplate?.unitPrice !== null) {
    unitPrice = parseFloat(contractTemplate.unitPrice.toString());
  } else {
    unitPrice = parseFloat(contract.amount || '0');
  }

  // Validate unitPrice
  if (isNaN(unitPrice) || unitPrice <= 0) {
    console.warn(`Invalid unitPrice for contract ${contract.contractNumber}, using 0`);
    unitPrice = 0;
  }

  // Get VAT rate from template or default to 0
  const vatRate = contractTemplate?.vatRate || 0;
  const vat = (unitPrice * quantity * vatRate) / 100;
  const total = (unitPrice * quantity) + vat;
  
  return {
    description,
    quantity,
    unitPrice,
    vat: isNaN(vat) ? 0 : vat,
    total: isNaN(total) ? 0 : total,
  };
}

/**
 * Generate invoice description from contract
 */
export function generateContractInvoiceDescription(
  contract: {
    contractNumber: string;
    title: string | null;
  },
  periodYear: number,
  periodMonth: number
): string {
  const contractInfo = contract.title 
    ? `Contract ${contract.contractNumber} - ${contract.title}`
    : `Contract ${contract.contractNumber}`;
  
  return `${contractInfo} - Perioada ${periodMonth}/${periodYear}`;
}

/**
 * Generate invoice items array from contract
 */
export function generateContractInvoiceItems(
  contract: {
    contractNumber: string;
    title: string | null;
    assetReference: string | null;
    description: string | null;
    amount: string;
    type: string;
    invoiceItemTemplate?: any;
    partner?: { companyName: string | null; firstName: string | null; lastName: string | null; code: string } | null;
    startDate?: string | null;
    endDate?: string | null;
  },
  periodYear: number,
  periodMonth: number,
  template?: any
): InvoiceItemTemplate[] {
  return [generateContractInvoiceItem(contract, periodYear, periodMonth, template)];
}

