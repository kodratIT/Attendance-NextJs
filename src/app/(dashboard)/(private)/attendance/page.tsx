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

    let fromDate = new Date();
    fromDate.setHours(fromDate.getHours() + 7); // Menyesuaikan ke UTC+7
    
    let formattedFromDate = fromDate.getUTCFullYear() + '-' + 
                            String(fromDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                            String(fromDate.getUTCDate()).padStart(2, '0');
    
    const res = await axios.get(`${apiUrl}/api/attendance?fromDate=${formattedFromDate}&toDate=${formattedFromDate}`, {
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
  <div className="flex justify-center items-center min-h-[200px]">
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