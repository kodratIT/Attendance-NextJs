'use client';

// React Imports
import { useState, useEffect } from 'react';
import axios from 'axios';

// MUI Imports
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

// Component Imports
import DialogCloseButton from '../DialogCloseButton';
import CustomTextField from '@core/components/mui/TextField';

// Style Imports
import tableStyles from '@core/styles/table.module.css';

interface RoleDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  roleId?: string;
  refreshData?: () => void;
}

interface PermissionData {
  id: string;
  name: string;
  actions: string[];
}

interface RoleData {
  success: boolean;
  data: {
    id: string;
    name: string;
    permissions: { id: string; actions: string[] }[];
  };
}

const RoleDialog = ({ open, setOpen, title, roleId, refreshData = () => {} }: RoleDialogProps) => {
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [roleName, setRoleName] = useState<string>(title || '');
  const [selectAll, setSelectAll] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const [permissionsRes, roleRes] = await Promise.all([
          axios.get<PermissionData[]>(`${API_URL}/api/permissions`),
          roleId ? axios.get<RoleData>(`${API_URL}/api/roles/${roleId}`) : null,
        ]);

        if (!Array.isArray(permissionsRes.data)) {
          throw new Error('Invalid permissions response');
        }

        setPermissions(permissionsRes.data);

        // Inisialisasi selectedPermissions dengan array kosong
        const rolePermissions: { [key: string]: string[] } = {};
        permissionsRes.data.forEach((perm) => {
          rolePermissions[perm.id] = [];
        });

        // Pastikan roleRes tidak undefined/null dan memiliki data yang benar
        const rolesData = roleRes?.data?.data ?? null;
        console.log("Roles Data:", rolesData);

        if (rolesData && rolesData.permissions && Array.isArray(rolesData.permissions)) {
          setRoleName(rolesData.name);
          rolesData.permissions.forEach((perm) => {
            rolePermissions[perm.id] = perm.actions || [];
          });
        }

        setSelectedPermissions(rolePermissions);

        // Periksa apakah semua permissions memiliki semua actions tercentang
        const allSelected = permissionsRes.data.every((perm) =>
          perm.actions.every((action) => rolePermissions[perm.id]?.includes(action))
        );
        setSelectAll(allSelected);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchData();
  }, [open, roleId]);

  const togglePermission = (permissionId: string, action: string) => {
    setSelectedPermissions((prev) => {
      const updatedPermissions = { ...prev };

      if (!updatedPermissions[permissionId]) {
        updatedPermissions[permissionId] = [];
      }

      if (updatedPermissions[permissionId].includes(action)) {
        updatedPermissions[permissionId] = updatedPermissions[permissionId].filter((perm) => perm !== action);
      } else {
        updatedPermissions[permissionId] = [...updatedPermissions[permissionId], action];
      }

      return { ...updatedPermissions };
    });
  };

  const toggleSelectAll = () => {
    setSelectedPermissions((prev) => {
      if (selectAll) {
        const resetPermissions: { [key: string]: string[] } = {};
        permissions.forEach((perm) => {
          resetPermissions[perm.id] = [];
        });
        return resetPermissions;
      } else {
        const allPermissions: { [key: string]: string[] } = {};
        permissions.forEach((perm) => {
          allPermissions[perm.id] = [...perm.actions];
        });
        return allPermissions;
      }
    });

    setSelectAll((prev) => !prev);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const payload = {
        name: roleName,
        permissions: Object.entries(selectedPermissions).map(([id, actions]) => ({ id, actions })),
      };

      if (roleId) {
        await axios.put(`${API_URL}/api/roles/${roleId}`, payload);
      } else {
        await axios.post(`${API_URL}/api/roles`, payload);
      }

      if (typeof refreshData === 'function') {
        refreshData();
      }

      setOpen(false);
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      scroll="body"
      open={open}
      onClose={() => setOpen(false)}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple >
        <i className="tabler-x" />
      </DialogCloseButton>
      <DialogTitle variant="h4" className="flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
        {roleId ? 'Edit Role' : 'Add Role'}
        <Typography component="span" className="flex flex-col text-center">
          Set Role Permissions
        </Typography>
      </DialogTitle>
      <DialogContent className="overflow-visible flex flex-col gap-6 pbs-0 sm:pli-16">
        <CustomTextField
          label="Role Name"
          variant="outlined"
          fullWidth
          placeholder="Enter Role Name"
          value={roleName || ''}
          onChange={(e) => setRoleName(e.target.value)}
        />
        {loading ? (
          <div className="flex justify-center items-center min-h-[150px]">
            <CircularProgress />
          </div>
        ) : (
          <>
            <Typography variant="h5">Role Permissions</Typography>
            <FormControlLabel
              control={<Checkbox checked={selectAll} onChange={toggleSelectAll} />}
              label="Select All Permissions and Actions"
            />
            <table className={tableStyles.table}>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.id}>
                    <td>
                      <Typography className="font-medium">{permission.name}</Typography>
                    </td>
                    {permission.actions.map((action) => (
                      <td key={action}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!selectedPermissions[permission.id]?.includes(action)}
                              onChange={() => togglePermission(permission.id, action)}
                            />
                          }
                          label={action}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>{saving ? <CircularProgress color="inherit" size={20} /> : 'Submit'}</Button>
        <Button variant="tonal" color="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleDialog;
