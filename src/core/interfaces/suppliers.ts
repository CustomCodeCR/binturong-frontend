export interface SupplierContact {
  id: string | null;
  contactId: string;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface SupplierAttachment {
  id: string | null;
  attachmentId: string;
  fileName: string;
  fileS3Key: string;
  documentType: string;
  uploadedAt: string;
}

export interface Supplier {
  id: string;
  supplierId: string;

  identificationType: string;
  identification: string;

  legalName: string;
  tradeName: string;

  email: string;
  phone: string;

  paymentTerms: string;
  mainCurrency: string;

  creditLimit: number | null;
  creditDays: number | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  contacts: SupplierContact[];
  attachments: SupplierAttachment[];

  pendingPayables: number;
}

export interface SuppliersBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** POST /api/suppliers */
export interface SupplierCreateRequest {
  identificationType: string;
  identification: string;
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  paymentTerms: string;
  mainCurrency: string;
  isActive: boolean;
}

export interface SupplierCreateResponse {
  supplierId: string;
}

/** PUT /api/suppliers/{{id}} */
export interface SupplierUpdateRequest {
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  paymentTerms: string;
  mainCurrency: string;
  isActive: boolean;
}

/** PUT /api/suppliers/{{id}}/credit */
export interface SupplierCreditUpdateRequest {
  creditLimit: number;
  creditDays: number;
}

/** Contacts */
export interface SupplierContactUpsertRequest {
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface SupplierContactCreateResponse {
  contactId: string;
}

/** Attachments (FormData) */
export interface SupplierAttachmentCreateResponse {
  attachmentId: string;
}

export interface SupplierPurchaseHistoryQuery {
  from?: string; // datetime ISO
  to?: string; // datetime ISO
  status?: string;
  skip?: number;
  take?: number;
}

export interface SupplierPurchaseHistoryExportQuery {
  from?: string; // datetime ISO
  to?: string; // datetime ISO
  status?: string;
}
