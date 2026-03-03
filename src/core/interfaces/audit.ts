export interface AuditLog {
  id: string; // e.g. "audit:<uuid>"
  auditId: number;
  eventDate: string; // ISO datetime
  userId: number;
  module: string;
  entity: string;
  entityId: number;
  action: string;
  dataBefore: string | null;
  dataAfter: string | null;
  ip: string | null;
  userAgent: string | null;
}

export interface AuditBrowseQuery {
  from?: string; // ISO datetime
  to?: string; // ISO datetime
  module?: string;
  action?: string;
}
