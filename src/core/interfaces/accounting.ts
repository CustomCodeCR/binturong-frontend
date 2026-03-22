export interface AccountingEntry {
  id: string;
  accountingEntryId: string;
  entryType: string;
  amount: number;
  detail: string;
  category: string;
  entryDateUtc: string;
  clientId: string | null;
  clientName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  invoiceNumber: string | null;
  receiptFileS3Key: string | null;
  isReconciled: boolean;
  reconciliationId: string | null;
}

export interface AccountingEntriesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  entryType?: string;
}

export interface CreateIncomeRequest {
  amount: number;
  detail: string;
  category: string;
  entryDateUtc: string;
  clientId: string;
  invoiceNumber: string;
}

export interface CreateIncomeResponse {
  accountingEntryId: string;
}

export interface CreateExpenseRequest {
  amount: number;
  detail: string;
  category: string;
  entryDateUtc: string;
  supplierId: string;
  receiptFileS3Key: string | null;
}

export interface CreateExpenseResponse {
  accountingEntryId: string;
}

export interface IncomeStatement {
  fromUtc: string;
  toUtc: string;
  totalIncome: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  hasData: boolean;
  message: string | null;
}

export interface CashFlowPoint {
  dateUtc: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CashFlow {
  fromUtc: string;
  toUtc: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  points: CashFlowPoint[];
}

export interface AccountingUnmatchedItem {
  accountingEntryId: string;
  entryType: string;
  amount: number;
  detail: string;
  entryDateUtc: string;
  invoiceNumber: string | null;
}

export interface AccountingReconciliationSummary {
  matchedCount: number;
  unmatchedCount: number;
  differences: AccountingUnmatchedItem[];
}
