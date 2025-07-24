export type AttendanceRowType = {
    attendanceId: string;
    date: string;
    name: string;
    shifts: string;
    areas: string;
    areaId: string;
    avatar: string;
    role:string;
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
    score: number;
    totalScore: number;
    totalHari: number;
    averageScore:number;
  };