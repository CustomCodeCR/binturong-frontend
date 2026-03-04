export interface AccountsReceivableQuery {
  page?: number;
  pageSize?: number;
  clientId?: string; // uuid
  status?: string;
}

export interface AccountsReceivableInvoiceLine {
  invoiceDetailId: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
  lineTotal: number;
}

export interface AccountsReceivableItem {
  id: string;
  invoiceId: string;

  taxKey: string | null;
  consecutive: string | null;

  clientId: string;
  clientName: string;

  branchId: string;
  branchName: string | null;

  salesOrderId: string | null;
  contractId: string | null;

  issueDate: string; // ISO datetime

  documentType: string;
  currency: string;
  exchangeRate: number;

  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;

  taxStatus: string;
  internalStatus: string;

  emailSent: boolean;
  pdfS3Key: string | null;
  xmlS3Key: string | null;

  lines: AccountsReceivableInvoiceLine[];

  paidAmount: number;
  pendingAmount: number;
}
