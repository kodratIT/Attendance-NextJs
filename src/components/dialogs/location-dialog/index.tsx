'use client'; // Pastikan ini adalah Client Component

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
// Axios Import
import axios from 'axios';
// Map Component
import dynamic from 'next/dynamic'; // Gunakan dynamic import untuk MapWithEvents
const MapWithEvents = dynamic(() => import('./MapWithEvent'), { ssr: false }); // Nonaktifkan SSR
// Type Imports
import type { LocationRowType } from '@/types/locationTypes';

type LocationDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  data?: LocationRowType;
  state?: 'ADD' | 'EDIT' | 'DELETE'; // Tipe eksplisit untuk state
  refreshData: () => void;
};

const defaultCenter: [number, number] = [-1.6107, 103.6131];

const LocationDialog = ({ open, setOpen, data, refreshData, state }: LocationDialogProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [newLocation, setNewLocation] = useState<LocationRowType>({
    id: data?.id || 0,
    name: data?.name || '',
    latitude: data?.latitude || defaultCenter[0],
    longitude: data?.longitude || defaultCenter[1],
    createdAt: data?.createdAt || new Date().toISOString(),
    assignedTo: data?.assignedTo || [],
    radius: data?.radius || 500, // Default radius: 500 meters
  });

  const handleClose = () => {
    setOpen(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/locations`, {
        name: newLocation.name,
        longitude: newLocation.longitude,
        latitude: newLocation.latitude,
        radius: newLocation.radius,
      });
      refreshData();
      handleClose();
    } catch (error) {
      console.error(error);
      alert('Error creating location.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      if (!data?.id) {
        throw new Error('Location ID is required for update.');
      }
      await axios.put(`${API_URL}/api/locations/${data.id}`, {
        name: newLocation.name,
        longitude: newLocation.longitude,
        latitude: newLocation.latitude,
        radius: newLocation.radius,
      });
      refreshData();
      handleClose();
    } catch (error) {
      console.error(error);
      alert('Error updating location.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      if (!data?.id) {
        throw new Error('Location ID is required for deletion.');
      }
      await axios.delete(`${API_URL}/api/locations/${data.id}`);
      refreshData();
      handleClose();
    } catch (error) {
      console.error(error);
      alert('Error deleting location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      fullWidth={state !== 'DELETE'} 
      maxWidth={state === 'DELETE' ? 'sm' : 'xl'} 
      scroll="body" 
      open={open}
      onClose={handleClose}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className="tabler-x" />
      </DialogCloseButton>
      <DialogTitle variant="h4" className="flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
        {state === 'DELETE'
          ? 'Delete Location'
          : data
          ? 'Edit Location'
          : 'Add New Location'}
        <Typography component="span" className="text-center">
          {state === 'DELETE'
            ? 'Are you sure you want to delete this location? This action cannot be undone.'
            : data
            ? 'Edit location details as per your requirements.'
            : 'Add a new location with a name and coordinates.'}
        </Typography>
      </DialogTitle>
      {state === 'DELETE' ? (
        <DialogActions className="flex justify-center pbs-4 sm:pli-16">
          <Button variant="outlined" color="error" onClick={handleDelete} disabled={loading}>
            {loading ? <CircularProgress color="inherit" size={20} /> : 'Confirm Delete'}
          </Button>
          <Button onClick={handleClose} variant="tonal" color="secondary">
            Cancel
          </Button>
        </DialogActions>
      ) : (
        <>
          <DialogContent className="overflow-visible pbs-0 sm:pli-16">
            {/* Input Fields: 50%-50% Layout */}
            
            {/* Peta: Full Width */}
            <div>
              <Typography variant="subtitle1" className="mbe-2">
                Select Location on Map
              </Typography>
              {/* Dynamic Import untuk MapWithEvents */}
              {typeof window !== 'undefined' && (
                <MapWithEvents
                  newLocation={newLocation}
                  setNewLocation={setNewLocation}
                />
              )}
            </div>
            <div className="flex gap-4 mbe-4 mt-5">
              <CustomTextField
                fullWidth
                label="Location Name"
                placeholder='Indonesia'
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                className="w-1/2" // 50% width
              />
              <CustomTextField
                fullWidth
                label="Radius (in meters)"
                type="number"
                value={newLocation.radius}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, radius: Number(e.target.value) })
                }
                className="w-1/2" // 50% width
              />
            </div>
          </DialogContent>
          <DialogActions className="flex justify-center pbs-0 sm:pbe-16 sm:pli-16">
            <Button
              variant="contained"
              onClick={data ? handleUpdate : handleCreate}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress color="inherit" size={20} />
              ) : data ? (
                'Update Location'
              ) : (
                'Create Location'
              )}
            </Button>
            <Button onClick={handleClose} variant="tonal" color="secondary">
              Discard
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default LocationDialog;