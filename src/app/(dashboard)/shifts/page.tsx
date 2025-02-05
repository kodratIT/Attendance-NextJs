// app/shifts/page.tsx
import { Suspense } from 'react';
import Shifts from '@views/shifts';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { ShiftType } from '@/types/shiftTypes';

interface Shift {
  success: boolean;
  data: ShiftType[];
}

const getShiftsData = async (): Promise<Shift> => {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching shifts data:', error);
    return { success: false, data: [] };
  }
};

const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <CircularProgress />
  </div>
);

const ShiftsApp = async () => {
  const data = await getShiftsData();
  return <Shifts shiftData={data} />;
};

const ShiftsPage = () => (
  <Suspense fallback={<Loading />}>
    <ShiftsApp />
  </Suspense>
);

export default ShiftsPage;