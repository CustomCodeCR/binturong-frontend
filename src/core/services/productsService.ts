import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Product,
  ProductCreateRequest,
  ProductCreateResponse,
  ProductsBrowseQuery,
  ProductUpdateRequest,
} from "@/core/interfaces/products";

type NoContent = Record<string, never>;

export const ProductsService = {
  create(payload: ProductCreateRequest): Promise<ProductCreateResponse> {
    return callEndpoint<ProductCreateResponse, ProductCreateRequest>(
      Endpoints.createProduct,
      {
        body: payload,
      },
    );
  },

  browse(query?: ProductsBrowseQuery): Promise<Product[]> {
    const endpointWithQuery =
      Endpoints.browseProducts.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Product[]>({
      ...Endpoints.browseProducts,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Product> {
    return callEndpoint<Product>(Endpoints.readProductById, {
      params: { id },
    });
  },

  update(id: string, payload: ProductUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, ProductUpdateRequest>(
      Endpoints.updateProduct,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteProduct, {
      params: { id },
    });
  },
};
