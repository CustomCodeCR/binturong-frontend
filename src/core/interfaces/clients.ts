export type QueryObject = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ClientsBrowseQuery extends QueryObject {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ClientHistoryQuery extends QueryObject {
  from?: string; // datetime ISO string
  to?: string; // datetime ISO string
  status?: string;
  skip?: number;
  take?: number;
}

// -------------------- Client CRUD --------------------

export interface ClientCreateRequest {
  personType: string;
  identificationType: string;
  identification: string;
  tradeName: string;
  contactName: string;
  email: string;
  primaryPhone: string;
  secondaryPhone: string;
  industry: string;
  clientType: string;
  score: number;
  isActive: boolean;
}

export interface ClientCreateResponse {
  clientId: string;
}

export interface ClientUpdateRequest {
  tradeName: string;
  contactName: string;
  email: string;
  primaryPhone: string;
  secondaryPhone: string;
  industry: string;
  clientType: string;
  score: number;
  isActive: boolean;
}

// -------------------- Client View Model --------------------

export interface ClientKpis {
  outstandingBalance: number;
  totalInvoicedLast90Days: number;
  openQuotesCount: number;
  openSalesOrdersCount: number;
  activeContractsCount: number;
  openServiceOrdersCount: number;
}

export interface ClientContact {
  id: string | null;
  contactId: string;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface ClientAddress {
  id: string | null;
  addressId: string;
  addressType: string;
  addressLine: string;
  province: string;
  canton: string;
  district: string;
  notes: string | null;
  isPrimary: boolean;
}

export interface ClientAttachment {
  id: string | null;
  attachmentId: string;
  fileName: string;
  fileS3Key: string;
  documentType: string;
  uploadedAt: string; // ISO datetime
}

export interface Client {
  id: string;
  clientId: string;

  personType: string;
  identificationType: string;
  identification: string;

  tradeName: string;
  contactName: string;
  email: string;

  primaryPhone: string;
  secondaryPhone: string;

  industry: string;
  clientType: string;

  score: number;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  addresses: ClientAddress[];
  contacts: ClientContact[];
  attachments: ClientAttachment[];

  kpis: ClientKpis;
}

// -------------------- History --------------------
// Your sample shows the client history returns SalesOrders array.
export interface ClientSalesOrderLine {
  salesOrderDetailId: string;
  productId: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
  lineTotal: number;
}

export interface ClientHistoryItem {
  id: string;
  salesOrderId: string;
  code: string;

  quoteId: string | null;

  clientId: string;
  clientName: string | null;

  branchId: string;
  branchName: string | null;

  sellerUserId: string | null;

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

  lines: ClientSalesOrderLine[];
}

// -------------------- Contacts Requests --------------------

export interface ClientContactCreateRequest {
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface ClientContactCreateResponse {
  contactId: string;
}

export type ClientContactUpdateRequest = ClientContactCreateRequest;

// -------------------- Attachments (form-data) --------------------

export interface ClientAttachmentAddResponse {
  attachmentId: string;
}

// -------------------- Addresses Requests --------------------

export interface ClientAddressCreateRequest {
  addressType: string;
  addressLine: string;
  province: string;
  canton: string;
  district: string;
  notes: string;
  isPrimary: boolean;
}

export interface ClientAddressCreateResponse {
  addressId: string;
}

export type ClientAddressUpdateRequest = ClientAddressCreateRequest;
