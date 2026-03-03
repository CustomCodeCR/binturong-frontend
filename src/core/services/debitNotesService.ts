import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  DebitNote,
  DebitNotesBrowseQuery,
  DebitNoteCreateRequest,
  DebitNoteCreateResponse,
  DebitNoteEmitResponse,
} from "@/core/interfaces/debitNotes";

type NoContent = Record<string, never>;

export const DebitNotesService = {
  create(payload: DebitNoteCreateRequest): Promise<DebitNoteCreateResponse> {
    return callEndpoint<DebitNoteCreateResponse, DebitNoteCreateRequest>(
      Endpoints.createDebitNote,
      { body: payload },
    );
  },

  browse(query?: DebitNotesBrowseQuery): Promise<DebitNote[]> {
    const endpointWithQuery =
      Endpoints.getDebitNotes.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<DebitNote[]>({
      ...Endpoints.getDebitNotes,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<DebitNote> {
    return callEndpoint<DebitNote>(Endpoints.getDebitNoteById, {
      params: { id },
    });
  },

  emit(id: string): Promise<DebitNoteEmitResponse> {
    return callEndpoint<DebitNoteEmitResponse>(Endpoints.emitDebitNote, {
      params: { id },
    });
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteDebitNote, {
      params: { id },
    });
  },
};
