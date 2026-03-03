import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import type {
  SupplierContactCreateResponse,
  SupplierContactUpsertRequest,
} from "@/core/interfaces/suppliers";

type NoContent = Record<string, never>;

export const SupplierContactsService = {
  create(
    supplierId: string,
    payload: SupplierContactUpsertRequest,
  ): Promise<SupplierContactCreateResponse> {
    return callEndpoint<
      SupplierContactCreateResponse,
      SupplierContactUpsertRequest
    >(Endpoints.createSupplierContact, {
      params: { supplierId },
      body: payload,
    });
  },

  update(
    supplierId: string,
    contactId: string,
    payload: SupplierContactUpsertRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, SupplierContactUpsertRequest>(
      Endpoints.updateSupplierContact,
      {
        params: { supplierId, contactId },
        body: payload,
      },
    );
  },

  delete(supplierId: string, contactId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteSupplierContact, {
      params: { supplierId, contactId },
    });
  },

  setPrimary(supplierId: string, contactId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.setPrimarySupplierContact, {
      params: { supplierId, contactId },
    });
  },
};
