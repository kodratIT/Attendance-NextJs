'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface UserType {
  id: number;
  name: string;
  area: string;
}

interface RequestDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentUser: UserType;
  refreshData?: () => void;
}

const RequestDialog = ({ open, setOpen, currentUser, refreshData = () => {} }: RequestDialogProps) => {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keterangan, setKeterangan] = useState('');

  // Error states
  const [errors, setErrors] = useState({
    keterangan: '',
  });

  // Fetch all users on open
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await axios.get<UserType[]>(`${API_URL}/api/users`);
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open]);

  const handleUserChange = (event: any) => {
    const userId = event.target.value;
    const selected = users.find((user) => user.id === userId) || null;
    console.log(selected);
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

    console.log(selectedUser);
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/attendance`, {
        userId: selectedUser.id,
        // requestedBy: currentUser.id,
        keterangan,
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
      <DialogTitle>Request Attendance</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Nama Karyawan</InputLabel>
          <Select
            value={selectedUser?.id || ''}
            onChange={handleUserChange}
            displayEmpty
          >
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
          {saving ? <CircularProgress color="inherit" size={24} /> : 'Submit'}
        </Button>
        <Button onClick={() => setOpen(false)} variant="outlined" disabled={saving}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestDialog;
