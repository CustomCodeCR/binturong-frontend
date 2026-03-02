export interface Tax {
  id: string;
  taxId: string;
  name: string;
  code: string;
  percentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/taxes */
export interface TaxCreateRequest {
  name: string;
  code: string;
  percentage: number;
  isActive: boolean;
}

export interface TaxCreateResponse {
  taxId: string;
}

/** GET /api/taxes query params */
export interface TaxesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** PUT /api/taxes/{{id}} */
export interface TaxUpdateRequest {
  name: string;
  code: string;
  percentage: number;
  isActive: boolean;
}
