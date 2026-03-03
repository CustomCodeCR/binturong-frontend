export type PurchaseOrderStatus = string;

export interface PurchaseOrderLine {
  purchaseOrderDetailId?: string; // viene en response
  productId: string;
  productName?: string | null;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
  lineTotal?: number;
}

export interface PurchaseOrder {
  id: string;
  purchaseOrderId: string;
  code: string;

  supplierId: string;
  supplierName: string | null;

  branchId: string;
  branchName: string | null;

  requestId: string | null;

  orderDate: string;
  status: PurchaseOrderStatus;

  currency: string;
  exchangeRate: number;

  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;

  lines: PurchaseOrderLine[];
}

export interface PurchaseOrderCreateLineRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
}

export interface PurchaseOrderCreateRequest {
  code: string;
  supplierId: string;
  branchId: string;
  requestId: string;
  orderDateUtc: string;
  currency: string;
  exchangeRate: number;
  lines: PurchaseOrderCreateLineRequest[];
}

export interface PurchaseOrderCreateResponse {
  purchaseOrderId: string;
}

export interface PurchasesOrdersBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}
