// -------------------- Requests / Responses --------------------

export interface InventoryMovementCreateBaseRequest {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  notes: string;
  sourceId: number;
}

export interface PurchaseInInventoryRequest extends InventoryMovementCreateBaseRequest {}

export interface PurchaseInInventoryResponse {
  movementId: string;
}

export interface ServiceOutInventoryRequest extends InventoryMovementCreateBaseRequest {}

export interface ServiceOutInventoryResponse {
  movementId: string;
}

export interface PhysicalAdjustmentInventoryRequest {
  productId: string;
  warehouseId: string;
  countedStock: number;
  unitCost: number;
  justification: string;
}

export interface PhysicalAdjustmentInventoryResponse {
  movementId: string;
}
