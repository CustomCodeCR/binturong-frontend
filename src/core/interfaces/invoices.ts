export interface InvoicesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface InvoiceLine {
  invoiceDetailId: string;
  productId: string;
  productName: string;
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

  branchId: string | null;
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

  notes?: string | null;

  taxStatus: string;
  internalStatus: string;

  emailSent: boolean;

  pdfS3Key: string | null;
  xmlS3Key: string | null;

  lines: InvoiceLine[];

  paidAmount: number;
  pendingAmount: number;
}

export interface InvoiceCreateRequest {
  clientId: string;
  branchId?: string | null;
  salesOrderId?: string | null;
  contractId?: string | null;

  issueDate: string;
  documentType: string;

  currency: string;
  exchangeRate: number;

  notes?: string | null;

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
  branchId?: string | null;
  issueDate: string;
  documentType: string;
  mode: string;
}

export interface QuoteToInvoiceResponse {
  invoiceId: string;
}
