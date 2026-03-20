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

export type SalesOrderLineItemType = "Product" | "Service" | string;

export interface SalesOrderLineCreateRequest {
  itemType: SalesOrderLineItemType;
  itemId: string;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
}

export interface SalesOrderCreateRequest {
  clientId: string;
  branchId: string | null;
  sellerUserId: string | null;
  currency: string;
  exchangeRate: number;
  notes: string | null;
  lines: SalesOrderLineCreateRequest[];
}

export interface SalesOrderCreateResponse {
  salesOrderId: string;
}

export interface SalesOrderFromQuoteRequest {
  branchId: string | null;
  currency: string;
  exchangeRate: number;
  notes: string | null;
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

  itemType: SalesOrderLineItemType;

  productId: string | null;
  serviceId: string | null;

  itemName: string | null;

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

  branchId: string | null;
  branchName: string | null;

  sellerUserId: string | null;
  sellerName: string | null;

  orderDate: string;
  status: string;

  currency: string;
  exchangeRate: number;

  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;

  notes: string | null;

  createdAt: string;
  updatedAt: string;

  lines: SalesOrderLine[];
}
