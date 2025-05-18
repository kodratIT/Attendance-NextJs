import { Suspense } from 'react';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import Users from '@views/users';

import { getSession } from 'next-auth/react'

// Fungsi fetch data users dari API menggunakan Axios
const getUsersData = async () => {
  try {
  const session = await getSession()
      const sessionAreaIds: string[] = Array.isArray(session?.user?.areas) ? session.user.areas : []
  
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: {
          'Cache-Control': 'no-store',
        },
      })
  
      const allUsers = res.data || []
  
      const filteredUsers = allUsers.filter((user: any) => {
        const userAreas: string[] = Array.isArray(user.areas)
          ? user.areas.map((ref: any) => {
              if (ref?.id) return ref.id                // Firestore DocumentReference
              if (typeof ref === 'string') return ref.split('/').pop() // Fallback string path
              return ''
            })
          : []
  
        return userAreas.some(areaId => sessionAreaIds.includes(areaId))
      })

      console.log(filteredUsers)
  
    return allUsers;
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