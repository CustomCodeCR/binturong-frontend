import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Client,
  ClientCreateRequest,
  ClientCreateResponse,
  ClientUpdateRequest,
  ClientsBrowseQuery,
  ClientHistoryQuery,
  ClientHistoryItem,
  ClientContactCreateRequest,
  ClientContactCreateResponse,
  ClientContactUpdateRequest,
  ClientAttachmentAddResponse,
  ClientAddressCreateRequest,
  ClientAddressCreateResponse,
  ClientAddressUpdateRequest,
} from "@/core/interfaces/clients";

type NoContent = Record<string, never>;

export const ClientsService = {
  // -------------------- CRUD --------------------

  create(payload: ClientCreateRequest): Promise<ClientCreateResponse> {
    return callEndpoint<ClientCreateResponse, ClientCreateRequest>(
      Endpoints.createClient,
      { body: payload },
    );
  },

  browse(query?: ClientsBrowseQuery): Promise<Client[]> {
    const endpointWithQuery =
      Endpoints.browseClients.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Client[]>({
      ...Endpoints.browseClients,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Client> {
    return callEndpoint<Client>(Endpoints.readClientById, { params: { id } });
  },

  update(id: string, payload: ClientUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, ClientUpdateRequest>(
      Endpoints.updateClient,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteClient, { params: { id } });
  },

  // -------------------- History (JSON) --------------------

  history(
    id: string,
    query?: ClientHistoryQuery,
  ): Promise<ClientHistoryItem[]> {
    const endpointWithQuery =
      Endpoints.clientHistory.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<ClientHistoryItem[]>(
      {
        ...Endpoints.clientHistory,
        path: endpointWithQuery,
      },
      {
        params: { id },
      },
    );
  },

  // -------------------- History (PDF) --------------------
  // If your callEndpoint supports blob, you can swap this to callEndpoint<Blob>.
  async historyPdfBlob(
    id: string,
    query?: Pick<ClientHistoryQuery, "from" | "to" | "status">,
  ): Promise<Blob> {
    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_API_URL as string;

    const endpointWithQuery =
      Endpoints.clientHistoryPdf.path + (query ? toQueryString(query) : "");

    // Replace {{id}} param manually here since we are not using callEndpoint.
    const url = `${baseUrl}${endpointWithQuery.replace("{{id}}", id)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: "application/pdf",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download PDF (${res.status})`);
    }

    return await res.blob();
  },

  // -------------------- Contacts --------------------

  addContact(
    clientId: string,
    payload: ClientContactCreateRequest,
  ): Promise<ClientContactCreateResponse> {
    return callEndpoint<
      ClientContactCreateResponse,
      ClientContactCreateRequest
    >(Endpoints.createClientContact, { params: { clientId }, body: payload });
  },

  updateContact(
    clientId: string,
    contactId: string,
    payload: ClientContactUpdateRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, ClientContactUpdateRequest>(
      Endpoints.updateClientContact,
      { params: { clientId, contactId }, body: payload },
    );
  },

  deleteContact(clientId: string, contactId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteClientContact, {
      params: { clientId, contactId },
    });
  },

  setPrimaryContact(clientId: string, contactId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.setPrimaryClientContact, {
      params: { clientId, contactId },
    });
  },

  // -------------------- Attachments (form-data) --------------------

  addAttachment(
    clientId: string,
    file: File,
    documentType: string,
  ): Promise<ClientAttachmentAddResponse> {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);

    return callEndpoint<ClientAttachmentAddResponse>(
      Endpoints.addClientAttachment,
      {
        params: { clientId },
        body: form,
        isFormData: true,
      },
    );
  },

  deleteAttachment(clientId: string, attachmentId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteClientAttachment, {
      params: { clientId, attachmentId },
    });
  },

  // -------------------- Addresses --------------------

  addAddress(
    clientId: string,
    payload: ClientAddressCreateRequest,
  ): Promise<ClientAddressCreateResponse> {
    return callEndpoint<
      ClientAddressCreateResponse,
      ClientAddressCreateRequest
    >(Endpoints.addClientAddress, { params: { clientId }, body: payload });
  },

  updateAddress(
    clientId: string,
    addressId: string,
    payload: ClientAddressUpdateRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, ClientAddressUpdateRequest>(
      Endpoints.updateClientAddress,
      { params: { clientId, addressId }, body: payload },
    );
  },

  deleteAddress(clientId: string, addressId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteClientAddress, {
      params: { clientId, addressId },
    });
  },

  setPrimaryAddress(clientId: string, addressId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.setPrimaryClientAddress, {
      params: { clientId, addressId },
    });
  },
};
