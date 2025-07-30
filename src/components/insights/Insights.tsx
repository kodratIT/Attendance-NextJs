'use client'

import React from 'react';
import { Card, CardContent, CardHeader, Grid, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';

interface InsightsProps {
  attendanceData: AttendanceRowType[];
}

const Insights: React.FC<InsightsProps> = ({ attendanceData }) => {
  const totalEmployees = attendanceData.length;
  const presentCount = attendanceData.filter(item => item.status.toLowerCase() === 'present').length;
  const lateCount = attendanceData.filter(item => item.status.toLowerCase() === 'late').length;
  const absentCount = attendanceData.filter(item => item.status.toLowerCase() === 'absent').length;
  const attendanceRate = totalEmployees > 0 ? (presentCount / totalEmployees * 100).toFixed(2) : '0.00';

  return (
    <Card>
      <CardHeader
        title="Insights"
        subheader="Analisis Kehadiran"
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5">Total Karyawan: {totalEmployees}</Typography>
            <Typography variant="h5">Presentase Kehadiran: {attendanceRate}%</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <List dense>
              <ListItem>
                <ListItemText
                  primary={`${presentCount} Hadir`}
                  style={{ color: '#4caf50' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={`${lateCount} Terlambat`}
                  style={{ color: '#ff9800' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={`${absentCount} Tidak Hadir`}
                  style={{ color: '#f44336' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
        <Divider style={{ margin: '16px 0' }} />
        <Typography variant="body2" color="textSecondary">
          Statistik ini memberikan gambaran terkini dari kehadiran karyawan Anda.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default Insights;

