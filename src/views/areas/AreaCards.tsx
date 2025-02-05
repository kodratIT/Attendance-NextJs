'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import AvatarGroup from '@mui/material/AvatarGroup';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import type { TypographyProps } from '@mui/material/Typography';
import type { CardProps } from '@mui/material/Card';
import AreaDialog from '@components/dialogs/area-dialog'; // Ganti RoleDialog dengan AreaDialog
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick';
import Link from '@components/Link';
import DialogCloseButton from '@/components/dialogs/DialogCloseButton';

// Interface untuk Area
export type AreaRowType = {
  id:string;
  name: string; // Nama area
  locations: { id: number; name: string }[]; // Array of objects untuk lokasi
  createdAt: string; // Tanggal pembuatan (format ISO string)
  updatedAt: string; // Tanggal pembaruan terakhir (format ISO string)
};

interface Area {
  success: boolean;
  data: AreaRowType[];
}

interface AreaCardsProps {
  areaData?: Area; // Menggunakan data dari props terlebih dahulu
}

const AreaCards = ({ areaData: initialAreaData }: AreaCardsProps) => {
  const [areaData, setAreaData] = useState<Area | null>(initialAreaData || null);

  // Fungsi untuk mengambil data areas dari API
  const fetchAreas = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get<Area>(`${API_URL}/api/areas`);
      setAreaData(response.data);
    } catch (error) {
      console.error('Failed to fetch areas:', error);
    }
  };

  // Ambil data dari props terlebih dahulu, lalu ambil dari API jika perlu
  useEffect(() => {
    if (!initialAreaData?.data?.length) {
      fetchAreas();
    } else {
      setAreaData(initialAreaData); // Pastikan data awal di-set ke state
    }
  }, [initialAreaData]);

  // Typography Props for "Edit Area" Link
  const typographyProps: TypographyProps = {
    children: 'Edit Area',
    component: Link,
    color: 'primary',
    onClick: (e) => e.preventDefault(),
  };

  // Card Props for "Add Area" Button
  const addAreaCardProps: CardProps = {
    className: 'cursor-pointer bs-full',
    children: (
      <Grid container className="bs-full">
        <Grid item xs={5}>
          <div className="flex items-end justify-center bs-full">
            <img
              alt="add-area"
              src="/images/illustrations/characters/5.png"
              height={130}
              loading="lazy"
            />
          </div>
        </Grid>
        <Grid item xs={7}>
          <CardContent>
            <div className="flex flex-col items-end gap-4 text-right">
              <Button variant="contained" size="small">Add Area</Button>
              <Typography>
                Add a new area, <br />
                if it doesn&#39;t exist.
              </Typography>
            </div>
          </CardContent>
        </Grid>
      </Grid>
    ),
  };

  return (
    <Grid container spacing={6}>
      {/* Render daftar area */}
      {areaData?.data?.length ? (
        areaData.data.map((item) => (
          <Grid item xs={12} sm={6} lg={4} key={item.name}>
            <Card className="relative">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Typography className="flex-grow">Total Locations</Typography>
                  <AvatarGroup className="gap-2 left" total={item.locations.length} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-start gap-1">
                    <Typography variant="h5">{item.name}</Typography>
                    <OpenDialogOnElementClick
                      element={Typography}
                      elementProps={typographyProps}
                      dialog={AreaDialog}
                      dialogProps={{
                        state: 'edit',
                        title: item.name,
                        areaId: item.id,
                        data: item,
                        refreshData: fetchAreas,
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
                    dialog={AreaDialog}
                    dialogProps={{
                      state: 'delete',
                      title: item.name,
                      areaId: item.id,
                      refreshData: fetchAreas,
                    }}
                  />
                </div>
                <Typography>
                  Locations: {item.locations.map((loc) => loc.name).join(', ')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Typography variant="h6" className="text-center">No areas found.</Typography>
        </Grid>
      )}

      {/* Tombol untuk menambah area */}
      <Grid item xs={12} sm={6} lg={4}>
        <OpenDialogOnElementClick
          element={Card}
          elementProps={addAreaCardProps}
          dialog={AreaDialog}
          dialogProps={{ state: 'add', refreshData: fetchAreas }}
        />
      </Grid>
    </Grid>
  );
};

export default AreaCards;