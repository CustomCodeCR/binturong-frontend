import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  ProductCategory,
  ProductCategoryCreateRequest,
  ProductCategoryCreateResponse,
  ProductCategoriesBrowseQuery,
  ProductCategoryUpdateRequest,
} from "@/core/interfaces/productCategories";

type NoContent = Record<string, never>;

export const ProductCategoriesService = {
  create(
    payload: ProductCategoryCreateRequest,
  ): Promise<ProductCategoryCreateResponse> {
    return callEndpoint<
      ProductCategoryCreateResponse,
      ProductCategoryCreateRequest
    >(Endpoints.createProductCategory, { body: payload });
  },

  browse(query?: ProductCategoriesBrowseQuery): Promise<ProductCategory[]> {
    const endpointWithQuery =
      Endpoints.browseProductCategories.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<ProductCategory[]>({
      ...Endpoints.browseProductCategories,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<ProductCategory> {
    return callEndpoint<ProductCategory>(Endpoints.readProductCategoryById, {
      params: { id },
    });
  },

  update(
    id: string,
    payload: ProductCategoryUpdateRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, ProductCategoryUpdateRequest>(
      Endpoints.updateProductCategory,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteProductCategory, {
      params: { id },
    });
  },
};
