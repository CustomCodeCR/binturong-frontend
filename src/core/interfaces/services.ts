export type ServiceAvailabilityStatus =
  | "Active"
  | "Inactive"
  | "Maintenance"
  | string;

export interface Service {
  id: string;
  serviceId: string;

  code: string;
  name: string;
  description: string | null;

  categoryId: string;
  categoryName: string;
  isCategoryProtected: boolean;

  standardTimeMin: number;
  baseRate: number;

  isActive: boolean;
  availabilityStatus: ServiceAvailabilityStatus;
}

/** POST /api/services */
export interface ServiceCreateRequest {
  code: string;
  name: string;
  description: string;
  categoryId: string;
  isCategoryProtected: boolean;
  standardTimeMin: number;
  baseRate: number;
  isActive: boolean;
  availabilityStatus: ServiceAvailabilityStatus;
}

export interface ServiceCreateResponse {
  serviceId: string;
}

/** PUT /api/services/{{id}} */
export interface ServiceUpdateRequest {
  code: string;
  name: string;
  description: string;
  categoryId: string;
  isCategoryProtected: boolean;
  standardTimeMin: number;
  baseRate: number;
  isActive: boolean;
  availabilityStatus: ServiceAvailabilityStatus;
}

/** GET /api/services query params */
export interface ServicesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}
