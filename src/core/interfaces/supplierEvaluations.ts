export interface SupplierEvaluation {
  id: string;
  supplierEvaluationId: string;

  supplierId: string;
  supplierName: string | null;

  score: number;
  classification: string;
  comment: string;
  evaluatedAtUtc: string;
}

export interface SupplierEvaluationCreateRequest {
  supplierId: string;
  score: number;
  comment: string;
  evaluatedAtUtc: string;
}

export interface SupplierEvaluationCreateResponse {
  supplierEvaluationId: string;
}

export interface SupplierEvaluationsBrowseQuery {
  page?: number;
  pageSize?: number;
}
