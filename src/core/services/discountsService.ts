import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  ApplyApprovedGlobalDiscountRequest,
  ApplyApprovedLineDiscountRequest,
  ApplyGlobalDiscountRequest,
  ApplyLineDiscountRequest,
  CreateDiscountPolicyRequest,
  CreateDiscountPolicyResponse,
  DiscountApprovalBrowseQuery,
  DiscountApprovalRequest,
  DiscountHistoryBrowseQuery,
  DiscountHistoryItem,
  DiscountPoliciesBrowseQuery,
  DiscountPolicy,
  RejectDiscountApprovalRequest,
  RemoveGlobalDiscountRequest,
  RemoveLineDiscountRequest,
  RequestGlobalDiscountApprovalRequest,
  RequestGlobalDiscountApprovalResponse,
  RequestLineDiscountApprovalRequest,
  RequestLineDiscountApprovalResponse,
  UpdateDiscountPolicyRequest,
} from "@/core/interfaces/discounts";

type NoContent = Record<string, never>;

export const DiscountsService = {
  browsePolicies(
    query?: DiscountPoliciesBrowseQuery,
  ): Promise<DiscountPolicy[]> {
    const path =
      Endpoints.browseDiscountPolicies.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<DiscountPolicy[]>({
      ...Endpoints.browseDiscountPolicies,
      path,
    });
  },

  readPolicyById(id: string): Promise<DiscountPolicy> {
    return callEndpoint<DiscountPolicy>(Endpoints.readDiscountPolicyById, {
      params: { id },
    });
  },

  createPolicy(
    payload: CreateDiscountPolicyRequest,
  ): Promise<CreateDiscountPolicyResponse> {
    return callEndpoint<
      CreateDiscountPolicyResponse,
      CreateDiscountPolicyRequest
    >(Endpoints.createDiscountPolicy, { body: payload });
  },

  updatePolicy(
    id: string,
    payload: UpdateDiscountPolicyRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, UpdateDiscountPolicyRequest>(
      Endpoints.updateDiscountPolicy,
      {
        params: { id },
        body: payload,
      },
    );
  },

  browseApprovalRequests(
    query?: DiscountApprovalBrowseQuery,
  ): Promise<DiscountApprovalRequest[]> {
    const path =
      Endpoints.browseDiscountApprovalRequests.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<DiscountApprovalRequest[]>({
      ...Endpoints.browseDiscountApprovalRequests,
      path,
    });
  },

  requestLineApproval(
    payload: RequestLineDiscountApprovalRequest,
  ): Promise<RequestLineDiscountApprovalResponse> {
    return callEndpoint<
      RequestLineDiscountApprovalResponse,
      RequestLineDiscountApprovalRequest
    >(Endpoints.requestLineDiscountApproval, { body: payload });
  },

  requestGlobalApproval(
    payload: RequestGlobalDiscountApprovalRequest,
  ): Promise<RequestGlobalDiscountApprovalResponse> {
    return callEndpoint<
      RequestGlobalDiscountApprovalResponse,
      RequestGlobalDiscountApprovalRequest
    >(Endpoints.requestGlobalDiscountApproval, { body: payload });
  },

  approveApprovalRequest(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.approveDiscountApprovalRequest, {
      params: { id },
    });
  },

  rejectApprovalRequest(
    id: string,
    payload: RejectDiscountApprovalRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, RejectDiscountApprovalRequest>(
      Endpoints.rejectDiscountApprovalRequest,
      {
        params: { id },
        body: payload,
      },
    );
  },

  applyLine(payload: ApplyLineDiscountRequest): Promise<NoContent> {
    return callEndpoint<NoContent, ApplyLineDiscountRequest>(
      Endpoints.applyLineDiscount,
      { body: payload },
    );
  },

  applyApprovedLine(
    payload: ApplyApprovedLineDiscountRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, ApplyApprovedLineDiscountRequest>(
      Endpoints.applyApprovedLineDiscount,
      { body: payload },
    );
  },

  removeLine(payload: RemoveLineDiscountRequest): Promise<NoContent> {
    return callEndpoint<NoContent, RemoveLineDiscountRequest>(
      Endpoints.removeLineDiscount,
      { body: payload },
    );
  },

  applyGlobal(payload: ApplyGlobalDiscountRequest): Promise<NoContent> {
    return callEndpoint<NoContent, ApplyGlobalDiscountRequest>(
      Endpoints.applyGlobalDiscount,
      { body: payload },
    );
  },

  applyApprovedGlobal(
    payload: ApplyApprovedGlobalDiscountRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, ApplyApprovedGlobalDiscountRequest>(
      Endpoints.applyApprovedGlobalDiscount,
      { body: payload },
    );
  },

  removeGlobal(payload: RemoveGlobalDiscountRequest): Promise<NoContent> {
    return callEndpoint<NoContent, RemoveGlobalDiscountRequest>(
      Endpoints.removeGlobalDiscount,
      { body: payload },
    );
  },

  browseHistory(
    query?: DiscountHistoryBrowseQuery,
  ): Promise<DiscountHistoryItem[]> {
    const path =
      Endpoints.browseDiscountHistory.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<DiscountHistoryItem[]>({
      ...Endpoints.browseDiscountHistory,
      path,
    });
  },

  exportHistory(query?: DiscountHistoryBrowseQuery): Promise<Blob> {
    const path =
      Endpoints.exportDiscountHistory.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Blob>({
      ...Endpoints.exportDiscountHistory,
      path,
      responseType: "blob",
    });
  },
};
