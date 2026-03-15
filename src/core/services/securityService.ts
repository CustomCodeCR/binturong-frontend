import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";

import type { Scope } from "@/core/interfaces/scopes";

export const SecurityService = {
  getScopes(): Promise<Scope[]> {
    return callEndpoint<Scope[]>(Endpoints.getScopes);
  },
};
