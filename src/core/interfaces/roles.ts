import type { Scope } from "@/core/interfaces/scopes";

// -------------------- Models --------------------

export interface Role {
  id: string; // e.g. "role:<uuid>"
  roleId: string;
  name: string;
  description: string;
  isActive: boolean;
  scopes: Scope[];
}

// -------------------- CRUD --------------------

export interface RoleCreateRequest {
  name: string;
  description: string;
  isActive: boolean;
  /**
   * El backend exige al menos un permiso al crear el rol y los guarda de forma
   * atómica, así que se envían aquí en vez de en una segunda llamada.
   */
  scopeIds: string[];
}

export interface RoleCreateResponse {
  roleId: string;
}

export interface RolesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface RoleUpdateRequest {
  name: string;
  description: string;
  isActive: boolean;
}

// -------------------- Scopes --------------------

export interface RoleSetScopesRequest {
  scopeIds: string[];
}
