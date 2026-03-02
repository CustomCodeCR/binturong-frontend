export interface WarehouseCreateRequest {
  branchId: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface WarehouseCreateResponse {
  warehouseId: string;
}

export interface WarehouseUpdateRequest {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}
