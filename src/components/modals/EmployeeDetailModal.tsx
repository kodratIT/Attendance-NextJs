'use client'

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Divider,
  Button,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';
import axios from 'axios';

interface EmployeeDetailModalProps {
  open: boolean;
  onClose: () => void;
  employee: AttendanceRowType | null;
}

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[4],
}));

const StatusCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
  }
}));

const InfoCard = styled(Card)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
  }
}));

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  open,
  onClose,
  employee
}) => {
  const [loading, setLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRowType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && employee) {
      fetchAttendanceHistory();
    }
  }, [open, employee]);

  const fetchAttendanceHistory = async () => {
    if (!employee) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const fromDate = sevenDaysAgo.toISOString().slice(0, 10);
      const toDate = now.toISOString().slice(0, 10);
      
      const response = await axios.get(
        `${apiUrl}/api/attendance?fromDate=${fromDate}&toDate=${toDate}`
      );
      
      // Filter for this specific employee
      const employeeHistory = response.data.filter(
        (record: AttendanceRowType) => record.userId === employee.userId
      );
      
      setAttendanceHistory(employeeHistory.slice(0, 7)); // Last 7 days
    } catch (error: any) {
      console.error('Error fetching attendance history:', error);
      setError('Gagal memuat riwayat absensi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'success';
      case 'late': return 'warning';  
      case 'absent': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'tabler-check';
      case 'late': return 'tabler-clock';
      case 'absent': return 'tabler-x';
      default: return 'tabler-help';
    }
  };

  const formatWorkingHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}j ${minutes}m`;
  };

  const handleContactEmployee = () => {
    // Implement contact functionality (WhatsApp, Email, etc.)
    if (employee) {
      const message = `Halo ${employee.name}, terkait absensi hari ini...`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!employee) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Detail Absensi Pegawai
          </Typography>
          <IconButton onClick={onClose}>
            <i className="tabler-x" />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Employee Profile Section */}
          <Grid item xs={12} md={4}>
            <Box textAlign="center" mb={3}>
              <StyledAvatar 
                src={employee.avatar} 
                alt={employee.name}
                sx={{ mx: 'auto', mb: 2 }}
              >
                {employee.name.charAt(0)}
              </StyledAvatar>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {employee.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {employee.userId}
              </Typography>
              <Chip 
                label={employee.areas}
                icon={<i className="tabler-map-pin" />}
                color="primary"
                sx={{ mb: 1 }}
              />
            </Box>

            {/* Current Status */}
            <StatusCard>
              <CardContent>
                <Box textAlign="center">
                  <i 
                    className={getStatusIcon(employee.status)} 
                    style={{ fontSize: '2rem', marginBottom: '8px' }}
                  />
                  <Typography variant="h6" fontWeight="bold">
                    Status Hari Ini
                  </Typography>
                  <Chip 
                    label={employee.status}
                    color={getStatusColor(employee.status) as any}
                    sx={{ mt: 1, color: 'white', fontWeight: 'bold' }}
                  />
                </Box>
              </CardContent>
            </StatusCard>
          </Grid>

          {/* Attendance Details */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Detail Absensi Hari Ini
            </Typography>
            
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <InfoCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <i className="tabler-login" style={{ marginRight: '8px', color: '#28a745' }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        Check In
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {employee.checkIn.time}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {employee.checkIn.location?.name || 'Lokasi tidak tersedia'}
                    </Typography>
                    {employee.checkIn.imageUrl && (
                      <Box mt={2}>
                        <img 
                          src={employee.checkIn.imageUrl} 
                          alt="Foto Check In"
                          style={{
                            width: '100%',
                            maxWidth: '200px',
                            height: 'auto',
                            borderRadius: '8px',
                            border: '2px solid #28a745'
                          }}
                        />
                        <Typography variant="caption" color="success.main" display="block" mt={0.5}>
                          <i className="tabler-camera" style={{ marginRight: '4px' }} />
                          Foto tersimpan
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </InfoCard>
              </Grid>
              
              <Grid item xs={6}>
                <InfoCard>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <i className="tabler-logout" style={{ marginRight: '8px', color: '#dc3545' }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        Check Out
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {employee.checkOut.time || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {employee.checkOut.location?.name || 'Belum check out'}
                    </Typography>
                    {employee.checkOut.imageUrl && (
                      <Box mt={2}>
                        <img 
                          src={employee.checkOut.imageUrl} 
                          alt="Foto Check Out"
                          style={{
                            width: '100%',
                            maxWidth: '200px',
                            height: 'auto',
                            borderRadius: '8px',
                            border: '2px solid #dc3545'
                          }}
                        />
                        <Typography variant="caption" color="error.main" display="block" mt={0.5}>
                          <i className="tabler-camera" style={{ marginRight: '4px' }} />
                          Foto tersimpan
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </InfoCard>
              </Grid>
            </Grid>

            {/* Working Hours & Additional Info */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={4}>
                <InfoCard>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Jam Kerja
                    </Typography>
                    <Typography variant="h6">
                      {employee.workingHours ? formatWorkingHours(employee.workingHours) : '-'}
                    </Typography>
                  </CardContent>
                </InfoCard>
              </Grid>
              
              <Grid item xs={4}>
                <InfoCard>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Keterlambatan
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {employee.lateBy ? `${Math.floor(employee.lateBy / 60)}m` : '0m'}
                    </Typography>
                  </CardContent>
                </InfoCard>
              </Grid>
              
              <Grid item xs={4}>
                <InfoCard>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Shift
                    </Typography>
                    <Typography variant="h6">
                      {employee.shifts}
                    </Typography>
                  </CardContent>
                </InfoCard>
              </Grid>
            </Grid>

            {/* Attendance History */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Riwayat 7 Hari Terakhir
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <List>
                {attendanceHistory.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="Tidak ada riwayat absensi" />
                  </ListItem>
                ) : (
                  attendanceHistory.map((record, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <i className={getStatusIcon(record.status)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">
                              {new Date(record.date).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Typography>
                            <Chip 
                              label={record.status}
                              size="small"
                              color={getStatusColor(record.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption">
                            In: {record.checkIn.time} • Out: {record.checkOut.time || '-'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          variant="outlined" 
          startIcon={<i className="tabler-message" />}
          onClick={handleContactEmployee}
        >
          Hubungi
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<i className="tabler-edit" />}
        >
          Edit Absensi
        </Button>
        <Button 
          variant="contained" 
          onClick={onClose}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDetailModal;
