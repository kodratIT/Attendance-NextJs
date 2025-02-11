'use client';
// React Imports
import { useState, useEffect } from 'react';
import axios from 'axios';
// MUI Imports
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
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
// Type Imports
import type { UserRowType } from '@/types/UserRowType';

interface Role {
  id: string;
  name: string;
}

interface Area {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  name: string;
}

interface UserDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  state?: 'add' | 'edit' | 'delete';
  data?: UserRowType;
  refreshData: () => void;
}

const UserDialog = ({ open, setOpen, state = 'add', data, refreshData }: UserDialogProps) => {
  // States for form fields
  const [name, setName] = useState(data?.name || '');
  const [email, setEmail] = useState(data?.email || '');
  const [roleId, setRoleId] = useState<string>(data?.role.id || '');
  const [areaIds, setAreaIds] = useState<string[]>(data?.areas.map((area) => area.id) || []);
  const [shiftIds, setShiftIds] = useState<string[]>(data?.shifts.map((shift) => shift.id) || []);

  // States for API data
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Error states
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    roleId: '',
    areaIds: '',
    shiftIds: '',
  });

  // Fetch data from API when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        // Fetch roles
        const rolesResponse = await axios.get(`${API_URL}/api/roles`);
        setRoles(rolesResponse.data.data);

        // Fetch areas
        const areasResponse = await axios.get(`${API_URL}/api/areas`);
        setAreas(areasResponse.data.data);

        // Fetch shifts
        const shiftsResponse = await axios.get(`${API_URL}/api/shifts`);
        setShifts(shiftsResponse.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch roles, areas, or shifts.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);

  // Handler for submitting the form
  const handleSubmit = async () => {
    // Reset errors
    setErrors({
      name: '',
      email: '',
      roleId: '',
      areaIds: '',
      shiftIds: '',
    });

    // Validate inputs
    let hasError = false;
    const newErrors = { ...errors };

    if (!name.trim()) {
      newErrors.name = 'Name is required.';
      hasError = true;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format.';
      hasError = true;
    }

    if (!roleId) {
      newErrors.roleId = 'Role is required.';
      hasError = true;
    }

    if (areaIds.length === 0) {
      newErrors.areaIds = 'At least one area must be selected.';
      hasError = true;
    }

    if (shiftIds.length === 0) {
      newErrors.shiftIds = 'At least one shift must be selected.';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const payload = {
        name,
        email,
        roleId,
        areaIds,
        shiftIds,
      };

      if (state.toLowerCase() === 'edit' && data?.id) {
        await axios.put(`${API_URL}/api/users/${data.id}`, payload);
      } else if (state.toLowerCase() === 'add') {
        await axios.post(`${API_URL}/api/users`, payload);
      }

      refreshData();
      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error('Error saving user:', error);

      // Handle specific Firebase Auth errors
      if (error.response?.data?.message === 'Email already in use') {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered.' }));
      } else {
        alert('Error saving user.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handler for deleting a user
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      if (!data?.id) {
        throw new Error('User ID is required for deletion.');
      }
      await axios.delete(`${API_URL}/api/users/${data.id}`);
      refreshData();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error deleting user.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper function to reset form fields
  const resetForm = () => {
    setName('');
    setEmail('');
    setRoleId('');
    setAreaIds([]);
    setShiftIds([]);
    setErrors({
      name: '',
      email: '',
      roleId: '',
      areaIds: '',
      shiftIds: '',
    });
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>
        {state === 'delete' ? 'Delete User' : state === 'edit' ? 'Edit User' : 'Add New User'}
      </DialogTitle>
      <DialogContent>
        {loading && state !== 'delete' ? (
          <Alert severity="info">Loading data...</Alert>
        ) : state === 'delete' ? (
          <Typography variant="body1">
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        ) : (
          <>
            {/* Input for name */}
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
              required
              error={!!errors.name}
              helperText={errors.name}
            />

            {/* Input for email */}
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
              error={!!errors.email}
              helperText={errors.email}
            />

            {/* Dropdown for role */}
            <FormControl fullWidth margin="normal" required error={!!errors.roleId}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value as string)}
                label="Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.roleId && <Typography color="error">{errors.roleId}</Typography>}
            </FormControl>

            {/* Multi-select for areas */}
            <FormControl fullWidth margin="normal" required error={!!errors.areaIds}>
              <InputLabel>Areas</InputLabel>
              <Select
                multiple
                value={areaIds}
                onChange={(e) => setAreaIds(e.target.value as string[])}
                renderValue={(selected) => (
                  <div className="flex flex-wrap gap-1">
                    {(selected as string[]).map((id) => {
                      const area = areas.find((a) => a.id === id);
                      return area ? (
                        <Chip key={area.id} label={area.name} size="small" />
                      ) : null;
                    })}
                  </div>
                )}
                label="Areas"
              >
                {areas.map((area) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.areaIds && <Typography color="error">{errors.areaIds}</Typography>}
            </FormControl>

            {/* Multi-select for shifts */}
            <FormControl fullWidth margin="normal" required error={!!errors.shiftIds}>
              <InputLabel>Shifts</InputLabel>
              <Select
                multiple
                value={shiftIds}
                onChange={(e) => setShiftIds(e.target.value as string[])}
                renderValue={(selected) => (
                  <div className="flex flex-wrap gap-1">
                    {(selected as string[]).map((id) => {
                      const shift = shifts.find((s) => s.id === id);
                      return shift ? (
                        <Chip key={shift.id} label={shift.name} size="small" />
                      ) : null;
                    })}
                  </div>
                )}
                label="Shifts"
              >
                {shifts.map((shift) => (
                  <MenuItem key={shift.id} value={shift.id}>
                    {shift.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.shiftIds && <Typography color="error">{errors.shiftIds}</Typography>}
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {/* Submit or Delete button */}
        {state === 'delete' ? (
          <Button
            onClick={handleDelete}
            variant="outlined"
            color="error"
            disabled={deleting} // Disable tombol delete jika sedang menghapus
          >
            {deleting ? (
              <CircularProgress className="center" color="inherit" size={24} />
            ) : (
              'Confirm Delete'
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || saving} // Tombol akan disabled jika loading atau saving
          >
            {loading ? (
              'Submit'
            ) : saving ? (
              <CircularProgress className="center" color="inherit" size={24} />
            ) : (
              'Submit'
            )}
          </Button>
        )}

        {/* Cancel button */}
        <Button onClick={() => setOpen(false)} variant="tonal" disabled={saving || deleting}>
          Cancel
        </Button>

      </DialogActions>
    </Dialog>
  );
};

export default UserDialog;