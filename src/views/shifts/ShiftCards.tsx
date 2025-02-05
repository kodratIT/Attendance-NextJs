// app/shifts/ShiftCards.tsx
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import type { TypographyProps } from '@mui/material/Typography';
import type { CardProps } from '@mui/material/Card';
import ShiftDialog from '@components/dialogs/shift-dialog'; // Dialog untuk Shift
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick';
import Link from '@components/Link';
import DialogCloseButton from '@/components/dialogs/DialogCloseButton';
import AvatarGroup from '@mui/material/AvatarGroup';


// Interface untuk Shift
export type ShiftRowType = {
  id: string;
  name: string; // Nama shift
  start_time: string; // Waktu mulai (format HH:mm)
  end_time: string; // Waktu selesai (format HH:mm)
  createdAt: string; // Tanggal pembuatan (format ISO string)
  updatedAt: string; // Tanggal pembaruan terakhir (format ISO string)
};

interface Shift {
  success: boolean;
  data: ShiftRowType[];
}

interface ShiftCardsProps {
  shiftData?: Shift; // Menggunakan data dari props terlebih dahulu
}

const ShiftCards = ({ shiftData: initialShiftData }: ShiftCardsProps) => {
  const [shiftData, setShiftData] = useState(initialShiftData || null);

  // Fungsi untuk mengambil data shifts dari API
  const fetchShifts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${API_URL}/api/shifts`);
      setShiftData(response.data);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    }
  };

  // Ambil data dari props terlebih dahulu, lalu ambil dari API jika perlu
  useEffect(() => {
    if (!initialShiftData?.data?.length) {
      fetchShifts();
    } else {
      console.log(initialShiftData);

      setShiftData(initialShiftData); // Pastikan data awal di-set ke state
    }
  }, [initialShiftData]);

  // Typography Props for "Edit Shift" Link
  const typographyProps: TypographyProps = {
    children: 'Edit Shift',
    component: Link,
    color: 'primary',
    onClick: (e) => e.preventDefault(),
  };

  // Card Props for "Add Shift" Button
  const addShiftCardProps: CardProps = {
    className: 'cursor-pointer bs-full',
    children: (
      <Grid container className="bs-full">
        <Grid item xs={5}>
          <div className="flex items-end justify-center bs-full">
            <img
              alt="add-role"
              src="/images/illustrations/characters/5.png"
              height={130}
              loading="lazy"
            />
          </div>
        </Grid>
        <Grid item xs={7}>
          <CardContent>
            <div className="flex flex-col items-end gap-4 text-right">
              <Button variant="contained" size="small">Add Role</Button>
              <Typography>
                Add a new role, <br />
                if it doesn&#39;t exist.
              </Typography>
            </div>
          </CardContent>
        </Grid>
      </Grid>
    ),
  };

  return (
    <Grid container spacing={2}>
      {/* Render daftar shift */}
      {shiftData?.data?.length ? (
        shiftData.data.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardContent>
              <div className="flex items-center justify-between mb-5">
                  <Typography className="flex-grow">Total Users</Typography>
                  <AvatarGroup className="gap-2 left" total={2} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-start gap-1">
                    <Typography variant="h5">{item.name} ({item.start_time} - {item.end_time})</Typography>
                    <OpenDialogOnElementClick
                      element={Typography}
                      elementProps={typographyProps}
                      dialog={ShiftDialog}
                      dialogProps={{
                        state: 'edit',
                        title: item.name,
                        areaId: item.id,
                        data: item,
                        refreshData: fetchShifts,
                      }}
                    />
                  </div>
                  {/* Hapus tombol delete jika tidak diperlukan */}
                  <OpenDialogOnElementClick
                    element={IconButton}
                    elementProps={{
                      color: 'error',
                      children: <i className="tabler-trash" />,
                    }}
                    dialog={ShiftDialog}
                    dialogProps={{
                      state: 'delete',
                      title: item.name,
                      areaId: item.id,
                      data: item,
                      refreshData: fetchShifts,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Typography>No shifts found.</Typography>
      )}
      <Grid item xs={12} sm={6} lg={4}>
        <OpenDialogOnElementClick 
          element={Card} 
          elementProps={addShiftCardProps} 
          dialog={ShiftDialog} 
          dialogProps={{state: 'add', refreshData: fetchShifts }}
        />
      </Grid>
    </Grid>
  );
};

export default ShiftCards;