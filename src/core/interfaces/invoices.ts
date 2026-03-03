export interface InvoicesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface InvoiceLine {
  invoiceDetailId: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
  lineTotal: number;
}

export interface Invoice {
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

  issueDate: string;
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

  lines: InvoiceLine[];

  paidAmount: number;
  pendingAmount: number;

  notes?: string | null;
}

export interface InvoiceCreateRequest {
  clientId: string;
  branchId: string;
  salesOrderId?: string | null;
  contractId?: string | null;

  issueDate: string;
  documentType: string;

  currency: string;
  exchangeRate: number;

  notes: string;

  lines: {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPerc: number;
    taxPerc: number;
  }[];
}

export interface InvoiceCreateResponse {
  invoiceId: string;
}

export interface InvoiceUpdateRequest {
  issueDate: string;
  documentType: string;
  currency: string;
  exchangeRate: number;
  notes: string;
  internalStatus: string;
}

export interface InvoiceEmitRequest {
  mode: string;
}

export interface InvoiceEmitResponse {
  mode: string;
  taxStatus: string;
  taxKey: string;
  consecutive: string;
  pdfKey: string;
  xmlKey: string;
  message: string;
}

export interface QuoteToInvoiceRequest {
  branchId: string;
  issueDate: string;
  documentType: string;
  mode: string;
}

export interface QuoteToInvoiceResponse {
  invoiceId: string;
}
