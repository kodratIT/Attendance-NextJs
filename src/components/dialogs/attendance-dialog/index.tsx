'use client';

// React Imports
import { useState } from 'react';
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
import axios from 'axios';

type AttendanceDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: AttendanceRowType;
  state?: string;
  refreshData: () => void;
};

const [message, setMessage] = useState('');
const [isError, setIsError] = useState(false);


const AddContent = ({ handleClose, refreshData }: { handleClose: () => void; refreshData: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setMessage('');
    setIsError(false);

    const date = (document.getElementById('attendance-date') as HTMLInputElement)?.value;
    const checkInTime = (document.getElementById('attendance-checkin-time') as HTMLInputElement)?.value;
    const checkOutTime = (document.getElementById('attendance-checkout-time') as HTMLInputElement)?.value;
    const workingHours = (document.getElementById('attendance-working-hours') as HTMLInputElement)?.value;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    try {
      const response = await axios.post(`${API_URL}/api/attendance`, {
        date,
        checkInTime,
        checkOutTime,
        workingHours,
      });

      const data = response.data;
      setMessage(data.message || 'Absensi berhasil.');
      setIsError(false);

      setTimeout(() => {
        refreshData();
        handleClose();
      }, 1200);

    } catch (error: any) {
      console.error('Error submitting request:', error);

      let errMessage = 'Gagal membuat data absensi.';

      if (error?.response?.status === 403) {
        errMessage = `Absensi gagal karena kamu melakukan absen di luar jam yang diizinkan.
Silakan absen pada jam shift yang berlaku:
• Pagi (07:00–08:59)
• Siang (13:00–14:49)
• Malam (15:00–17:00)`;
      }

      setMessage(errMessage);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

return (
  <>
    {/* Alert error/success hanya muncul jika ada message */}

    {/* Form input */}
    <CustomTextField
      id="attendance-date"
      label="Date"
      type="date"
      fullWidth
      margin="normal"
      InputLabelProps={{ shrink: true }}
    />
    <CustomTextField
      id="attendance-checkin-time"
      label="Check-In Time"
      type="time"
      fullWidth
      margin="normal"
    />
    <CustomTextField
      id="attendance-checkout-time"
      label="Check-Out Time"
      type="time"
      fullWidth
      margin="normal"
    />
    <CustomTextField
      id="attendance-working-hours"
      label="Working Hours"
      type="number"
      fullWidth
      margin="normal"
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