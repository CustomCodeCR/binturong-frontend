export type ServiceOrderStatus =
  | "Pending"
  | "Assigned"
  | "InProgress"
  | "Closed"
  | "Canceled"
  | string;

export interface ServiceOrderServiceLine {
  serviceOrderServiceId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  rateApplied: number;
  lineTotal: number;
}

export interface ServiceOrderTechnicianLine {
  serviceOrderTechnicianId: string;
  employeeId: string;
  employeeName: string;
  techRole: string;
  assignedAtUtc: string;
}

export interface ServiceOrderMaterialLine {
  serviceOrderMaterialId: string;
  productId: string;
  productName: string;
  quantity: number;
  estimatedCost: number;
}

export interface ServiceOrderChecklistLine {
  checklistId: string;
  description: string;
  isCompleted: boolean;
}

export interface ServiceOrderPhotoLine {
  photoId: string;
  photoS3Key: string;
  description: string | null;
}

export interface ServiceOrder {
  id: string;
  serviceOrderId: string;

  code: string;

  clientId: string;
  clientName: string;

  branchId: string | null;
  branchName: string | null;

  contractId: string | null;
  contractCode: string | null;

  scheduledDate: string;
  closedDate: string | null;

  status: ServiceOrderStatus;
  serviceAddress: string;
  notes: string | null;

  services: ServiceOrderServiceLine[];
  technicians: ServiceOrderTechnicianLine[];
  materials: ServiceOrderMaterialLine[];
  checklists: ServiceOrderChecklistLine[];
  photos: ServiceOrderPhotoLine[];
}

/** POST /api/service-orders */
export interface ServiceOrderCreateServiceItemRequest {
  serviceId: string;
  quantity: number;
}

export interface ServiceOrderCreateMaterialItemRequest {
  productId: string;
  quantity: number;
  estimatedCost: number;
}

export interface ServiceOrderCreateChecklistItemRequest {
  description: string;
  isCompleted: boolean;
}

export interface ServiceOrderCreatePhotoItemRequest {
  photoS3Key: string;
  description: string;
}

export interface ServiceOrderCreateRequest {
  code: string;
  clientId: string;
  branchId: string | null;
  contractId: string | null;
  scheduledDate: string;
  serviceAddress: string;
  notes: string;
  services: ServiceOrderCreateServiceItemRequest[];
  materials: ServiceOrderCreateMaterialItemRequest[];
  checklists: ServiceOrderCreateChecklistItemRequest[];
  photos: ServiceOrderCreatePhotoItemRequest[];
}

export interface ServiceOrderCreateResponse {
  serviceOrderId: string;
}

/** POST /api/service-orders/{{id}}/assign-technician */
export interface AssignServiceOrderTechnicianRequest {
  employeeId: string;
  techRole: string;
}

/** GET /api/service-orders query params */
export interface ServiceOrdersBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  contractId?: string;
}
