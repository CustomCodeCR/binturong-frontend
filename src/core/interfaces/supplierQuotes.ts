export type SupplierQuoteStatus = string;

export interface SupplierQuoteLine {
  supplierQuoteLineId: string;
  productId: string;
  productName: string | null;
  quantity: number;
}

export interface SupplierQuoteResponseLine {
  productId: string;
  productName: string | null;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
  conditions: string;
}

export interface SupplierQuote {
  id: string;
  supplierQuoteId: string;
  code: string;

  supplierId: string;
  supplierName: string | null;

  branchId: string;
  branchName: string | null;

  requestedAtUtc: string;
  respondedAtUtc: string | null;

  status: SupplierQuoteStatus;
  notes: string;

  supplierMessage: string | null;
  rejectReason: string | null;

  lines: SupplierQuoteLine[];
  responseLines: SupplierQuoteResponseLine[];
}

/** POST /api/suppliers/quotes */
export interface SupplierQuoteCreateLineRequest {
  productId: string;
  quantity: number;
}

export interface SupplierQuoteCreateRequest {
  code: string;
  supplierId: string;
  branchId: string;
  requestedAtUtc: string;
  notes: string;
  lines: SupplierQuoteCreateLineRequest[];
}

export interface SupplierQuoteCreateResponse {
  supplierQuoteId: string;
}

export interface SupplierQuotesBrowseQuery {
  search?: string;
  supplierId?: string;
  branchId?: string;
  status?: string;
  skip?: number;
  take?: number;
}

/** POST /api/suppliers/quotes/{{id}}/respond */
export interface SupplierQuoteRespondLineRequest {
  productId: string;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
  conditions: string;
}

export interface SupplierQuoteRespondRequest {
  respondedAtUtc: string;
  supplierMessage: string;
  lines: SupplierQuoteRespondLineRequest[];
}

/** POST /api/suppliers/quotes/{{id}}/reject */
export interface SupplierQuoteRejectRequest {
  reason: string;
  rejectedAtUtc: string;
}
