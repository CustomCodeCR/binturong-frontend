export interface FinancialReport {
  fromUtc: string;
  toUtc: string;
  salesTotal: number;
  expensesTotal: number;
  profit: number;
  hasData: boolean;
  message: string | null;
}

export interface InventoryReportItem {
  productId: string;
  productName: string;
  categoryId: string | null;
  categoryName: string | null;
  totalStock: number;
  updatedAt: string;
}

export interface InventoryReport {
  categoryId: string | null;
  categoryName: string | null;
  hasData: boolean;
  message: string | null;
  items: InventoryReportItem[];
}

export interface ClientPurchaseReportItem {
  salesOrderId: string;
  code: string;
  orderDate: string;
  total: number;
  status: string;
}

export interface ClientServiceReportItem {
  serviceOrderId: string;
  code: string;
  scheduledDate: string;
  status: string;
  contractCode: string | null;
}

export interface ClientInvoiceReportItem {
  invoiceId: string;
  consecutive: string | null;
  issueDate: string;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  taxStatus: string;
}

export interface ClientReport {
  clientId: string;
  clientName: string;
  hasData: boolean;
  message: string | null;
  purchases: ClientPurchaseReportItem[];
  services: ClientServiceReportItem[];
  invoices: ClientInvoiceReportItem[];
}

export interface ServiceOrdersReportItem {
  serviceOrderId: string;
  code: string;
  clientName: string;
  scheduledDate: string;
  status: string;
  serviceAddress: string;
  technicians: string[];
  services: string[];
}

export interface ServiceOrdersReport {
  fromUtc: string;
  toUtc: string;
  completedCount: number;
  pendingCount: number;
  canceledCount: number;
  hasData: boolean;
  message: string | null;
  items: ServiceOrdersReportItem[];
}

export interface ReportSchedule {
  id: string;
  reportScheduleId: string;
  name: string;
  reportType: string;
  frequency: string;
  recipientEmail: string;
  timeOfDayUtc: string;
  isActive: boolean;
  branchId: string | null;
  categoryId: string | null;
  clientId: string | null;
  employeeId: string | null;
  lastSentAtUtc: string | null;
  lastAttemptAtUtc: string | null;
  lastError: string | null;
}

export interface ReportSchedulesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CreateReportScheduleRequest {
  name: string;
  reportType: string;
  frequency: string;
  recipientEmail: string;
  timeOfDayUtc: string;
  isActive: boolean;
  branchId: string | null;
  categoryId: string | null;
  clientId: string | null;
  employeeId: string | null;
}

export interface CreateReportScheduleResponse {
  reportScheduleId: string;
}

export interface UpdateReportScheduleRequest {
  name: string;
  reportType: string;
  frequency: string;
  recipientEmail: string;
  timeOfDayUtc: string;
  isActive: boolean;
  branchId: string | null;
  categoryId: string | null;
  clientId: string | null;
  employeeId: string | null;
}
