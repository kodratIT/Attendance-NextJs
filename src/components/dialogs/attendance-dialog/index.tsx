'use client';

// React Imports
import { useState, useEffect } from 'react';
// MUI Imports
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
// Component Imports
import CustomTextField from '@core/components/mui/TextField';
import DialogCloseButton from '../DialogCloseButton';
import type { AttendanceRowType } from '@/types/attendanceTypes';
import MenuItem from '@mui/material/MenuItem';
import axios from 'axios';

type AttendanceDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: AttendanceRowType;
  state?: string;
  refreshData: () => void;
};

// const [message, setMessage] = useState('');
// const [isError, setIsError] = useState(false);


const AddContent = ({ handleClose, refreshData }: { handleClose: () => void; refreshData: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])
  const [shifts, setShifts] = useState<{ id: string; name: string }[]>([])
  const [userId, setUserId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [shiftId, setShiftId] = useState('')
  const [date, setDate] = useState('')
  const [checkInTime, setCheckInTime] = useState('')

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [uRes, aRes, sRes] = await Promise.all([
          axios.get(`${API_URL}/api/users`, { timeout: 10000 }),
          axios.get(`${API_URL}/api/areas`, { timeout: 10000 }),
          axios.get(`${API_URL}/api/shifts`, { timeout: 10000 })
        ])
        const userOpts = Array.isArray(uRes.data)
          ? uRes.data.map((x: any) => ({ id: x.id, name: x.name }))
          : []
        const areaOpts = Array.isArray(aRes.data?.data)
          ? aRes.data.data.map((x: any) => ({ id: x.id, name: x.name }))
          : []
        const shiftOpts = Array.isArray(sRes.data?.data)
          ? sRes.data.data.map((x: any) => ({ id: x.id, name: x.name }))
          : []
        setUsers(userOpts)
        setAreas(areaOpts)
        setShifts(shiftOpts)
      } catch (e) {
        console.error('Failed to load users/areas', e)
      }
    }
    fetchLists()
  }, [])

const handleCreate = async () => {
setLoading(true);

    try {
      if (!userId || !areaId || !shiftId || !date || !checkInTime) {
        throw new Error('Mohon lengkapi pegawai, area, shift, tanggal, dan jam masuk')
      }

      await axios.post(`${API_URL}/api/attendance`, {
        userId,
        areaId,
        shiftId,
        date,
        checkInTime
      });

      setTimeout(() => {
        refreshData();
        handleClose();
      }, 800);

    } catch (error: any) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

return (
  <>
    {/* Alert error/success hanya muncul jika ada message */}

{/* Select Pegawai */}
    <CustomTextField
      select
      label="Pegawai"
      fullWidth
      margin="normal"
      value={userId}
      onChange={(e: any) => setUserId(e.target.value)}
    >
      {users.map(u => (
        <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
      ))}
    </CustomTextField>

    {/* Select Area */}
    <CustomTextField
      select
      label="Area"
      fullWidth
      margin="normal"
      value={areaId}
      onChange={(e: any) => setAreaId(e.target.value)}
    >
      {areas.map(a => (
        <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
      ))}
    </CustomTextField>

    {/* Select Shift */}
    <CustomTextField
      select
      label="Shift"
      fullWidth
      margin="normal"
      value={shiftId}
      onChange={(e: any) => setShiftId(e.target.value)}
    >
      {shifts.map(s => (
        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
      ))}
    </CustomTextField>

    {/* Tanggal */}
    <CustomTextField
      label="Tanggal"
      type="date"
      fullWidth
      margin="normal"
      value={date}
      onChange={(e: any) => setDate(e.target.value)}
      InputLabelProps={{ shrink: true }}
    />

    {/* Jam Masuk */}
    <CustomTextField
      label="Jam Masuk"
      type="time"
      fullWidth
      margin="normal"
      value={checkInTime}
      onChange={(e: any) => setCheckInTime(e.target.value)}
    />

    <DialogActions>
      <Button onClick={handleClose}>Cancel</Button>
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Create Attendance'}
      </Button>
    </DialogActions>
  </>
);

};

const EditContent = ({ handleClose, data, refreshData }: { handleClose: () => void; data: AttendanceRowType; refreshData: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    const date = (document.getElementById('edit-attendance-date') as HTMLInputElement)?.value;
    const checkInTime = (document.getElementById('edit-attendance-checkin-time') as HTMLInputElement)?.value;
    const checkOutTime = (document.getElementById('edit-attendance-checkout-time') as HTMLInputElement)?.value;
    const workingHours = (document.getElementById('edit-attendance-working-hours') as HTMLInputElement)?.value;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      if (!data?.attendanceId) {
        throw new Error('Attendance ID is required for update.');
      }
      await axios.put(`${API_URL}/api/attendance/${data.attendanceId}`, { date, checkInTime, checkOutTime, workingHours });
      refreshData();
      handleClose();
    } catch (error) {
      console.error(error);
      alert('Error updating attendance record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomTextField id="edit-attendance-date" label="Date" type="date" defaultValue={data?.date} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
      <CustomTextField id="edit-attendance-checkin-time" label="Check-In Time" type="time" defaultValue={data?.checkIn?.time} fullWidth margin="normal" />
      <CustomTextField id="edit-attendance-checkout-time" label="Check-Out Time" type="time" defaultValue={data?.checkOut?.time} fullWidth margin="normal" />
      <CustomTextField id="edit-attendance-working-hours" label="Working Hours" type="number" defaultValue={data?.workingHours} fullWidth margin="normal" />
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Update Attendance'}
        </Button>
      </DialogActions>
    </>
  );
};

const AttendanceDialog = ({ open, setOpen, data, refreshData, state }: AttendanceDialogProps) => {
  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.delete(`${API_URL}/api/attendance/${data?.attendanceId}`);
      refreshData();
      handleClose();
    } catch (error) {
      console.error(error);
      alert('Error deleting attendance record.');
    }
  };

  return (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>
      {state === 'delete' ? 'Delete Attendance' : data ? 'Edit Attendance' : 'Add New Attendance'}
    </DialogTitle>
    <DialogContent>
      {/* ✅ Informasi statis ditampilkan hanya untuk ADD */}
      {state !== 'delete' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Informasi Absensi</AlertTitle>
          Absensi hanya dapat dilakukan pada jam shift berikut:
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>Pagi: 07:00 – 08:59 (Tepat waktu mulai dari 08:00)</li>
            <li>Siang: 13:00 – 14:49 (Tepat waktu mulai dari 14:00)</li>
            <li>Malam: 15:00 – 17:00 (Tepat waktu mulai dari 15:45)</li>
          </ul>
        </Alert>
      )}

      {/* ✅ Konten dinamis berdasarkan mode */}
      {state === 'delete' ? (
        'Are you sure you want to delete this attendance record? This action cannot be undone.'
      ) : data ? (
        <EditContent handleClose={handleClose} data={data} refreshData={refreshData} />
      ) : (
        <AddContent handleClose={handleClose} refreshData={refreshData} />
      )}
    </DialogContent>

    <DialogActions>
      {state === 'delete' && (
        <>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDelete}>Confirm Delete</Button>
        </>
      )}
    </DialogActions>
  </Dialog>
);

};

export default AttendanceDialog;