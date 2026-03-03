export interface CreditNotesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CreditNote {
  id: string;
  creditNoteId: string;

  invoiceId: string;
  invoiceConsecutive: string | null;

  taxKey: string | null;
  consecutive: string | null;

  issueDate: string;

  reason: string;
  totalAmount: number;

  taxStatus: string;

  pdfS3Key: string | null;
  xmlS3Key: string | null;
}

export interface CreditNoteCreateRequest {
  invoiceId: string;
  reason: string;
  totalAmount: number;
  issueDate: string;
}

export interface CreditNoteCreateResponse {
  creditNoteId: string;
}

export interface CreditNoteEmitResponse {
  mode: string;
  taxStatus: string;
  taxKey: string;
  consecutive: string;
  pdfKey: string;
  xmlKey: string;
  message: string;
}
