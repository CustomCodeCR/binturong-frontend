export interface DiscountPolicy {
  id: string;
  policyId: string;
  name: string;
  maxDiscountPercentage: number;
  requiresApprovalAboveLimit: boolean;
  isActive: boolean;
}

export interface DiscountApprovalRequest {
  id: string;
  approvalRequestId: string;
  salesOrderId: string;
  salesOrderCode: string | null;
  salesOrderDetailId: string | null;
  scope: string;
  requestedPercentage: number;
  requestedAmount: number;
  reason: string;
  requestedByUserId: string;
  requestedByUserName: string | null;
  requestedAtUtc: string;
  status: string;
  resolvedByUserId: string | null;
  resolvedByUserName: string | null;
  resolvedAtUtc: string | null;
  rejectionReason: string | null;
}

export interface DiscountHistoryItem {
  id: string;
  historyId: string;
  salesOrderId: string;
  salesOrderCode: string | null;
  salesOrderDetailId: string | null;
  scope: string;
  action: string;
  discountPercentage: number;
  discountAmount: number;
  reason: string | null;
  rejectionReason: string | null;
  userId: string;
  userName: string | null;
  eventDateUtc: string;
}

export interface DiscountPoliciesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface DiscountApprovalBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface DiscountHistoryBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  fromUtc?: string;
  toUtc?: string;
}

export interface CreateDiscountPolicyRequest {
  name: string;
  maxDiscountPercentage: number;
  requiresApprovalAboveLimit: boolean;
  isActive: boolean;
}

export interface CreateDiscountPolicyResponse {
  policyId: string;
}

export interface UpdateDiscountPolicyRequest {
  name: string;
  maxDiscountPercentage: number;
  requiresApprovalAboveLimit: boolean;
  isActive: boolean;
}

export interface RequestLineDiscountApprovalRequest {
  salesOrderId: string;
  salesOrderDetailId: string;
  discountPerc: number;
  reason: string;
}

export interface RequestLineDiscountApprovalResponse {
  approvalRequestId: string;
}

export interface RequestGlobalDiscountApprovalRequest {
  salesOrderId: string;
  discountPerc: number;
  reason: string;
}

export interface RequestGlobalDiscountApprovalResponse {
  approvalRequestId: string;
}

export interface RejectDiscountApprovalRequest {
  rejectionReason: string;
}

export interface ApplyLineDiscountRequest {
  salesOrderId: string;
  salesOrderDetailId: string;
  discountPerc: number;
  reason: string;
  policyId: string;
}

export interface ApplyApprovedLineDiscountRequest {
  salesOrderId: string;
  salesOrderDetailId: string;
  discountPerc: number;
  reason: string;
  approvalRequestId: string;
}

export interface RemoveLineDiscountRequest {
  salesOrderId: string;
  salesOrderDetailId: string;
}

export interface ApplyGlobalDiscountRequest {
  salesOrderId: string;
  discountPerc: number;
  reason: string;
  policyId: string;
}

export interface ApplyApprovedGlobalDiscountRequest {
  salesOrderId: string;
  discountPerc: number;
  reason: string;
  approvalRequestId: string;
}

export interface RemoveGlobalDiscountRequest {
  salesOrderId: string;
}
