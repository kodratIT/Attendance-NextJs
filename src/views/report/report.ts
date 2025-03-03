interface CheckDetails {
    // Asumsi untuk properti dalam objek checkIn dan checkOut
    time: string;
    verified: boolean;
    location: {
      latitude: number;
      longitude: number;
    };
  }
  
  interface AttendanceRecord {
    attendanceId: string;
    userId: string;
    name: string;
    date: string;
    areas: string;
    shifts?: string; // Optional karena terdapat 'undefined'
    avatar: string;
    checkIn: CheckDetails;
    checkOut: CheckDetails;
    createdAt: string;
    updatedAt: string;
    earlyLeaveBy: number;
    lateBy: number;
    status: string;
    workingHours: number;
  }
  
  // Struktur untuk menampung rekaman berdasarkan userId
  interface AttendanceData {
    [userId: string]: AttendanceRecord[];
  }