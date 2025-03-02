import { Suspense } from 'react';
import Locations from '@views/locations';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { LocationRowType } from '@/types/locationTypes';

// Fungsi fetch data location dari API menggunakan Axios
const getLocationsData = async (): Promise<LocationRowType[]> => {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/locations`, {
      headers: {
        'Cache-Control': 'no-store', // 🚀 Hindari caching agar selalu mendapatkan data terbaru
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return res.data;
  } catch (error) {
    console.error('Server-side fetch error:', error);
    return []; // Fallback data kosong jika terjadi error
  }
};

// Komponen Loading untuk Suspense
const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
);

// Komponen utama untuk fetch dan menampilkan data
const LocationsApp = async () => {
  // Ambil data dari API
  const data = await getLocationsData();
  console.log(data); // Debugging: Cek data yang diterima

  return <Locations locationsData={data} />;
};

// Bungkus dengan Suspense agar loading muncul di tengah content
const LocationsPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <LocationsApp />
    </Suspense>
  );
};

export default LocationsPage;