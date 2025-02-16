import { Suspense } from 'react';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';
import AttendanceHistory from '@views/attendance';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

// Fungsi fetch data attendance dari API menggunakan Axios
const getAttendanceData = async (): Promise<AttendanceRowType[]> => {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance`, {
      headers: {
        'Cache-Control': 'no-store', // 🚀 Hindari caching agar selalu mendapatkan data terbaru
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    console.log(res.data)
    return res.data;
  } catch (error) {
    console.error('Server-side fetch error:', error);
    return []; // Fallback data kosong
  }
};


const dummyAttendanceData: AttendanceRowType[] = [
  {
    attendanceId: "1",
    date: "2025-02-16",
    name: "John Doe",
    shifts: "Morning",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    checkIn: {
      time: "08:00 AM",
      faceVerified: true,
      location: {
        latitude: -6.2088,
        longitude: 106.8456,
        name: "Office HQ",
      },
    },
    checkOut: {
      time: "05:00 PM",
      faceVerified: true,
      location: {
        latitude: -6.2088,
        longitude: 106.8456,
        name: "Office HQ",
      },
    },
    createdAt: "2025-02-16T08:00:00Z",
    earlyLeaveBy: 0,
    lateBy: 0,
    status: "Present",
    updatedAt: "2025-02-16T17:00:00Z",
    userId: "user_123",
    workingHours: 9,
    action:[],
  },
  {
    attendanceId: "2",
    date: "2025-02-16",
    name: "Jane Smith",
    shifts: "Afternoon",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    checkIn: {
      time: "12:00 PM",
      faceVerified: true,
      location: {
        latitude: -6.1751,
        longitude: 106.8650,
        name: "Branch Office",
      },
    },
    checkOut: {
      time: "09:00 PM",
      faceVerified: true,
      location: {
        latitude: -6.1751,
        longitude: 106.8650,
        name: "Branch Office",
      },
    },
    createdAt: "2025-02-16T12:00:00Z",
    earlyLeaveBy: 0,
    lateBy: 10,
    status: "Late",
    updatedAt: "2025-02-16T21:00:00Z",
    userId: "user_456",
    workingHours: 9,
    action: [],
  },
];
// Komponen Loading untuk Suspense
const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <CircularProgress />
  </div>
);

// Komponen utama untuk fetch dan menampilkan data
const AttendanceApp = async () => {
  // const data = await getAttendanceData();
  const data = dummyAttendanceData
  console.log("datacuy;",data)
  return <AttendanceHistory tableData={data} />;
};

// Bungkus dengan Suspense agar loading muncul di tengah content
const AttendancePage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <AttendanceApp />
    </Suspense>
  );
};

export default AttendancePage;