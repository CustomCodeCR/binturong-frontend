import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  AccountPayable,
  AccountsPayablesBrowseQuery,
  AccountPayableCreateRequest,
  AccountPayableCreateResponse,
  AccountPayableRegisterPaymentRequest,
} from "@/core/interfaces/accountsPayable";

type NoContent = Record<string, never>;

export const AccountsPayableService = {
  create(
    payload: AccountPayableCreateRequest,
  ): Promise<AccountPayableCreateResponse> {
    return callEndpoint<
      AccountPayableCreateResponse,
      AccountPayableCreateRequest
    >(Endpoints.createAccountPayable, {
      body: payload,
    });
  },

  browse(query?: AccountsPayablesBrowseQuery): Promise<AccountPayable[]> {
    const endpointWithQuery =
      Endpoints.getAccountsPayables.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<AccountPayable[]>({
      ...Endpoints.getAccountsPayables,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<AccountPayable> {
    return callEndpoint<AccountPayable>(Endpoints.getAccountPayableById, {
      params: { id },
    });
  },

  registerPayment(
    id: string,
    payload: AccountPayableRegisterPaymentRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, AccountPayableRegisterPaymentRequest>(
      Endpoints.registerPaymentAccountPayable,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
