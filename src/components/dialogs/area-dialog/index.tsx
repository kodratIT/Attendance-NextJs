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
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

// Interface untuk area
export type AreaRowType = {
  name: string;
  locations: { id: number; name: string }[];
  createdAt: string;
  updatedAt: string;
};

interface LocationRowType {
  id: number;
  name: string;
}

interface AreaDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  state?: 'add' | 'edit' | 'delete';
  title?: string;
  areaId?: string;
  data?: AreaRowType;
  refreshData?: () => void;
}

const AreaDialog = ({ open, setOpen, state = 'add', title, areaId, data,refreshData = () => {} }: AreaDialogProps) => {
  const [areaName, setAreaName] = useState(title || '');
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [allLocations, setAllLocations] = useState<LocationRowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fungsi untuk mengambil data lokasi dari API
  useEffect(() => {
    if (!open) return;

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await axios.get<LocationRowType[]>(`${API_URL}/api/locations`);
        setAllLocations(response.data);

        // Jika dalam mode edit, ambil data area spesifik
        if (state === 'edit' && areaId) {
          setAreaName(data?.name || '');
          setLocations(data?.locations || []);
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [open, areaId]);

  // Handler untuk multi-select
  const handleLocationChange = (event: any) => {
    const selectedIds = event.target.value as number[];
    const selectedLocs = allLocations.filter((loc) => selectedIds.includes(loc.id));
    setLocations(selectedLocs);
  };

  // Handler untuk submit form
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const locationData = locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
      }));

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const payload = {
        name: areaName,
        locations: locationData,
      };

      if (state === 'edit' && areaId) {
        await axios.put(`${API_URL}/api/areas/${areaId}`, payload);
      } else if (state === 'add') {
        await axios.post(`${API_URL}/api/areas`, payload);
      }

      refreshData();
      setOpen(false);
    } catch (error) {
      console.error('Error saving area:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handler untuk delete area
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.delete(`${API_URL}/api/areas/${areaId}`);
      refreshData();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error deleting area.');
    } finally {
      setDeleting(false);
    }
  };
  return (
    <Dialog
      fullWidth={state !== 'delete'}
      scroll="body"
      open={open}
      onClose={() => setOpen(false)}
    >
      <DialogTitle>
        {state === 'delete' ? 'Delete Area' : state === 'edit' ? 'Edit Area' : 'Add Area'}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          state !== 'delete' ? (
            <>
              <div className="flex justify-center items-center mt-4">
                <CircularProgress />
              </div>
            </>
          ) : (
            <>
              <Typography>Are you sure you want to delete this area? This action cannot be undone.</Typography>
                <Typography variant="body2" color="text.secondary">
                  Once deleted, this area cannot be recovered.
              </Typography>
            </>
          )
        ) : (
          <>
            {/* Mode Delete */}
            {state === 'delete' ? (
              <>
                <Typography>Are you sure you want to delete this area? This action cannot be undone.</Typography>
                <Typography variant="body2" color="text.secondary">
                  Once deleted, this area cannot be recovered.
                </Typography>
              </>
            ) : (
              <>
                {/* Input untuk nama area */}
                <TextField
                  label="Area Name"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  fullWidth
                  margin="normal"
                  required
                />
                {/* Multi-select untuk lokasi menggunakan Select */}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Locations</InputLabel>
                  <Select
                    multiple
                    value={locations.map((loc) => loc.id)}
                    onChange={handleLocationChange}
                    renderValue={(selected) => (
                      <div className="flex flex-wrap gap-1">
                        {(selected as number[]).map((id) => {
                          const location = allLocations.find((loc) => loc.id === id);
                          return location ? (
                            <Chip key={location.id} label={location.name} size="small" />
                          ) : null;
                        })}
                      </div>
                    )}
                  >
                    {allLocations.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {/* Tombol untuk mode Delete */}
        {state === 'delete' ? (
          <>
            <Button onClick={handleDelete} variant="outlined" color="error"  disabled={deleting}>
              {deleting ? <CircularProgress className="center" color="inherit" size={24} /> : 'Confirm Delete'}
            </Button>
            <Button onClick={() => setOpen(false)} variant="tonal" disabled={deleting}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleSubmit} variant="contained" disabled={saving}>
              {saving ? <CircularProgress className="center" color="inherit" size={24} /> : 'Submit'}
            </Button>
            <Button onClick={() => setOpen(false)}  variant="tonal" disabled={saving}>
              Cancel
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
  
};

export default AreaDialog;