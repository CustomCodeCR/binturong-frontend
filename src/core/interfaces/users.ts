export interface UserRole {
  roleId: string;
  name: string;
}

export interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  isActive: boolean;

  lastLogin: string | null;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: string | null;

  createdAt: string;
  updatedAt: string;

  roles: UserRole[];
  scopes: string[];
}

/** POST /api/users */
export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  isActive: boolean;
}

export interface UserCreateResponse {
  userId: string;
}

/** GET /api/users query params */
export interface UsersBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** PUT /api/users/{{id}} */
export interface UserUpdateRequest {
  username: string;
  email: string;
  isActive: boolean;
  lastLogin: string | null;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
}

/** PUT /api/users/{{id}}/role */
export interface UserModifyRoleRequest {
  roleId: string;
  replaceExisting: boolean;
}

/** PUT /api/users/{{id}}/scopes */
export interface UserAddScopesRequest {
  scopeIds: string[];
}
