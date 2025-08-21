export type RequestType = "LUPA_ABSEN" | "KOREKSI_JAM";
export type RequestSubtype = "CHECKIN" | "CHECKOUT" | "BOTH" | null;
export type RequestStatus = "SUBMITTED" | "NEEDS_REVISION" | "APPROVED" | "REJECTED" | "CANCELED";
export type RequestSource = "app" | "web";

export interface LocationSnapshot {
  name: string;
  geo: { lat: number; lng: number };
  radius?: number;
  code?: string;
  address?: string;
}

export interface AttendancePatch {
  userId: string;
  date: string; // YYYY-MM-DD
  setCheckIn?: string | null; // HH:mm
  setCheckOut?: string | null; // HH:mm
}

export interface RequestDoc {
  id?: string;
  employeeId: string;
  employeeName?: string; // Populated from user data
  employeeAvatar?: string | null; // Populated from user data
  employeeDepartment?: string | null; // Populated from user data
  employeeEmail?: string; // Populated from user data
  type: RequestType;
  subtype: RequestSubtype;
  date: string; // YYYY-MM-DD
  requested_time_in: string | null; // HH:mm
  requested_time_out: string | null; // HH:mm
  reason: string;
  attachments?: string[];
  status: RequestStatus;
  reviewerId?: string | null;
  reviewedAt?: any | null; // Firestore Timestamp
  reviewerNote?: string | null;
  locationId: string;
  locationSnapshot?: LocationSnapshot;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  source: RequestSource;
}

export interface AuditLogDoc {
  id?: string;
  requestId: string;
  actorId: string;
  action: "SUBMIT" | "APPROVE" | "REJECT" | "REVISION" | "CANCEL" | "APPLY_ATTENDANCE_PATCH";
  before_json?: any;
  after_json?: any;
  createdAt: any; // Firestore Timestamp
}
