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

const AddContent = ({ handleClose, refreshData }: { handleClose: () => void; refreshData: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const date = (document.getElementById('attendance-date') as HTMLInputElement)?.value;
    const checkInTime = (document.getElementById('attendance-checkin-time') as HTMLInputElement)?.value;
    const checkOutTime = (document.getElementById('attendance-checkout-time') as HTMLInputElement)?.value;
    const workingHours = (document.getElementById('attendance-working-hours') as HTMLInputElement)?.value;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/attendance`, { date, checkInTime, checkOutTime, workingHours });
      refreshData();
      handleClose();
    } catch (error) {
      console.error(error);
      alert('Error creating attendance record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomTextField id="attendance-date" label="Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
      <CustomTextField id="attendance-checkin-time" label="Check-In Time" type="time" fullWidth margin="normal" />
      <CustomTextField id="attendance-checkout-time" label="Check-Out Time" type="time" fullWidth margin="normal" />
      <CustomTextField id="attendance-working-hours" label="Working Hours" type="number" fullWidth margin="normal" />
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
        {state === 'delete'
          ? 'Are you sure you want to delete this attendance record? This action cannot be undone.'
          : data
          ? <EditContent handleClose={handleClose} data={data} refreshData={refreshData} />
          : <AddContent handleClose={handleClose} refreshData={refreshData} />}
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