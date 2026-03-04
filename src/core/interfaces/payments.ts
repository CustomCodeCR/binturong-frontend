// -------------------------
// REGISTER PAYMENTS (Requests)
// -------------------------
export interface RegisterPaymentCashRequest {
  invoiceId: string; // uuid
  clientId: string; // uuid
  paymentMethodId: string; // uuid
  paymentDate: string; // ISO datetime
  amountTendered: number;
  notes?: string | null;
}

export interface RegisterPaymentTransferRequest {
  invoiceId: string; // uuid
  clientId: string; // uuid
  paymentMethodId: string; // uuid
  paymentDate: string; // ISO datetime
  amount: number;
  reference: string;
  isBankConfirmed: boolean;
  notes?: string | null;
}

export interface RegisterPaymentCardRequest {
  invoiceId: string; // uuid
  clientId: string; // uuid
  paymentMethodId: string; // uuid
  paymentDate: string; // ISO datetime
  amount: number;
  isPosAvailable: boolean;
  isApproved: boolean;
  posAuthCode: string;
  notes?: string | null;
}

export interface RegisterPartialPaymentRequest {
  invoiceId: string; // uuid
  clientId: string; // uuid
  paymentMethodId: string; // uuid
  paymentDate: string; // ISO datetime
  amount: number;
  reference: string;
  notes?: string | null;
}

// -------------------------
// REGISTER PAYMENTS (Responses)
// -------------------------
export interface RegisterPaymentCashResponse {
  paymentId: string;
  invoiceId: string;
  invoiceTotal: number;
  paidNow: number;
  changeAmount: number;
  invoiceInternalStatus: string;
}

export interface RegisterPaymentTransferResponse {
  paymentId: string;
  invoiceId: string;
  appliedAmount: number;
  invoiceInternalStatus: string;
}

export interface RegisterPaymentCardResponse {
  paymentId: string;
  invoiceId: string;
  appliedAmount: number;
  invoiceInternalStatus: string;
}

export interface RegisterPartialPaymentResponse {
  paymentId: string;
}

// -------------------------
// BROWSE / READ PAYMENTS
// -------------------------
export interface PaymentsBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  paymentMethodId?: string; // uuid
}

export interface AppliedInvoice {
  invoiceId: string;
  invoiceConsecutive: string | null;
  appliedAmount: number;
}

export interface Payment {
  id: string;
  paymentId: string;

  clientId: string;
  clientName: string;

  paymentMethodId: string;
  paymentMethodCode: string;
  paymentMethodDescription: string;

  paymentDate: string; // ISO datetime
  totalAmount: number;

  reference: string | null;
  notes: string | null;

  appliedInvoices: AppliedInvoice[];
}

// -------------------------
// REPORTS
// -------------------------
export interface ReportPaymentQuery {
  from?: string; // datetime
  to?: string; // datetime
  clientId?: string; // uuid
  paymentMethodId?: string; // uuid
  search?: string;
}
