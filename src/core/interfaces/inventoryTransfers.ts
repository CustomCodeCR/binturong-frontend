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
  productSku?: string | null;
  productName?: string | null;

  quantity: number;

  fromWarehouseId: string; // uuid
  fromWarehouseCode?: string | null;
  fromWarehouseName?: string | null;

  toWarehouseId: string; // uuid
  toWarehouseCode?: string | null;
  toWarehouseName?: string | null;
}

export interface InventoryTransfer {
  id: string; // e.g. "transfer:<uuid>"
  transferId: string; // uuid

  fromBranchId: string; // uuid
  toBranchId: string; // uuid

  fromBranchCode?: string | null;
  fromBranchName?: string | null;

  toBranchCode?: string | null;
  toBranchName?: string | null;

  status: string;
  notes: string | null;

  createdByUserId: string; // uuid
  createdByUsername?: string | null;
  createdByEmail?: string | null;

  approvedByUserId: string | null; // uuid?
  approvedByUsername?: string | null;
  approvedByEmail?: string | null;

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
  receivedByUserId: string; // uuid
}

export interface RejectInventoryTransferRequest {
  rejectedByUserId: string; // uuid
  reason: string;
}
