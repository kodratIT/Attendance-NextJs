export type OvertimeStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested' | 'cancelled';
export type OvertimeType = 'weekday' | 'weekend' | 'holiday';
export type CompensationType = 'cash' | 'toil';

export interface OvertimeRequest {
  id: string;
  uid: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userDepartment?: string;
  date: string;
  startAt: number;
  endAt?: number;
  breakMinutes?: number;
  durationMinutes?: number;
  type?: OvertimeType;
  compensationType?: CompensationType;
  reason?: string;
  attachments?: string[];
  crossMidnight?: boolean;
  status: OvertimeStatus;
  approverId?: string | null;
  approverName?: string | null;
  approvedAt?: number | null;
  approverNote?: string | null;
  policyApplied?: Record<string, any> | null;
  payrollPosted?: boolean;
  createdAt?: any;
  updatedAt?: any;
  areas?: string;
  shifts?: string;
}

export interface OvertimeFilters {
  status?: OvertimeStatus | 'all';
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  userId?: string;
  area?: string;
  search?: string;
}

export interface OvertimeStats {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
  totalHours: number;
  averageHours: number;
}

// Additional interfaces for dashboard functionality
export interface OvertimeTableRow {
  id: string;
  date: string;
  employee: {
    id: string;
    name: string;
    avatar?: string;
    department?: string;
  };
  timeRange: string;
  duration: string;
  durationHours: number;
  reason: string;
  status: OvertimeStatus;
  crossMidnight: boolean;
  approver?: {
    id: string;
    name: string;
    approvedAt?: number;
    note?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}

// API Response interfaces
export interface OvertimeListResponse {
  data: OvertimeRequest[];
  stats: OvertimeStats;
  total: number;
}

export interface OvertimeDetailResponse {
  data: OvertimeRequest;
}

export interface OvertimeActionResponse {
  data: OvertimeRequest;
  message: string;
}

// Action types for approval workflow
export type OvertimeAction = 'approve' | 'reject' | 'revision_requested' | 'cancel'

export interface OvertimeActionPayload {
  action: OvertimeAction;
  approverId?: string;
  approverName?: string;
  approverNote?: string;
}
