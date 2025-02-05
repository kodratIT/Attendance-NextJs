import { Suspense } from 'react';
import Areas from '@views/areas'; // Ganti Roles dengan Areas
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { AreaType } from '@/types/areaTypes';

interface Area {
  success: boolean;
  data: AreaType[];
}

// Fungsi fetch data areas dari API menggunakan Axios
const getAreasData = async (): Promise<Area> => {
  try {
    const res = await axios.get<Area>(`${process.env.NEXT_PUBLIC_API_URL}/api/areas`, {
      headers: {
        'Cache-Control': 'no-store', // Hindari caching agar selalu mendapatkan data terbaru
      },
    });

    return res.data;

  } catch (error) {
    console.error('Error fetching areas data:', error);
    return { success: false, data: [] };
  }
};

// Komponen Loading untuk Suspense
const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
);

// Komponen utama untuk fetch dan menampilkan data areas
const AreasApp = async () => {
  const data = await getAreasData();
  return <Areas areaData={data} />;
};

// Bungkus dengan Suspense agar loading muncul di tengah content
const AreasPage = () => (
  <Suspense fallback={<Loading />}>
    <AreasApp />
  </Suspense>
);

export default AreasPage;