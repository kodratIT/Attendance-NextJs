'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { AttendanceRowType } from '@/types/attendanceRowTypes';
import { getSession } from 'next-auth/react'


interface UserType {
  id: number;
  name: string;
  area: string;
}

interface RequestDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  state?: 'Add' | 'Edit';
  data?: AttendanceRowType;
  currentUser: UserType;
  refreshData?: () => void;
}

const RequestDialog = ({ open, setOpen, currentUser, state, data, refreshData = () => {} }: RequestDialogProps) => {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [AttendanceData, setData] = useState(data || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [keterangan, setKeterangan] = useState('');

  // Error states
  const [errors, setErrors] = useState({
    keterangan: '',
  });

  // // Fetch all users on open
  // useEffect(() => {
  //   if (!open) return;

  //   const fetchUsers = async () => {
  //     setLoading(true);
  //     try {
  //       const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  //       const response = await axios.get<UserType[]>(`${API_URL}/api/users`);
  //       setUsers(response.data);
  //     } catch (error) {
  //       console.error('Failed to fetch users:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUsers();

  // }, [open]);



useEffect(() => {
  if (!open) return;

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const session = await getSession()
      const response = await axios.get<UserType[]>(`${API_URL}/api/users`)
      const allUsers = response.data || []

      // console.log("ndksnfkjdbkjfdbkjdf kjfdfd ")
      
      const sessionAreaIds: string[] = Array.isArray(session?.user?.areas) ? session.user.areas : []

      const filteredUsers = allUsers.filter((user: any) => {
        const userAreas: string[] = Array.isArray(user.areas)
          ? user.areas.map((ref: any) => {
              if (ref?.id) return ref.id     // Ambil ID dari Firestore DocumentReference
              if (typeof ref === 'string') return ref.split('/').pop() // fallback jika string path
              return ''
            })
          : []

        return userAreas.some(areaId => sessionAreaIds.includes(areaId))
      })

      setUsers(filteredUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchUsers()


  console.log(users);

  
}, [open])


  const handleUserChange = (event: any) => {
    const userId = event.target.value;
    const selected = users.find((user) => user.id === userId) || null;
    setSelectedUser(selected);
  };

  const handleSubmit = async () => {
    // Reset errors
    setErrors({ keterangan: '' });

    // Validate input
    if (!selectedUser) {
      alert('Silakan pilih nama karyawan.');
      return;
    }
    if (!keterangan.trim()) {
      setErrors((prev) => ({ ...prev, keterangan: 'Keterangan tidak boleh kosong.' }));
      return;
    }

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Create new attendance request
      await axios.post(`${API_URL}/api/attendance`, {
        userId: selectedUser.id,
        keterangan,
      });

      setSelectedUser(null);
      setKeterangan('');

      refreshData();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setSaving(false);
    }
  };
  const handleSend = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Create new attendance request
      await axios.put(`${API_URL}/api/attendance`, {
        data: AttendanceData,
      });

      refreshData();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog fullWidth open={open} onClose={() => setOpen(false)}>
      {state === 'Edit' ? (
        <>
          <DialogTitle>{state === 'Edit' ? 'Permintaan Checkout Kehadiran' : 'Permintaan Checkout Kehadiran'}</DialogTitle>
          <DialogContent className="text-center">
          <Typography variant="body1" color="error">
            Apakah Anda yakin ingin melakukan checkout kehadiran?
          </Typography>
          </DialogContent>
          <DialogActions className="flex justify-center pbs-4 sm:pli-16">
          <Button variant="contained" color="primary" onClick={handleSend} disabled={saving}>
            {saving ? <CircularProgress color="inherit" size={20} /> : 'Konfirmasi Checkout'}
          </Button>
          <Button onClick={() => setOpen(false)} variant="outlined" color="secondary" disabled={saving}>
            Batal
          </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle>{state === 'Add' ? 'Permintaan CheckIn Kehadiran' : 'Permintaan CheckIn Kehadiran'}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Nama Karyawan</InputLabel>
              <Select value={selectedUser?.id || ''} onChange={handleUserChange} displayEmpty>
                {loading ? (
                  <MenuItem disabled>
                    <CircularProgress size={24} />
                  </MenuItem>
                ) : (
                  users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              <TextField
                label="Keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                fullWidth
                margin="normal"
                required
                error={!!errors.keterangan}
                helperText={errors.keterangan}
              />
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSubmit} variant="contained" disabled={saving || !selectedUser}>
              {saving ? <CircularProgress color="inherit" size={24} /> : state === 'Add' ? 'Kirim' : 'Update'}
            </Button>
            <Button onClick={() => setOpen(false)} variant="outlined" disabled={saving}>
              Batal
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default RequestDialog;
