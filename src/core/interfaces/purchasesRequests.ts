export type PurchaseRequestStatus = string;

export interface PurchaseRequest {
  id: string;
  requestId: string;
  code: string;

  branchId: string;
  branchName: string | null;

  requestedById: string;
  requestedByName: string | null;

  requestDate: string;
  status: PurchaseRequestStatus;
  notes: string;
}

export interface PurchaseRequestCreateRequest {
  code: string;
  branchId: string;
  requestedById: string;
  requestDateUtc: string;
  notes: string;
}

export interface PurchaseRequestCreateResponse {
  requestId: string;
}

export interface PurchaseRequestsBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}
