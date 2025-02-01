'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'
import type { PermissionRowType } from '@/types/permissionTypes'
import axios from 'axios'

type PermissionDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: PermissionRowType
  state?: string
  refreshData: () => void
}

const AddContent = ({ handleClose, refreshData }: { handleClose: () => void; refreshData: () => void }) => {
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    const name = (document.getElementById('permission-name') as HTMLInputElement)?.value

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.post(`${API_URL}/api/permissions`, { name});
  
      refreshData()
      handleClose()
    } catch (error) {
      console.error(error)
      alert('Error creating permission.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogContent className="overflow-visible pbs-0 sm:pli-16">
        <CustomTextField fullWidth label="Permission Name" id="permission-name" className="mbe-2" />
        <FormControlLabel control={<Checkbox id="core-permission" />} label="Set as core permission" />
      </DialogContent>
      <DialogActions className="flex justify-center pbs-0 sm:pbe-16 sm:pli-16">
        <Button variant="contained" onClick={handleCreate} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Create Permission'}
        </Button>
        <Button onClick={handleClose} variant="tonal" color="secondary">
          Discard
        </Button>
      </DialogActions>
    </>
  )
}

const EditContent = ({ handleClose, data, refreshData }: { handleClose: () => void; data: PermissionRowType; refreshData: () => void }) => {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true)
    const name = (document.getElementById('edit-permission-name') as HTMLInputElement)?.value
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      if (!data?.id) {
        throw new Error("Permission ID is required for update.");
      }
  
      const response = await axios.put(
        `${API_URL}/api/permissions/${data.id}`, // Pastikan ID di URL
        { name}, // Body dalam format JSON
        {
          headers: {
            'Content-Type': 'application/json', // Paksa header JSON
          },
        }
      );
  
      console.log("Update Response:", response.data);
      refreshData()
      handleClose()
    } catch (error) {
      console.error("Update Error:", error)
      alert('Error updating permission.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DialogContent className="overflow-visible pbs-0 sm:pli-16">
      <Alert severity="warning" className="mbe-8">
        <AlertTitle>Warning!</AlertTitle>
        By editing the permission name, you might break the system permissions functionality.
      </Alert>
      <div className="flex items-end gap-4 mbe-2">
        <CustomTextField id='edit-permission-name' fullWidth size="small" defaultValue={data?.name} variant="outlined" label="Permission Name" placeholder="Enter Permission Name" />
        <Button variant="contained" onClick={handleUpdate} disabled={loading}>
          {loading ? <CircularProgress color={'inherit'} size={20} /> : 'Update'}
        </Button>
      </div>
    </DialogContent>
  )
}

const PermissionDialog = ({ open, setOpen, data, refreshData,state }: PermissionDialogProps) => {
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setOpen(false)
  }

  const handleDelete = async () => {
    setLoading(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await axios.delete(`${API_URL}/api/permissions/${data?.id}`);
      refreshData()
      handleClose()
    } catch (error) {
      console.error(error)
      alert('Error deleting permission.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className="tabler-x" />
      </DialogCloseButton>
      <DialogTitle variant="h4" className="flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
        {state === 'delete' ? 'Delete Permission' : data ? 'Edit Permission' : 'Add New Permission'}
        <Typography component="span" className="text-center">
          {state === 'delete'
            ? 'Are you sure you want to delete this permission? This action cannot be undone.'
            : data
            ? 'Edit permission as per your requirements.'
            : 'Permissions you may use and assign to your users.'}
        </Typography>
      </DialogTitle>

      {state === 'delete' ? (
        <DialogActions className="flex justify-center pbs-4 sm:pli-16">
          <Button variant="outlined" color="error" onClick={handleDelete} disabled={loading}>
            {loading ? <CircularProgress color='inherit' size={20} /> : 'Confirm Delete'}
          </Button>
          <Button onClick={handleClose} variant="tonal" color="secondary">
            Cancel
          </Button>
        </DialogActions>
      ) : data ? (
        <EditContent handleClose={handleClose} data={data} refreshData={refreshData} />
      ) : (
        <AddContent handleClose={handleClose} refreshData={refreshData} />
      )}
    </Dialog>
  )
}

export default PermissionDialog
