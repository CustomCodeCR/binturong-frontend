import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type { AuditLog, AuditBrowseQuery } from "@/core/interfaces/audit";

type NoContent = Record<string, never>;

export const AuditService = {
  /**
   * GET /api/audit
   * Query: from, to, module, action
   * Returns: AuditEvent[]
   */
  browse(query?: AuditBrowseQuery): Promise<AuditLog[]> {
    const endpointWithQuery =
      Endpoints.browseAudit.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<AuditLog[]>({
      ...Endpoints.browseAudit,
      path: endpointWithQuery,
    });
  },

  /**
   * GET /api/audit/export/pdf
   * Query: from, to, module, action
   * Returns: Blob (PDF)
   */
  exportPdf(query?: AuditBrowseQuery): Promise<Blob> {
    const endpointWithQuery =
      Endpoints.exportAuditPdf.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Blob>({
      ...Endpoints.exportAuditPdf,
      path: endpointWithQuery,
      headers: {
        ...(Endpoints.exportAuditPdf.headers ?? {}),
        Accept: "application/pdf",
      },
    });
  },

  /**
   * GET /api/audit/export/excel
   * Query: from, to, module, action
   * Returns: Blob (Excel)
   */
  exportExcel(query?: AuditBrowseQuery): Promise<Blob> {
    const endpointWithQuery =
      Endpoints.exportAuditExcel.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Blob>({
      ...Endpoints.exportAuditExcel,
      path: endpointWithQuery,
      headers: {
        ...(Endpoints.exportAuditExcel.headers ?? {}),
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  },
};
