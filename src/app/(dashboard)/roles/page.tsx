import { Suspense } from 'react';
import Roles from '@views/roles';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

// Interface untuk role
interface RoleRowType {
  id: string;
  name: string;
  permissions: string[];
}

interface Role {
  success: boolean;
  data: RoleRowType[];
}

// Fungsi fetch data roles dari API menggunakan Axios
const getRolesData = async (): Promise<Role> => {
  try {
    const res = await axios.get<Role>(`${process.env.NEXT_PUBLIC_API_URL}/api/roles`, {
      headers: {
        'Cache-Control': 'no-store', // Hindari caching agar selalu mendapatkan data terbaru
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching roles data:', error);
    return { success: false, data: [] };
  }
};

// Komponen Loading untuk Suspense
const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
);

// Komponen utama untuk fetch dan menampilkan data roles
const RolesApp = async () => {
  const data = await getRolesData();
  return <Roles roleData={data} />;
};

// Bungkus dengan Suspense agar loading muncul di tengah content
const RolesPage = () => (
  <Suspense fallback={<Loading />}>
    <RolesApp />
  </Suspense>
);

export default RolesPage;
