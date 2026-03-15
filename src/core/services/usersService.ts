import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  User,
  UserCreateRequest,
  UserCreateResponse,
  UsersBrowseQuery,
  UserUpdateRequest,
  UserModifyRoleRequest,
  UserAddScopesRequest,
} from "@/core/interfaces/users";

type NoContent = Record<string, never>;

export const UsersService = {
  create(payload: UserCreateRequest): Promise<UserCreateResponse> {
    return callEndpoint<UserCreateResponse, UserCreateRequest>(
      Endpoints.createUser,
      {
        body: payload,
      },
    );
  },

  browse(query?: UsersBrowseQuery): Promise<User[]> {
    const endpointWithQuery =
      Endpoints.browseUsers.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<User[]>({
      ...Endpoints.browseUsers,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<User> {
    return callEndpoint<User>(Endpoints.readUserById, {
      params: { id },
    });
  },

  update(id: string, payload: UserUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, UserUpdateRequest>(Endpoints.updateUser, {
      params: { id },
      body: payload,
    });
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteUser, {
      params: { id },
    });
  },

  modifyRole(id: string, payload: UserModifyRoleRequest): Promise<NoContent> {
    return callEndpoint<NoContent, UserModifyRoleRequest>(
      Endpoints.modifyUserRole,
      {
        params: { id },
        body: payload,
      },
    );
  },

  removeRole(id: string, roleId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.removeUserRole, {
      params: { id, roleId },
    });
  },

  addScopes(id: string, payload: UserAddScopesRequest): Promise<NoContent> {
    return callEndpoint<NoContent, UserAddScopesRequest>(
      Endpoints.addUserScopes,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
