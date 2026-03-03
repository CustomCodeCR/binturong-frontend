export type QuoteStatus = string;

export interface QuoteDetail {
  quoteDetailId: string;
  productId: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  quoteId: string;
  code: string;

  clientId: string;
  clientName: string | null;

  branchId: string;
  branchName: string | null;

  issueDate: string;
  validUntil: string;

  status: QuoteStatus;

  currency: string;
  exchangeRate: number;

  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;

  acceptedByClient: boolean;
  acceptanceDate: string | null;

  version: number;
  notes: string | null;

  lines: QuoteDetail[];
}

export interface QuotesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** POST /api/quotes */
export interface QuoteCreateRequest {
  code: string;
  clientId: string;
  branchId: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  exchangeRate: number;
  notes: string;
}

export interface QuoteCreateResponse {
  quoteId: string;
}

/** POST /api/quotes/{{id}}/details */
export interface QuoteDetailCreateRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
}

export interface QuoteDetailCreateResponse {
  quoteDetailId: string;
}

/** POST /api/quotes/{{id}}/expire */
export interface QuoteExpireRequest {
  reason: string;
}
