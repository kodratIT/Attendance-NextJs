import { Timestamp } from 'firebase/firestore'
import type { CheckInOutModel } from './CheckInOut'

export interface AttendanceModel {
  attendanceId: string; // ID dokumen (YYYY-MM-DD)
  userId: string;
  shiftId: string;
  shiftName: string;
  areaId: string;
  date: string; // YYYY-MM-DD
  checkIn?: CheckInOutModel;
  checkOut?: CheckInOutModel;
  status?: string;
  arivalGap?: number;
  fine?: number;
  lateBy?: number;
  earlyLeaveBy?: number;
  daily_rate?: number;
  workingHours?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
