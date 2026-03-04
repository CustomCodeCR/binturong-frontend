import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  InventoryTransfer,
  InventoryTransfersBrowseQuery,
  InventoryTransferCreateRequest,
  InventoryTransferCreateResponse,
  ApproveInventoryTransferRequest,
  ConfirmInventoryTransferRequest,
  RejectInventoryTransferRequest,
} from "@/core/interfaces/inventoryTransfers";

type NoContent = Record<string, never>;

export const InventoryTransfersService = {
  // -------------------------
  // Create InventoryTransfer
  // -------------------------
  createInventoryTransfer(
    payload: InventoryTransferCreateRequest,
  ): Promise<InventoryTransferCreateResponse> {
    return callEndpoint<
      InventoryTransferCreateResponse,
      InventoryTransferCreateRequest
    >(Endpoints.createInventoryTransfer, { body: payload });
  },

  // -------------------------
  // Get InventoryTransfers
  // -------------------------
  getInventoryTransfers(
    query?: InventoryTransfersBrowseQuery,
  ): Promise<InventoryTransfer[]> {
    const endpointWithQuery =
      Endpoints.getInventoryTransfers.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<InventoryTransfer[]>({
      ...Endpoints.getInventoryTransfers,
      path: endpointWithQuery,
    });
  },

  // -------------------------
  // Get InventoryTransfer By Id
  // -------------------------
  getInventoryTransferById(id: string): Promise<InventoryTransfer> {
    return callEndpoint<InventoryTransfer>(Endpoints.getInventoryTransferById, {
      params: { id },
    });
  },

  // -------------------------
  // Delete InventoryTransfer
  // -------------------------
  deleteInventoryTransfer(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteInventoryTransfer, {
      params: { id },
    });
  },

  // -------------------------
  // Request Review InventoryTransfer
  // -------------------------
  requestReviewInventoryTransfer(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.requestReviewInventoryTransfer, {
      params: { id },
    });
  },

  // -------------------------
  // Approve InventoryTransfer
  // -------------------------
  approveInventoryTransfer(
    id: string,
    payload: ApproveInventoryTransferRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, ApproveInventoryTransferRequest>(
      Endpoints.approveInventoryTransfer,
      {
        params: { id },
        body: payload,
      },
    );
  },

  // -------------------------
  // Confirm InventoryTransfer
  // -------------------------
  confirmInventoryTransfer(
    id: string,
    payload: ConfirmInventoryTransferRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, ConfirmInventoryTransferRequest>(
      Endpoints.confirmInventoryTransfer,
      {
        params: { id },
        body: payload,
      },
    );
  },

  // -------------------------
  // Reject InventoryTransfer
  // -------------------------
  rejectInventoryTransfer(
    id: string,
    payload: RejectInventoryTransferRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, RejectInventoryTransferRequest>(
      Endpoints.rejectInventoryTransfer,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
