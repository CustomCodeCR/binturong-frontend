// src/core/interfaces/scopes.ts

export interface Scope {
  id: string;
  scopeId: string;
  code: string;
  description: string | null;
}

export interface ScopesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}