export interface ContractsBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ContractMilestone {
  milestoneId: string;
  description: string;
  percentage: number;
  amount: number;
  scheduledDate: string;
  isBilled: boolean;
  invoiceId: string | null;
}

export interface ContractAttachment {
  attachmentId: string;
  fileName: string;
  contentType: string;
  storageKey: string;
  size: number;
  uploadedAt: string;
}

export interface Contract {
  id: string;
  contractId: string;
  code: string;
  clientId: string;
  clientName: string;
  quoteId: string | null;
  salesOrderId: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  description: string;
  notes: string;
  milestones: ContractMilestone[];
  attachments: ContractAttachment[];
}

export interface ContractCreateRequest {
  code: string;
  clientId: string;
  quoteId?: string;
  salesOrderId?: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  notes: string;
  milestones: {
    description: string;
    percentage: number;
    amount: number;
    scheduledDate: string;
  }[];
}

export interface ContractCreateResponse {
  contractId: string;
}

export interface ContractUpdateRequest {
  code: string;
  clientId: string;
  quoteId?: string;
  salesOrderId?: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  notes: string;
}

export interface QuoteToContractRequest {
  startDate: string;
  endDate: string;
  responsibleUserId: string;
  description: string;
  notes: string;
  autoRenewEnabled: boolean;
  autoRenewEveryDays: number;
  expiryNoticeDays: number;
}

export interface QuoteToContractResponse {
  contractId: string;
}

export interface ContractMilestoneCreateRequest {
  description: string;
  percentage: number;
  amount: number;
  scheduledDate: string;
}

export interface ContractMilestoneCreateResponse {
  milestoneId: string;
}

export interface ContractMilestoneUpdateRequest {
  description: string;
  percentage: number;
  amount: number;
  scheduledDate: string;
  isBilled: boolean;
  invoiceId?: string | null;
}

export interface ContractAttachmentUploadResponse {
  attachmentId: string;
}
