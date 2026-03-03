export type PurchaseReceiptStatus = string;

export interface PurchaseReceiptLine {
  receiptDetailId?: string; // response
  productId: string;
  productName?: string | null;
  quantityReceived: number;
  unitCost: number;
}

export interface PurchaseReceipt {
  id: string;
  receiptId: string;

  purchaseOrderId: string;
  purchaseOrderCode: string | null;

  warehouseId: string;
  warehouseName: string | null;

  receiptDate: string;
  status: PurchaseReceiptStatus;
  notes: string;

  lines: PurchaseReceiptLine[];
}

export interface PurchaseReceiptCreateLineRequest {
  productId: string;
  quantityReceived: number;
  unitCost: number;
}

export interface PurchaseReceiptCreateRequest {
  purchaseOrderId: string;
  warehouseId: string;
  receiptDateUtc: string;
  notes: string;
  lines: PurchaseReceiptCreateLineRequest[];
}

export interface PurchaseReceiptCreateResponse {
  receiptId: string;
}

export interface PurchasesReceiptsBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PurchaseReceiptRejectRequest {
  reason: string;
  rejectedAtUtc: string;
}
