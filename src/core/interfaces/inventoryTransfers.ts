// -------------------------
// CREATE
// -------------------------
export interface InventoryTransferCreateLineRequest {
  productId: string; // uuid
  quantity: number;
  fromWarehouseId: string; // uuid
  toWarehouseId: string; // uuid
}

export interface InventoryTransferCreateRequest {
  fromBranchId: string; // uuid
  toBranchId: string; // uuid
  notes: string;
  createdByUserId: string; // uuid
  lines: InventoryTransferCreateLineRequest[];
}

export interface InventoryTransferCreateResponse {
  transferId: string; // uuid
}

// -------------------------
// BROWSE / READ
// -------------------------
export interface InventoryTransfersBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface InventoryTransferLine {
  lineId: string; // uuid
  productId: string; // uuid
  quantity: number;
  fromWarehouseId: string; // uuid
  toWarehouseId: string; // uuid
}

export interface InventoryTransfer {
  id: string; // e.g. "transfer:<uuid>"
  transferId: string; // uuid

  fromBranchId: string; // uuid
  toBranchId: string; // uuid

  status: string; // "Draft" | etc (si luego querés lo tipamos)
  notes: string;

  createdByUserId: string; // uuid
  approvedByUserId: string | null; // uuid?
  rejectionReason: string | null;

  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime

  lines: InventoryTransferLine[];
}

// -------------------------
// ACTIONS
// -------------------------
export interface ApproveInventoryTransferRequest {
  approvedByUserId: string; // uuid
}

export interface ConfirmInventoryTransferRequest {
  requireApproval: boolean;
}

export interface RejectInventoryTransferRequest {
  rejectedByUserId: string; // uuid
  reason: string;
}
