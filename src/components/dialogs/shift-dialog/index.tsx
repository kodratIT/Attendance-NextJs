// app/components/dialogs/shift-dialog.tsx
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';


export type ShiftRowType = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  createdAt: string;
  updatedAt: string;
};

interface ShiftDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  state?: 'add' | 'edit' | 'delete';
  title?: string;
  shiftId?: string;
  data: ShiftRowType;
  refreshData?: () => void;
}

const ShiftDialog = ({ open, setOpen, state = 'add', title, shiftId, data, refreshData = () => {} }: ShiftDialogProps) => {
  const [shiftName, setShiftName] = useState(title || '');
  const [dataShift, setShiftData] = useState<ShiftRowType>(data);
  const [startTime, setStartTime] = useState(data?.start_time || '');
  const [endTime, setEndTime] = useState(data?.end_time || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setShiftData(data);
  }, [open]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const payload = {
        name: shiftName,
        start_time: startTime,
        end_time: endTime,
      };
      if (state === 'edit' && dataShift.id) {
        await axios.put(`${API_URL}/api/shifts/${dataShift.id}`, payload);
      } else if (state === 'add') {
        await axios.post(`${API_URL}/api/shifts`, payload);
      }
      refreshData();
      setOpen(false);
    } catch (error) {
      console.error('Error saving shift:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    console.log("DAAA :",dataShift)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.delete(`${API_URL}/api/shifts/${dataShift.id}`);
      refreshData();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error deleting shift.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>{state === 'delete' ? 'Delete Shift' : state === 'edit' ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
      <DialogContent>
        {state === 'delete' ? (
          <Typography>Are you sure you want to delete this shift? This action cannot be undone.</Typography>
        ) : (
          <>
            <TextField
              label="Shift Name"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
              margin="normal"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
              margin="normal"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        {state === 'delete' ? (
          <>
            <Button onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
            <Button onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Submit'}
            </Button>
            <Button onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ShiftDialog;