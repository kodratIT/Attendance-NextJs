import { Suspense } from 'react';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import Users from '@views/users';

// Fungsi fetch data users dari API menggunakan Axios
const getUsersData = async () => {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
      headers: {
        'Cache-Control': 'no-store', // Hindari caching agar selalu mendapatkan data terbaru
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return res.data;
  } catch (error) {
    console.error('Server-side fetch error:', error);
    return []; // Fallback data kosong
  }
};

// Komponen Loading untuk Suspense
const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <CircularProgress />
  </div>
);

// Komponen utama untuk fetch dan menampilkan data
const UsersApp = async () => {
  const data = await getUsersData();
  return <Users usersData={data} />;
};

// Bungkus dengan Suspense agar loading muncul di tengah content
const UsersPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <UsersApp />
    </Suspense>
  );
};

export default UsersPage;