export interface UnitOfMeasure {
  id: string;
  uomId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/units-of-measure */
export interface UnitOfMeasureCreateRequest {
  code: string;
  name: string;
  isActive: boolean;
}

export interface UnitOfMeasureCreateResponse {
  uomId: string;
}

/** GET /api/units-of-measure query params */
export interface UnitsOfMeasureBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** PUT /api/units-of-measure/{{id}} */
export interface UnitOfMeasureUpdateRequest {
  code: string;
  name: string;
  isActive: boolean;
}
