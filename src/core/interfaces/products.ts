export interface Product {
  id: string;
  productId: string;

  sku: string;
  barcode: string;
  name: string;
  description: string;

  categoryId: string;
  categoryName: string | null;

  uomId: string;
  uomCode: string | null;
  uomName: string | null;

  taxId: string;
  taxCode: string | null;
  taxPercentage: number;

  basePrice: number;
  averageCost: number;

  isService: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  isPublished: boolean;
  imageS3Keys: string[];
}

/** POST /api/products */
export interface ProductCreateRequest {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: string;
  uomId: string;
  taxId: string;
  basePrice: number;
  averageCost: number;
  isService: boolean;
  isActive: boolean;
}

export interface ProductCreateResponse {
  productId: string;
}

/** GET /api/products query params */
export interface ProductsBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** PUT /api/products/{{id}} */
export interface ProductUpdateRequest {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: string;
  uomId: string;
  taxId: string;
  basePrice: number;
  averageCost: number;
  isService: boolean;
  isActive: boolean;
}
