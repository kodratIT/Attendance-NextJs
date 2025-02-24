// Importasi Komponen
import { Suspense } from 'react';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';
import AttendanceHistory from '@views/dashboard/RealtimeTable';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

import Grid from '@mui/material/Grid';
import CardStatVertical from '@/components/card-statistics/Vertical';

// Fungsi untuk mengambil data absensi
const getAttendanceData = async (): Promise<AttendanceRowType[]> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error("❌ URL API PUBLIK tidak ditemukan dalam variabel lingkungan!");
    }

    let fromDate = new Date();
    fromDate.setHours(fromDate.getHours() + 7); // Sesuaikan ke Waktu Indonesia Bagian Barat
    
    let formattedFromDate = fromDate.getUTCFullYear() + '-' + 
                            String(fromDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                            String(fromDate.getUTCDate()).padStart(2, '0');

    const res = await axios.get(`${apiUrl}/api/attendance?fromDate=${formattedFromDate}&toDate=${formattedFromDate}`, {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      timeout: 10000, // Batas waktu untuk kasus server lambat
    });

    console.log("✅ Data Respon API:", res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetch dari server:', error.message || error);
    return []; // Kembali ke data kosong sebagai fallback
  }
};

// Komponen untuk Menampilkan Loading
const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
);

// Komponen Utama Dashboard dengan Fetch Data Asinkron
const Dashboard = async () => {
  const data = await getAttendanceData();

  console.log("Data dari API:", data);

  return (
    <Grid container spacing={6}>
      {/* Kartu Summary untuk Detail Absensi */}
      <Grid item xs={12} sm={3} md={3} lg={3}>
        <CardStatVertical
          title='Jumlah Karyawan'
          subtitle='Total dalam database'
          stats={`${data.length}`}
          avatarColor='info'
          avatarIcon='tabler-users'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='Aktif'
          chipColor='success'
        />
      </Grid>
      <Grid item xs={12} sm={3} md={3} lg={3}>
        <CardStatVertical
          title='Telat'
          subtitle='Kedatangan tidak tepat waktu'
          stats={`${data.filter(emp => emp.status === 'late').length}`}
          avatarColor='warning'
          avatarIcon='tabler-clock'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='Hari Ini'
          chipColor='warning'
        />
      </Grid>
      <Grid item xs={12} sm={3} md={3} lg={3}>
        <CardStatVertical
          title='Tepat Waktu'
          subtitle='Kedatangan tepat waktu'
          stats={`${data.filter(emp => emp.status === 'on-time').length}`}
          avatarColor='success'
          avatarIcon='tabler-check'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='Hari Ini'
          chipColor='success'
        />
      </Grid>
      <Grid item xs={12} sm={3} md={3} lg={3}>
        <CardStatVertical
          title='Tidak Hadir'
          subtitle='Tidak melakukan cek-in'
          stats={`${data.filter(emp => emp.status === 'absent').length}`}
          avatarColor='error'
          avatarIcon='tabler-x'
          avatarSkin='light'
          avatarSize={44}
          avatarIconSize={28}
          chipText='Hari Ini'
          chipColor='error'
        />
      </Grid>

      {/* Tabel Absensi */}
      <Grid item xs={12} lg={12}>
        <AttendanceHistory tableData={data} />
      </Grid>
    </Grid>
  );
};

// Komponen Halaman dengan Suspense (Tanpa useEffect atau useState)
const AttendancePage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
};

export default AttendancePage;
