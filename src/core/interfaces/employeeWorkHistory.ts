export interface EmployeeWorkHistoryEntry {
  serviceOrderId: string;
  serviceOrderCode: string;
  scheduledDate: string;
  closedDate: string | null;
  status: string;
  clientName: string;
  serviceAddress: string;
  notes: string | null;
  services: string[];
}

export interface EmployeeWorkHistory {
  employeeId: string;
  employeeName: string;
  entries: EmployeeWorkHistoryEntry[];
}
