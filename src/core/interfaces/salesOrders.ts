export type QueryObject = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface SalesOrdersBrowseQuery extends QueryObject {
  page?: number;
  pageSize?: number;
  search?: string;
}

// -------------------- Requests / Responses --------------------

export interface SalesOrderLineCreateRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
}

export interface SalesOrderCreateRequest {
  clientId: string;
  branchId: string;
  sellerUserId: string;
  currency: string;
  exchangeRate: number;
  notes: string;
  lines: SalesOrderLineCreateRequest[];
}

export interface SalesOrderCreateResponse {
  salesOrderId: string;
}

export interface SalesOrderFromQuoteRequest {
  branchId: string;
  currency: string;
  exchangeRate: number;
  notes: string;
}

export interface SalesOrderFromQuoteResponse {
  salesOrderId: string;
}

export interface SalesOrderConfirmRequest {
  sellerUserId: string;
}

// -------------------- Read Models (GET responses) --------------------

export interface SalesOrderLine {
  salesOrderDetailId: string;
  productId: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  salesOrderId: string;
  code: string;

  quoteId: string | null;

  clientId: string;
  clientName: string | null;

  branchId: string;
  branchName: string | null;

  sellerUserId: string | null;

  orderDate: string; // ISO datetime
  status: string;

  currency: string;
  exchangeRate: number;

  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;

  notes: string | null;

  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime

  lines: SalesOrderLine[];
}
