import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Payroll,
  PayrollCreateRequest,
  PayrollCreateResponse,
  PayrollUpdateRequest,
  PayrollsBrowseQuery,
  PayrollCalculateRequest,
  PayrollCalculateResponse,
  OvertimePayrollCreateRequest,
  OvertimePayrollCreateResponse,
  PayrollCommissionRequest,
  PayrollEmployeeHistoryItem,
  PayrollEmployeeHistoryQuery,
} from "@/core/interfaces/payroll";

type NoContent = Record<string, never>;

export const PayrollService = {
  // -------------------------
  // Create Payroll
  // -------------------------
  createPayroll(payload: PayrollCreateRequest): Promise<PayrollCreateResponse> {
    return callEndpoint<PayrollCreateResponse, PayrollCreateRequest>(
      Endpoints.createPayroll,
      { body: payload },
    );
  },

  // -------------------------
  // Get Payrolls
  // -------------------------
  getPayrolls(query?: PayrollsBrowseQuery): Promise<Payroll[]> {
    const endpointWithQuery =
      Endpoints.getPayrolls.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Payroll[]>({
      ...Endpoints.getPayrolls,
      path: endpointWithQuery,
    });
  },

  // -------------------------
  // Get Payroll By Id
  // -------------------------
  getPayrollById(payrollId: string): Promise<Payroll> {
    return callEndpoint<Payroll>(Endpoints.getPayrollById, {
      params: { payrollId },
    });
  },

  // -------------------------
  // Update Payroll
  // -------------------------
  updatePayroll(
    payrollId: string,
    payload: PayrollUpdateRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, PayrollUpdateRequest>(
      Endpoints.updatePayroll,
      {
        params: { payrollId },
        body: payload,
      },
    );
  },

  // -------------------------
  // Delete Payroll
  // -------------------------
  deletePayroll(payrollId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deletePayroll, {
      params: { payrollId },
    });
  },

  // -------------------------
  // Calculate Payroll
  // -------------------------
  calculatePayroll(
    payload: PayrollCalculateRequest,
  ): Promise<PayrollCalculateResponse> {
    return callEndpoint<PayrollCalculateResponse, PayrollCalculateRequest>(
      Endpoints.calculatePayroll,
      { body: payload },
    );
  },

  // -------------------------
  // Create Overtime Payroll
  // -------------------------
  createOvertimePayroll(
    payload: OvertimePayrollCreateRequest,
  ): Promise<OvertimePayrollCreateResponse> {
    return callEndpoint<
      OvertimePayrollCreateResponse,
      OvertimePayrollCreateRequest
    >(Endpoints.createOvertimePayroll, { body: payload });
  },

  // -------------------------
  // Delete Overtime Payroll
  // -------------------------
  deleteOvertimePayroll(overtimeId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteOvertimePayroll, {
      params: { overtimeId },
    });
  },

  // -------------------------
  // Add Commision Payroll (spec: DELETE + body)
  // -------------------------
  addCommisionPayroll(
    payrollId: string,
    detailId: string,
    payload: PayrollCommissionRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, PayrollCommissionRequest>(
      Endpoints.addCommisionPayroll,
      {
        params: { payrollId, detailId },
        body: payload,
      },
    );
  },

  // -------------------------
  // Generate Payroll PDF
  // -------------------------
  // OJO: con tu fetchClient actual esto va a intentar parsear JSON y fallará.
  // Lo dejo igual para mantener "no modificar todos los services".
  // Si querés que funcione, te paso el cambio mínimo en fetchClient para soportar blob.
  generatePayrollPdf(payrollId: string, employeeId: string): Promise<unknown> {
    return callEndpoint<unknown>(Endpoints.generatePayrollPdf, {
      params: { payrollId, employeeId },
    });
  },

  // -------------------------
  // Send Payroll Email
  // -------------------------
  sendPayrollEmail(payrollId: string, employeeId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.sendPayrollEmail, {
      params: { payrollId, employeeId },
    });
  },

  // -------------------------
  // History Employee Payroll
  // -------------------------
  historyEmployeePayroll(
    employeeId: string,
    query?: PayrollEmployeeHistoryQuery,
  ): Promise<PayrollEmployeeHistoryItem[]> {
    const endpointWithQuery =
      replacePath(Endpoints.historyEmployeePayroll.path, { employeeId }) +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<PayrollEmployeeHistoryItem[]>({
      ...Endpoints.historyEmployeePayroll,
      path: endpointWithQuery,
    });
  },

  // -------------------------
  // Export History Employee Payroll PDF
  // -------------------------
  exportHistoryEmployeePayrollPdf(
    employeeId: string,
    query?: PayrollEmployeeHistoryQuery,
  ): Promise<unknown> {
    const endpointWithQuery =
      replacePath(Endpoints.exportHistoryEmployeePayrollPdf.path, {
        employeeId,
      }) + (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<unknown>({
      ...Endpoints.exportHistoryEmployeePayrollPdf,
      path: endpointWithQuery,
    });
  },

  // -------------------------
  // Export History Employee Payroll Excel
  // -------------------------
  exportHistoryEmployeePayrollExcel(
    employeeId: string,
    query?: PayrollEmployeeHistoryQuery,
  ): Promise<unknown> {
    const endpointWithQuery =
      replacePath(Endpoints.exportHistoryEmployeePayrollExcel.path, {
        employeeId,
      }) + (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<unknown>({
      ...Endpoints.exportHistoryEmployeePayrollExcel,
      path: endpointWithQuery,
    });
  },
};

// Helper local para NO depender de replaceEndpointParams (porque callEndpoint lo usa internamente),
// pero acá ocupamos armar path+query sin duplicar lógica.
function replacePath(path: string, params: Record<string, string>): string {
  return path.replace(/{{(\w+)}}/g, (_, k: string) => params[k] ?? "");
}
