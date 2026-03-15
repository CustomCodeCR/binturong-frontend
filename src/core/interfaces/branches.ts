// -------------------- Core Models --------------------

export interface BranchWarehouseSummary {
  warehouseId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Branch {
  id: string; // e.g. "branch:<uuid>"
  branchId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  warehouses: BranchWarehouseSummary[];
}

// -------------------- CRUD --------------------

export interface BranchCreateRequest {
  code: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface BranchCreateResponse {
  branchId: string;
}

export interface BranchUpdateRequest {
  code: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface BranchesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

// -------------------- Reports --------------------

export interface BranchSalesByDay {
  dayUtc: string; // ISO date-time (00:00:00Z)
  ordersCount: number;
  totalSales: number;
}

export interface BranchSalesByCurrency {
  currency: string;
  ordersCount: number;
  totalSales: number;
}

export interface BranchSalesReport {
  branchId: string;
  from: string | null;
  to: string | null;
  ordersCount: number;
  totalSales: number;
  averageOrder: number;
  byDay: BranchSalesByDay[];
  byCurrency: BranchSalesByCurrency[];
}

export interface BranchSalesReportQuery {
  from?: string; // datetime ISO
  to?: string; // datetime ISO
  status?: string;
}

export interface CompareBranchesQuery {
  branchAId: string;
  branchBId: string;
  from?: string; // datetime ISO
  to?: string; // datetime ISO
  status?: string;
}

export interface CompareBranchesResponse {
  branchAId: string;
  branchBId: string;
  from: string | null;
  to: string | null;
  branchA: BranchSalesReport;
  branchB: BranchSalesReport;
  totalSalesDiff: number;
  totalSalesDiffPerc: number;
  ordersCountDiff: number;
  ordersCountDiffPerc: number;
}

// -------------------- Inventory --------------------

export interface BranchInventoryItem {
  productId: string;
  productName: string | null;
  stock: number;
}
