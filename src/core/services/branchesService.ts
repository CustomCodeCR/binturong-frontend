import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Branch,
  BranchCreateRequest,
  BranchCreateResponse,
  BranchUpdateRequest,
  BranchesBrowseQuery,
  BranchSalesReport,
  BranchSalesReportQuery,
  CompareBranchesQuery,
  CompareBranchesResponse,
  BranchInventoryItem,
} from "@/core/interfaces/branches";

type NoContent = Record<string, never>;

export const BranchesService = {
  // -------------------- CRUD --------------------

  create(payload: BranchCreateRequest): Promise<BranchCreateResponse> {
    return callEndpoint<BranchCreateResponse, BranchCreateRequest>(
      Endpoints.createBranch,
      { body: payload },
    );
  },

  browse(query?: BranchesBrowseQuery): Promise<Branch[]> {
    const endpointWithQuery =
      Endpoints.browseBranches.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Branch[]>({
      ...Endpoints.browseBranches,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Branch> {
    return callEndpoint<Branch>(Endpoints.readBranchById, {
      params: { id },
    });
  },

  update(id: string, payload: BranchUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, BranchUpdateRequest>(
      Endpoints.updateBranch,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteBranch, {
      params: { id },
    });
  },

  // -------------------- Reports --------------------

  reportSalesByBranch(
    id: string,
    query?: BranchSalesReportQuery,
  ): Promise<BranchSalesReport> {
    const pathWithQuery =
      Endpoints.reportSalesByBranch.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<BranchSalesReport>(
      {
        ...Endpoints.reportSalesByBranch,
        path: pathWithQuery,
      },
      {
        params: { id },
      } as any,
    );
  },

  compare(query: CompareBranchesQuery): Promise<CompareBranchesResponse> {
    const pathWithQuery =
      Endpoints.compareBranches.path +
      (query ? toQueryString(query as unknown as Record<string, unknown>) : "");

    return callEndpoint<CompareBranchesResponse>({
      ...Endpoints.compareBranches,
      path: pathWithQuery,
    });
  },

  // Si tu backend devuelve bytes (PDF/Excel), idealmente `callEndpoint` debe soportar blob/arrayBuffer.
  // Aquí lo dejo como Promise<Blob> para que lo uses directo en UI.
  reportSalesByBranchPdf(
    id: string,
    query?: BranchSalesReportQuery,
  ): Promise<Blob> {
    const pathWithQuery =
      Endpoints.reportSalesByBranchPdf.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Blob>(
      {
        ...Endpoints.reportSalesByBranchPdf,
        path: pathWithQuery,
      },
      { params: { id } } as any,
    );
  },

  reportSalesByBranchExcel(
    id: string,
    query?: BranchSalesReportQuery,
  ): Promise<Blob> {
    const pathWithQuery =
      Endpoints.reportSalesByBranchExcel.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Blob>(
      {
        ...Endpoints.reportSalesByBranchExcel,
        path: pathWithQuery,
      },
      { params: { id } } as any,
    );
  },

  // -------------------- Inventory --------------------

  browseInventory(): Promise<BranchInventoryItem[]> {
    return callEndpoint<BranchInventoryItem[]>(
      Endpoints.browseBranchesInventory,
    );
  },

  browseInventoryByBranchId(id: string): Promise<BranchInventoryItem[]> {
    return callEndpoint<BranchInventoryItem[]>(
      Endpoints.browseBranchInventoryById,
      {
        params: { id },
      },
    );
  },
};
