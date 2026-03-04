import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  AccountsReceivableItem,
  AccountsReceivableQuery,
} from "@/core/interfaces/accountsReceivable";

export const AccountsReceivableService = {
  getAccountsReceivable(
    query?: AccountsReceivableQuery,
  ): Promise<AccountsReceivableItem[]> {
    const endpointWithQuery =
      Endpoints.getAccountsReceivable.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<AccountsReceivableItem[]>({
      ...Endpoints.getAccountsReceivable,
      path: endpointWithQuery,
    });
  },
};
