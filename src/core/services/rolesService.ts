import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Role,
  RoleCreateRequest,
  RoleCreateResponse,
  RolesBrowseQuery,
  RoleUpdateRequest,
  RoleAddScopesRequest,
} from "@/core/interfaces/roles";

type NoContent = Record<string, never>;

export const RolesService = {
  create(payload: RoleCreateRequest): Promise<RoleCreateResponse> {
    return callEndpoint<RoleCreateResponse, RoleCreateRequest>(
      Endpoints.createRole,
      { body: payload },
    );
  },

  browse(query?: RolesBrowseQuery): Promise<Role[]> {
    const endpointWithQuery =
      Endpoints.browseRoles.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Role[]>({
      ...Endpoints.browseRoles,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Role> {
    return callEndpoint<Role>(Endpoints.readRoleById, {
      params: { id },
    });
  },

  update(id: string, payload: RoleUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, RoleUpdateRequest>(Endpoints.updateRole, {
      params: { id },
      body: payload,
    });
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteRole, {
      params: { id },
    });
  },

  addScopes(id: string, payload: RoleAddScopesRequest): Promise<NoContent> {
    return callEndpoint<NoContent, RoleAddScopesRequest>(
      Endpoints.addScopesToRole,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
