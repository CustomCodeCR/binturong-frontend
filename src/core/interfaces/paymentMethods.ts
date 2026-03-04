export interface PaymentMethodsBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaymentMethod {
  id: string;
  paymentMethodId: string;
  code: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
}

export interface PaymentMethodCreateRequest {
  code: string;
  description: string;
  isActive: boolean;
}

export interface PaymentMethodCreateResponse {
  paymentMethodId: string;
}

export interface PaymentMethodUpdateRequest {
  code: string;
  description: string;
  isActive: boolean;
}
