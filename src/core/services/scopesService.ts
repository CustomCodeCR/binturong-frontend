// src/core/services/scopesService.ts

import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";
import type { Scope } from "@/core/interfaces/roles";  // ← CAMBIO: importar de roles

export interface ScopesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const ScopesService = {
  browse(query?: ScopesBrowseQuery): Promise<Scope[]> {
    const endpointWithQuery =
      Endpoints.browseScopes.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");
    
    return callEndpoint<Scope[]>({
      ...Endpoints.browseScopes,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Scope> {
    return callEndpoint<Scope>(Endpoints.readScopeById, {
      params: { id },
    });
  },
};