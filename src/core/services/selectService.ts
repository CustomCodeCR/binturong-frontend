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

  selectServices(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectServices, query);
  },

  selectQuotes(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectQuotes, query);
  },

  selectRoles(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectRoles, query);
  },

  selectSalesOrders(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectSalesOrders, query);
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

  selectPurchaseOrders(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectPurchaseOrders, query);
  },

  selectPurchaseRequests(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectPurchaseRequests, query);
  },

  selectInvoices(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectInvoices, query);
  },

  selectContracts(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectContracts, query);
  },

  selectDiscountPolicies(query?: SelectQuery): Promise<SelectOption[]> {
    return callSelect(Endpoints.selectDiscountPolicies, query);
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
