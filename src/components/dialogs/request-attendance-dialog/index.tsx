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
  currentUser?: UserType;
  refreshData?: () => void;
}

const RequestDialog = ({ open, setOpen, currentUser, state, data, refreshData = () => {} }: RequestDialogProps) => {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [AttendanceData, setData] = useState(data || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Checkout-only states
  const [areas, setAreas] = useState<any[]>([]);
  const [areaId, setAreaId] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');
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

  // Fetch areas for checkout selection
  const fetchAreas = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const res = await axios.get(`${API_URL}/api/areas`)
      const list = Array.isArray(res.data?.data) ? res.data.data : []
      setAreas(list)
      // default area from row data if available
      if (!areaId && (data as any)?.areaId) setAreaId((data as any).areaId)
    } catch (e) {
      console.error('Failed to fetch areas:', e)
    }
  }
  fetchAreas()

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
      alert('Eh, pilih nama karyawan dulu dong! 😅');
      return;
    }
    if (!keterangan.trim()) {
      setErrors((prev) => ({ ...prev, keterangan: 'Wajib isi keterangan ya! Jangan dikosongin 🙏' }));
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

      await axios.put(`${API_URL}/api/attendance`, {
        data: AttendanceData,
        checkOutTime,
        areaId
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
    <Dialog 
      fullWidth 
      open={open} 
      onClose={() => setOpen(false)}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0,0,0,0.4)' 
            : '0 8px 32px rgba(0,0,0,0.12)',
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
        }
      }}
    >
      {state === 'Edit' ? (
        <>
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            📄 Checkout Kehadiran
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
              Isi jam checkout dan pilih area ya! 😊
            </Typography>
            <TextField
              fullWidth
              label="⏰ Jam Checkout"
              type="time"
              value={checkOutTime}
              onChange={e => setCheckOutTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              margin="normal"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="checkout-area-label">📍 Pilih Area</InputLabel>
              <Select
                labelId="checkout-area-label"
                label="📍 Pilih Area"
                value={areaId}
                onChange={e => setAreaId(String(e.target.value))}
                sx={{ borderRadius: 2 }}
              >
                {areas.map(a => (
                  <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center' }}>
            <Button 
              onClick={() => setOpen(false)} 
              variant="outlined" 
              disabled={saving}
              sx={{ borderRadius: 2, minWidth: 100 }}
            >
              ❌ Batal
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSend} 
              disabled={saving || !areaId || !checkOutTime}
              sx={{ 
                borderRadius: 2, 
                minWidth: 140,
                background: 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)',
                fontWeight: 'bold'
              }}
            >
              {saving ? <CircularProgress color="inherit" size={20} /> : '🚀 Simpan Checkout'}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            {state === 'Add' ? '🔥 Request CheckIn Absen' : '🔥 Request CheckIn Absen'}
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
              Pilih karyawan yang mau dibuatin absen ya! 📝
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>👤 Pilih Karyawan</InputLabel>
              <Select 
                value={selectedUser?.id || ''} 
                onChange={handleUserChange} 
                displayEmpty
                label="👤 Pilih Karyawan"
                sx={{ borderRadius: 2 }}
              >
                {loading ? (
                  <MenuItem disabled>
                    <CircularProgress size={24} sx={{ mr: 2 }} />
                    Loading karyawan...
                  </MenuItem>
                ) : (
                  users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      👤 {user.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <TextField
              label="💬 Kasih Keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              fullWidth
              margin="normal"
              required
              multiline
              rows={3}
              error={!!errors.keterangan}
              helperText={errors.keterangan}
              placeholder="Ceritain kenapa perlu request absen..."
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center' }}>
            <Button 
              onClick={() => setOpen(false)} 
              variant="outlined" 
              disabled={saving}
              sx={{ borderRadius: 2, minWidth: 100 }}
            >
              ❌ Batal
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={saving || !selectedUser}
              sx={{ 
                borderRadius: 2, 
                minWidth: 120,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                fontWeight: 'bold'
              }}
            >
              {saving ? (
                <>
                  <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} /> 
                  Loading...
                </>
              ) : (
                <>
                  🚀 {state === 'Add' ? 'Kirim Request!' : 'Update!'}
                </>
              )}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default RequestDialog;
