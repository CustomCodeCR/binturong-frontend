import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Contract,
  ContractsBrowseQuery,
  ContractCreateRequest,
  ContractCreateResponse,
  ContractUpdateRequest,
  QuoteToContractRequest,
  QuoteToContractResponse,
  ContractMilestoneCreateRequest,
  ContractMilestoneCreateResponse,
  ContractMilestoneUpdateRequest,
  ContractAttachmentUploadResponse,
} from "@/core/interfaces/contracts";

type NoContent = Record<string, never>;

export const ContractsService = {
  create(payload: ContractCreateRequest): Promise<ContractCreateResponse> {
    return callEndpoint<ContractCreateResponse, ContractCreateRequest>(
      Endpoints.createContracts,
      { body: payload },
    );
  },

  browse(query?: ContractsBrowseQuery): Promise<Contract[]> {
    const endpointWithQuery =
      Endpoints.getContracts.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Contract[]>({
      ...Endpoints.getContracts,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Contract> {
    return callEndpoint<Contract>(Endpoints.getContractById, {
      params: { id },
    });
  },

  update(id: string, payload: ContractUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, ContractUpdateRequest>(
      Endpoints.updateContracts,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteContracts, {
      params: { id },
    });
  },

  convertFromQuote(
    quoteId: string,
    payload: QuoteToContractRequest,
  ): Promise<QuoteToContractResponse> {
    return callEndpoint<QuoteToContractResponse, QuoteToContractRequest>(
      Endpoints.quoteToContract,
      {
        params: { quoteId },
        body: payload,
      },
    );
  },

  addMilestone(
    id: string,
    payload: ContractMilestoneCreateRequest,
  ): Promise<ContractMilestoneCreateResponse> {
    return callEndpoint<
      ContractMilestoneCreateResponse,
      ContractMilestoneCreateRequest
    >(Endpoints.createContractMilestones, {
      params: { id },
      body: payload,
    });
  },

  updateMilestone(
    id: string,
    milestoneId: string,
    payload: ContractMilestoneUpdateRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, ContractMilestoneUpdateRequest>(
      Endpoints.updateContractMilestones,
      {
        params: { id, milestoneId },
        body: payload,
      },
    );
  },

  deleteMilestone(id: string, milestoneId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteContractMilestones, {
      params: { id, milestoneId },
    });
  },

  uploadAttachment(
    id: string,
    file: File,
  ): Promise<ContractAttachmentUploadResponse> {
    const form = new FormData();
    form.append("file", file);

    return callEndpoint<ContractAttachmentUploadResponse, FormData>(
      Endpoints.addContractAttachments,
      {
        params: { id },
        body: form,
        isFormData: true,
      },
    );
  },

  deleteAttachment(id: string, attachmentId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteContractAttachment, {
      params: { id, attachmentId },
    });
  },
};
