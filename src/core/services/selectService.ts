import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type { SelectOption, SelectQuery } from "@/core/interfaces/select";

export const SelectService = {
  selectBranches(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectBranches, query);
  },

  selectClients(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectClients, query);
  },

  selectEmployees(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectEmployees, query);
  },

  selectPaymentMethods(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectPaymentMethods, query);
  },

  selectProductCategories(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectProductCategories, query);
  },

  selectProducts(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectProducts, query);
  },

  selectRoles(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectRoles, query);
  },

  selectSuppliers(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectSuppliers, query);
  },

  selectTaxes(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectTaxes, query);
  },

  selectUnitsOfMeasure(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectUnitsOfMeasure, query);
  },

  selectUsers(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectUsers, query);
  },

  selectWarehouses(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectWarehouses, query);
  },
};

function callSelect(endpoint: any, query?: SelectQuery) {
  const endpointWithQuery =
    endpoint.path +
    (query ? toQueryString(query as Record<string, unknown>) : "");

  return callEndpoint<SelectOption[]>({
    ...endpoint,
    path: endpointWithQuery,
  });
}
