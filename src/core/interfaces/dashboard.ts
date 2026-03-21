export interface DashboardQuery {
  branchId?: string | null;
}

export interface DashboardMainIndicators {
  monthlySalesTotal: number;
  activeContractsCount: number;
  criticalInventoryCount: number;
}

export interface DashboardMonthlySales {
  year: number;
  month: number;
  totalSalesAmount: number;
  salesOrdersCount: number;
  servicesSoldQuantity: number;
  hasRecords: boolean;
  message: string | null;
}

export interface DashboardContracts {
  activeContractsCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  hasActiveContracts: boolean;
  message: string | null;
}

export interface DashboardCriticalInventoryItem {
  productId: string;
  productName: string;

  categoryId: string | null;
  categoryName: string | null;

  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  branchId: string;

  currentStock: number;
  minStock: number;
  maxStock: number;
}

export interface DashboardCriticalInventory {
  criticalProductsCount: number;
  hasAlerts: boolean;
  message: string | null;
  items: DashboardCriticalInventoryItem[];
}

export interface Dashboard {
  lastUpdatedAtUtc: string;
  mainIndicators: DashboardMainIndicators;
  monthlySales: DashboardMonthlySales;
  contracts: DashboardContracts;
  criticalInventory: DashboardCriticalInventory;
}
