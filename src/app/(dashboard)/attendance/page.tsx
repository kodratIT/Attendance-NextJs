import { Suspense } from 'react';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';
import AttendanceHistory from '@views/attendance';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

const getAttendanceData = async (): Promise<AttendanceRowType[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Pastikan ini terdefinisi

    if (!apiUrl) {
      throw new Error("❌ NEXT_PUBLIC_API_URL tidak ditemukan dalam environment variables!");
    }

    console.log(`🔍 Fetching data from: ${apiUrl}/api/attendance?fromDate=2025-01-22&toDate=2025-01-22`);

    const res = await axios.get(`${apiUrl}/api/attendance?fromDate=2025-01-22&toDate=2025-01-22`, {
      headers: {
        'Cache-Control': 'no-store', // 🚀 Hindari caching agar selalu mendapatkan data terbaru
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      timeout: 10000, // ⏳ Tambahkan timeout untuk debugging jika server lambat
    });

    console.log("✅ API Response Data:", res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Server-side fetch error:', error.message || error);

    if (error.response) {
      console.error('⚠️ Response Data:', error.response.data);
      console.error('⚠️ Status Code:', error.response.status);
    } else if (error.request) {
      console.error('⚠️ No response received:', error.request);
    }

    return []; // Fallback ke data kosong
  }
};

const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <CircularProgress />
  </div>
);

// Komponen utama untuk fetch dan menampilkan data
const AttendanceApp = async () => {
  const data2 = await getAttendanceData();

  console.log("data dari api", data2)
  return <AttendanceHistory tableData={data2} />;
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