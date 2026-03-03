import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  CreditNote,
  CreditNotesBrowseQuery,
  CreditNoteCreateRequest,
  CreditNoteCreateResponse,
  CreditNoteEmitResponse,
} from "@/core/interfaces/creditNotes";

type NoContent = Record<string, never>;

export const CreditNotesService = {
  create(payload: CreditNoteCreateRequest): Promise<CreditNoteCreateResponse> {
    return callEndpoint<CreditNoteCreateResponse, CreditNoteCreateRequest>(
      Endpoints.createCreditNote,
      { body: payload },
    );
  },

  browse(query?: CreditNotesBrowseQuery): Promise<CreditNote[]> {
    const endpointWithQuery =
      Endpoints.getCreditNotes.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<CreditNote[]>({
      ...Endpoints.getCreditNotes,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<CreditNote> {
    return callEndpoint<CreditNote>(Endpoints.getCreditNoteById, {
      params: { id },
    });
  },

  emit(id: string): Promise<CreditNoteEmitResponse> {
    return callEndpoint<CreditNoteEmitResponse>(Endpoints.emitCreditNote, {
      params: { id },
    });
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteCreditNote, {
      params: { id },
    });
  },
};
