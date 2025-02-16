export type AttendanceRowType = {
    attendanceId: string;
    date: string;
    name: string;
    shifts: string;
    avatar: string;
    checkIn: {
      time: string;
      faceVerified: boolean;
      location: {
        latitude: number;
        longitude: number;
        name: string;
      };
    };
    checkOut: {
      time: string;
      faceVerified: boolean;
      location: {
        latitude: number;
        longitude: number;
        name: string;
      };
    };
    createdAt: string;
    earlyLeaveBy: number;
    lateBy: number;
    status: string;
    updatedAt: string;
    userId: string;
    workingHours: number;
    action: string[];
  };