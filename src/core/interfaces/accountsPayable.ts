export interface AccountsPayablesBrowseQuery {
  page?: number;
  pageSize?: number;
  overdue?: boolean;
  search?: string;
}

export type AccountPayableStatus =
  | "Pending"
  | "Paid"
  | "Cancelled"
  | "Overdue"
  | string;

export interface AccountPayable {
  id: string;
  accountPayableId: string;

  supplierId: string;
  supplierName: string;

  purchaseOrderId: string;
  supplierInvoiceId: string;

  documentDate: string; // ISO datetime
  dueDate: string; // ISO datetime

  totalAmount: number;
  pendingBalance: number;

  currency: string;
  status: AccountPayableStatus;
}

export interface AccountPayableCreateRequest {
  supplierId: string;
  purchaseOrderId: string;
  supplierInvoiceId: string;
  documentDate: string; // "YYYY-MM-DD"
  dueDate: string; // "YYYY-MM-DD"
  totalAmount: number;
  currency: string;
}

export interface AccountPayableCreateResponse {
  accountPayableId: string;
}

export interface AccountPayableRegisterPaymentRequest {
  amount: number;
  paidAtUtc: string; // ISO datetime
  notes: string;
}
