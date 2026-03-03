export type EmployeeHistoryEventType = "CHECK_IN" | "CHECK_OUT" | string;

export interface EmployeeHistoryItem {
  historyId: string;
  eventType: EmployeeHistoryEventType;
  description: string;
  eventDate: string;
}

export interface Employee {
  id: string;
  employeeId: string;

  userId: string | null;
  branchId: string;
  branchName: string | null;

  fullName: string;
  nationalId: string;
  email: string;

  jobTitle: string;
  baseSalary: number;

  hireDate: string;
  terminationDate: string | null;

  isActive: boolean;

  history: EmployeeHistoryItem[];
}

/** POST /api/employees */
export interface EmployeeCreateRequest {
  userId: string;
  branchId: string;
  fullName: string;
  nationalId: string;
  jobTitle: string;
  baseSalary: number;
  hireDate: string; // "YYYY-MM-DD"
  terminationDate: string; // "YYYY-MM-DD" (según tu request ejemplo)
  isActive: boolean;
}

export interface EmployeeCreateResponse {
  employeeId: string;
}

/** GET /api/employees query params */
export interface EmployeesBrowseQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** PUT /api/employees/{{id}} */
export interface EmployeeUpdateRequest {
  userId: string;
  branchId: string;
  fullName: string;
  jobTitle: string;
  baseSalary: number;
  terminationDate: string; // "YYYY-MM-DD"
  isActive: boolean;
}
