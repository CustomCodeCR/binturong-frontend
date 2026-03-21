import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  ClientReport,
  CreateReportScheduleRequest,
  CreateReportScheduleResponse,
  FinancialReport,
  InventoryReport,
  ReportSchedule,
  ReportSchedulesBrowseQuery,
  ServiceOrdersReport,
  UpdateReportScheduleRequest,
} from "@/core/interfaces/reports";

type NoContent = Record<string, never>;

export const ReportsService = {
  getFinancial(fromUtc: string, toUtc: string): Promise<FinancialReport> {
    const path =
      Endpoints.getFinancialReport.path + toQueryString({ fromUtc, toUtc });

    return callEndpoint<FinancialReport>({
      ...Endpoints.getFinancialReport,
      path,
    });
  },

  exportFinancialPdf(fromUtc: string, toUtc: string): Promise<Blob> {
    const path =
      Endpoints.exportFinancialReportPdf.path +
      toQueryString({ fromUtc, toUtc });

    return callEndpoint<Blob>({
      ...Endpoints.exportFinancialReportPdf,
      path,
      responseType: "blob",
    });
  },

  getInventory(categoryId?: string | null): Promise<InventoryReport> {
    const path =
      Endpoints.getInventoryReport.path +
      toQueryString({ categoryId: categoryId ?? undefined });

    return callEndpoint<InventoryReport>({
      ...Endpoints.getInventoryReport,
      path,
    });
  },

  exportInventoryExcel(categoryId?: string | null): Promise<Blob> {
    const path =
      Endpoints.exportInventoryReportExcel.path +
      toQueryString({ categoryId: categoryId ?? undefined });

    return callEndpoint<Blob>({
      ...Endpoints.exportInventoryReportExcel,
      path,
      responseType: "blob",
    });
  },

  getClientHistory(clientId: string): Promise<ClientReport> {
    return callEndpoint<ClientReport>(Endpoints.getClientReport, {
      params: { clientId },
    });
  },

  exportClientHistoryExcel(clientId: string): Promise<Blob> {
    return callEndpoint<Blob>(Endpoints.exportClientReportExcel, {
      params: { clientId },
      responseType: "blob",
    });
  },

  getServiceOrders(
    fromUtc: string,
    toUtc: string,
    employeeId?: string | null,
  ): Promise<ServiceOrdersReport> {
    const path =
      Endpoints.getServiceOrdersReport.path +
      toQueryString({
        fromUtc,
        toUtc,
        employeeId: employeeId ?? undefined,
      });

    return callEndpoint<ServiceOrdersReport>({
      ...Endpoints.getServiceOrdersReport,
      path,
    });
  },

  exportServiceOrdersExcel(
    fromUtc: string,
    toUtc: string,
    employeeId?: string | null,
  ): Promise<Blob> {
    const path =
      Endpoints.exportServiceOrdersReportExcel.path +
      toQueryString({
        fromUtc,
        toUtc,
        employeeId: employeeId ?? undefined,
      });

    return callEndpoint<Blob>({
      ...Endpoints.exportServiceOrdersReportExcel,
      path,
      responseType: "blob",
    });
  },

  browseSchedules(
    query?: ReportSchedulesBrowseQuery,
  ): Promise<ReportSchedule[]> {
    const path =
      Endpoints.browseReportSchedules.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<ReportSchedule[]>({
      ...Endpoints.browseReportSchedules,
      path,
    });
  },

  createSchedule(
    payload: CreateReportScheduleRequest,
  ): Promise<CreateReportScheduleResponse> {
    return callEndpoint<
      CreateReportScheduleResponse,
      CreateReportScheduleRequest
    >(Endpoints.createReportSchedule, { body: payload });
  },

  updateSchedule(
    id: string,
    payload: UpdateReportScheduleRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, UpdateReportScheduleRequest>(
      Endpoints.updateReportSchedule,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
