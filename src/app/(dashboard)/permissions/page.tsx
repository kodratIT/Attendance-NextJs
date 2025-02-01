import { Suspense } from 'react'
import type { PermissionRowType } from '@/types/permissionTypes'
import Permissions from '@views/permissions'
import CircularProgress from '@mui/material/CircularProgress'
import axios from 'axios';

// Fungsi fetch data permission dari API menggunakan Axios
const getPermissionsData = async (): Promise<PermissionRowType[]> => {
  try {
    // const res = await axios.get(`${process.env.API_URL}/api/permissions`, {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions`, {
      headers: {
        'Cache-Control': 'no-store' // Hindari caching agar selalu mendapatkan data terbaru
      }
    });
    
    return res.data;
  } catch (error) {
    console.error('Server-side fetch error:', error);
    return []; // Fallback data kosong
  }
};

// Komponen Loading untuk Suspense
const Loading = () => {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <CircularProgress />
    </div>
  )
}

// Komponen utama untuk fetch dan menampilkan data
const PermissionsApp = async () => {
  const data = await getPermissionsData()

  return <Permissions permissionsData={data} />
}

// Bungkus dengan Suspense agar loading muncul di tengah content
const PermissionsPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <PermissionsApp />
    </Suspense>
  )
}

export default PermissionsPage
