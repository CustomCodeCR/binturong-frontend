import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  AccountingEntriesBrowseQuery,
  AccountingEntry,
  AccountingReconciliationSummary,
  CashFlow,
  CreateExpenseRequest,
  CreateExpenseResponse,
  CreateIncomeRequest,
  CreateIncomeResponse,
  IncomeStatement,
} from "@/core/interfaces/accounting";

type NoContent = Record<string, never>;

export const AccountingService = {
  browseEntries(
    query?: AccountingEntriesBrowseQuery,
  ): Promise<AccountingEntry[]> {
    const path =
      Endpoints.browseAccountingEntries.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<AccountingEntry[]>({
      ...Endpoints.browseAccountingEntries,
      path,
    });
  },

  createIncome(payload: CreateIncomeRequest): Promise<CreateIncomeResponse> {
    return callEndpoint<CreateIncomeResponse, CreateIncomeRequest>(
      Endpoints.createIncomeEntry,
      { body: payload },
    );
  },

  createExpense(payload: CreateExpenseRequest): Promise<CreateExpenseResponse> {
    return callEndpoint<CreateExpenseResponse, CreateExpenseRequest>(
      Endpoints.createExpenseEntry,
      { body: payload },
    );
  },

  getIncomeStatement(fromUtc: string, toUtc: string): Promise<IncomeStatement> {
    const path =
      Endpoints.getIncomeStatement.path + toQueryString({ fromUtc, toUtc });

    return callEndpoint<IncomeStatement>({
      ...Endpoints.getIncomeStatement,
      path,
    });
  },

  exportIncomeStatementPdf(fromUtc: string, toUtc: string): Promise<Blob> {
    const path =
      Endpoints.exportIncomeStatementPdf.path +
      toQueryString({ fromUtc, toUtc });

    return callEndpoint<Blob>({
      ...Endpoints.exportIncomeStatementPdf,
      path,
      responseType: "blob",
    });
  },

  getCashFlow(fromUtc: string, toUtc: string): Promise<CashFlow> {
    const path = Endpoints.getCashFlow.path + toQueryString({ fromUtc, toUtc });

    return callEndpoint<CashFlow>({
      ...Endpoints.getCashFlow,
      path,
    });
  },

  exportCashFlowExcel(fromUtc: string, toUtc: string): Promise<Blob> {
    const path =
      Endpoints.exportCashFlowExcel.path + toQueryString({ fromUtc, toUtc });

    return callEndpoint<Blob>({
      ...Endpoints.exportCashFlowExcel,
      path,
      responseType: "blob",
    });
  },

  getReconciliationSummary(): Promise<AccountingReconciliationSummary> {
    return callEndpoint<AccountingReconciliationSummary>(
      Endpoints.getAccountingReconciliationSummary,
    );
  },
};
