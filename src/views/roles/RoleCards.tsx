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
import RoleDialog from '@components/dialogs/role-dialog';
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick';
import Link from '@components/Link';
import DialogCloseButton from '@/components/dialogs/DialogCloseButton';

// Interface untuk Role
interface RoleRowType {
  id: string;
  name: string;
  permissions: string[];
}

interface Role {
  success: boolean;
  data: RoleRowType[];
}

interface RoleCardsProps {
  roleData?: Role; // Menggunakan data dari props terlebih dahulu
}

const RoleCards = ({ roleData: initialRoleData }: RoleCardsProps) => {
  const [roleData, setRoleData] = useState<Role | null>(initialRoleData || null);

  // Fungsi untuk mengambil data roles dari API
  const fetchRoles = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.get<Role>(`${API_URL}/api/roles`);
      setRoleData(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  // Fungsi untuk menghapus role
  const handleDeleteRole = async (roleId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      // await axios.delete(`${API_URL}/api/roles`, { data: { id: roleId } });
      fetchRoles(); // Refresh data setelah delete
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  // Ambil data dari props terlebih dahulu, lalu ambil dari API jika perlu
  useEffect(() => {
    if (!initialRoleData || !initialRoleData.data.length) {
      fetchRoles();
    }
  }, [initialRoleData]);

  // Typography Props for "Edit Role" Link
  const typographyProps: TypographyProps = {
    children: 'Edit Role',
    component: Link,
    color: 'primary',
    onClick: (e) => e.preventDefault(),
  };

  // Card Props for "Add Role" Button
  const addRoleCardProps: CardProps = {
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
    <Grid container spacing={6}>
      {roleData?.data?.length ? (
        roleData.data.map((item) => (
          <Grid item xs={12} sm={6} lg={4} key={item.id}>
            <Card className="relative">
              {/* Close button (delete role) di kanan atas */}
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Typography className="flex-grow">Total users</Typography>
                  <AvatarGroup className="gap-2 left " total={5} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-start gap-1">
                    <Typography variant="h5">{item.name}</Typography>
                    <OpenDialogOnElementClick
                      element={Typography}
                      elementProps={typographyProps}
                      dialog={RoleDialog}
                      dialogProps={{ title: item.name, roleId: item.id, refreshData: fetchRoles }}
                    />
                  </div>
                  {/* <div className="absolute bottom-2 right-2 flex gap-2"> */}
                <IconButton onClick={() => handleDeleteRole(item.id)} color="error">
                  <i className="tabler-trash" />
                </IconButton>
              {/* </div> */}
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Typography variant="h6" className="text-center">No roles found.</Typography>
        </Grid>
      )}
      <Grid item xs={12} sm={6} lg={4}>
        <OpenDialogOnElementClick 
          element={Card} 
          elementProps={addRoleCardProps} 
          dialog={RoleDialog} 
          dialogProps={{ refreshData: fetchRoles }}
        />
      </Grid>
    </Grid>
  );
};

export default RoleCards;
