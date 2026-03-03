import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";
import { fetchBlobClient } from "@/core/api/fetchBlobClient";

import type { PurchaseOrder } from "@/core/interfaces/purchasesOrders";
import type {
  Supplier,
  SupplierCreateRequest,
  SupplierCreateResponse,
  SupplierUpdateRequest,
  SuppliersBrowseQuery,
  SupplierCreditUpdateRequest,
  SupplierPurchaseHistoryQuery,
  SupplierPurchaseHistoryExportQuery,
} from "@/core/interfaces/suppliers";

type NoContent = Record<string, never>;

export const SuppliersService = {
  create(payload: SupplierCreateRequest): Promise<SupplierCreateResponse> {
    return callEndpoint<SupplierCreateResponse, SupplierCreateRequest>(
      Endpoints.createSupplier,
      {
        body: payload,
      },
    );
  },

  browse(query?: SuppliersBrowseQuery): Promise<Supplier[]> {
    const endpointWithQuery =
      Endpoints.browseSuppliers.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Supplier[]>({
      ...Endpoints.browseSuppliers,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Supplier> {
    return callEndpoint<Supplier>(Endpoints.readSupplierById, {
      params: { id },
    });
  },

  update(id: string, payload: SupplierUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, SupplierUpdateRequest>(
      Endpoints.updateSupplier,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteSupplier, {
      params: { id },
    });
  },

  updateCredit(
    id: string,
    payload: SupplierCreditUpdateRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, SupplierCreditUpdateRequest>(
      Endpoints.updateSupplierCredit,
      {
        params: { id },
        body: payload,
      },
    );
  },

  purchaseHistory(
    id: string,
    query?: SupplierPurchaseHistoryQuery,
  ): Promise<PurchaseOrder[]> {
    const endpointWithQuery =
      Endpoints.supplierPurchaseHistory.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<PurchaseOrder[]>(
      {
        ...Endpoints.supplierPurchaseHistory,
        path: endpointWithQuery,
      },
      { params: { id } } as any,
    );
    // ^ Si tu callEndpoint no acepta (endpoint, {params}+path already with query) juntos,
    // avísame y lo dejamos en un helper pequeño.
  },

  async purchaseHistoryPdf(
    id: string,
    query?: SupplierPurchaseHistoryExportQuery,
  ): Promise<Blob> {
    const path =
      Endpoints.supplierPurchaseHistoryPdf.path.replace("{{id}}", id) +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return fetchBlobClient(path, {
      method: "GET",
      headers: Endpoints.supplierPurchaseHistoryPdf.headers,
    });
  },

  async purchaseHistoryExcel(
    id: string,
    query?: SupplierPurchaseHistoryExportQuery,
  ): Promise<Blob> {
    const path =
      Endpoints.supplierPurchaseHistoryExcel.path.replace("{{id}}", id) +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return fetchBlobClient(path, {
      method: "GET",
      headers: Endpoints.supplierPurchaseHistoryExcel.headers,
    });
  },
};
