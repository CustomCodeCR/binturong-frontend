export interface DebitNotesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface DebitNote {
  id: string;
  debitNoteId: string;

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

export interface DebitNoteCreateRequest {
  invoiceId: string;
  reason: string;
  totalAmount: number;
  issueDate: string;
}

export interface DebitNoteCreateResponse {
  debitNoteId: string;
}

export interface DebitNoteEmitResponse {
  mode: string;
  taxStatus: string;
  taxKey: string;
  consecutive: string;
  pdfKey: string;
  xmlKey: string;
  message: string;
}
