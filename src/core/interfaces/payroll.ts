// -------------------------
// CREATE / UPDATE
// -------------------------
export interface PayrollCreateRequest {
  periodCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payrollType: string;
}

export interface PayrollCreateResponse {
  payrollId: string; // uuid
}

export interface PayrollUpdateRequest {
  periodCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payrollType: string;
  status: string;
}

// -------------------------
// CALCULATE
// -------------------------
export interface PayrollCalculateRequest {
  periodCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payrollType: string;
  attendanceConfirmed: boolean;
}

export interface PayrollCalculateResponse {
  payrollId: string; // uuid
}

// -------------------------
// OVERTIME
// -------------------------
export interface OvertimePayrollCreateRequest {
  employeeId: string; // uuid
  workDate: string; // YYYY-MM-DD
  hours: number;
  notes: string;
}

export interface OvertimePayrollCreateResponse {
  overtimeId: string; // uuid
}

// -------------------------
// COMMISSION
// -------------------------
export interface PayrollCommissionRequest {
  commissionAmount: number;
}

// -------------------------
// BROWSE / READ MODELS
// -------------------------
export interface PayrollsBrowseQuery {
  periodCode?: string;
  fromtUtc?: string; // datetime (sí, el spec dice fromtUtc)
  toUtc?: string; // datetime
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface PayrollDetail {
  payrollDetailId: string; // uuid
  employeeId: string; // uuid
  employeeName: string;
  grossSalary: number;
  overtimeHours: number;
  commissionAmount: number;
  deductions: number;
  employerContrib: number;
  netSalary: number;
}

export interface Payroll {
  id: string; // "payroll:<uuid>"
  payrollId: string; // uuid
  periodCode: string;

  startDate: string; // ISO datetime
  endDate: string; // ISO datetime

  payrollType: string;
  status: string;

  createdAtUtc: string; // ISO datetime
  updatedAtUtc: string; // ISO datetime

  details: PayrollDetail[];
}

// -------------------------
// EMPLOYEE HISTORY
// -------------------------
export interface PayrollEmployeeHistoryQuery {
  fromUtc?: string; // datetime
  toUtc?: string; // datetime
}

export interface PayrollEmployeeHistoryItem {
  payrollId: string; // uuid
  periodCode: string;
  startDateUtc: string; // ISO datetime
  endDateUtc: string; // ISO datetime
  status: string;

  grossSalary: number;
  overtimeHours: number;
  commissionAmount: number;
  deductions: number;
  employerContrib: number;
  netSalary: number;
}
