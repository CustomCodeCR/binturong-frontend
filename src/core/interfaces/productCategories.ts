export interface ProductCategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
}

/** POST /api/product-categories */
export interface ProductCategoryCreateRequest {
  name: string;
  description: string;
  isActive: boolean;
}

export interface ProductCategoryCreateResponse {
  categoryId: string;
}

/** GET /api/product-categories query params */
export interface ProductCategoriesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** PUT /api/product-categories/{{id}} */
export interface ProductCategoryUpdateRequest {
  name: string;
  description: string;
  isActive: boolean;
}
