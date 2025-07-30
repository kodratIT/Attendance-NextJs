'use client'

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';

interface InsightsDashboardProps {
  attendanceData: AttendanceRowType[];
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ attendanceData }) => {
  // Kalkulasi statistik
  const stats = React.useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(item => item.status.toLowerCase() === 'present').length;
    const late = attendanceData.filter(item => item.status.toLowerCase() === 'late').length;
    const absent = attendanceData.filter(item => item.status.toLowerCase() === 'absent').length;
    
    const attendanceRate = total > 0 ? ((present + late) / total * 100) : 0;
    const punctualityRate = total > 0 ? (present / total * 100) : 0;
    const absenteeismRate = total > 0 ? (absent / total * 100) : 0;

    return {
      total,
      present,
      late,
      absent,
      attendanceRate,
      punctualityRate,
      absenteeismRate
    };
  }, [attendanceData]);

  // Data untuk pie chart
  const pieData = [
    { name: 'Hadir', value: stats.present, color: '#4caf50' },
    { name: 'Terlambat', value: stats.late, color: '#ff9800' },
    { name: 'Tidak Hadir', value: stats.absent, color: '#f44336' }
  ];

  // Analisis per area
  const areaAnalysis = React.useMemo(() => {
    const areaStats: { [key: string]: { present: number, late: number, absent: number, total: number } } = {};
    
    attendanceData.forEach(item => {
      const area = item.areas || 'Unknown';
      if (!areaStats[area]) {
        areaStats[area] = { present: 0, late: 0, absent: 0, total: 0 };
      }
      
      areaStats[area].total++;
      if (item.status.toLowerCase() === 'present') areaStats[area].present++;
      else if (item.status.toLowerCase() === 'late') areaStats[area].late++;
      else if (item.status.toLowerCase() === 'absent') areaStats[area].absent++;
    });

    return Object.entries(areaStats).map(([area, data]) => ({
      area,
      ...data,
      attendanceRate: data.total > 0 ? ((data.present + data.late) / data.total * 100) : 0
    }));
  }, [attendanceData]);

  // Insight berdasarkan data
  const insights = React.useMemo(() => {
    const insights: Array<{ type: 'success' | 'warning' | 'error' | 'info', message: string, icon: string }> = [];

    if (stats.attendanceRate >= 95) {
      insights.push({
        type: 'success',
        message: `Excellent! Tingkat kehadiran ${stats.attendanceRate.toFixed(1)}% sangat baik.`,
        icon: 'tabler-check-circle'
      });
    } else if (stats.attendanceRate >= 85) {
      insights.push({
        type: 'info',
        message: `Tingkat kehadiran ${stats.attendanceRate.toFixed(1)}% cukup baik, masih bisa ditingkatkan.`,
        icon: 'tabler-info-circle'
      });
    } else {
      insights.push({
        type: 'warning',
        message: `Perhatian! Tingkat kehadiran ${stats.attendanceRate.toFixed(1)}% perlu ditingkatkan.`,
        icon: 'tabler-alert-triangle'
      });
    }

    if (stats.absenteeismRate > 10) {
      insights.push({
        type: 'error',
        message: `Tingkat absensi ${stats.absenteeismRate.toFixed(1)}% terlalu tinggi, perlu tindakan.`,
        icon: 'tabler-exclamation-circle'
      });
    }

    if (stats.late > stats.present * 0.3) {
      insights.push({
        type: 'warning',
        message: `Banyak karyawan terlambat (${stats.late} orang), periksa penyebabnya.`,
        icon: 'tabler-clock-exclamation'
      });
    }

    // Area dengan performa terbaik dan terburuk
    if (areaAnalysis.length > 1) {
      const bestArea = areaAnalysis.reduce((prev, current) => 
        prev.attendanceRate > current.attendanceRate ? prev : current
      );
      const worstArea = areaAnalysis.reduce((prev, current) => 
        prev.attendanceRate < current.attendanceRate ? prev : current
      );

      insights.push({
        type: 'success',
        message: `Area ${bestArea.area} memiliki performa terbaik dengan tingkat kehadiran ${bestArea.attendanceRate.toFixed(1)}%.`,
        icon: 'tabler-trophy'
      });

      if (worstArea.attendanceRate < 80) {
        insights.push({
          type: 'warning',
          message: `Area ${worstArea.area} perlu perhatian khusus, tingkat kehadiran hanya ${worstArea.attendanceRate.toFixed(1)}%.`,
          icon: 'tabler-alert-circle'
        });
      }
    }

    return insights;
  }, [stats, areaAnalysis]);

  return (
    <Grid container spacing={3}>
      {/* Ringkasan Statistik */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader 
            title="Ringkasan Kehadiran Hari Ini"
            subheader={`Total ${stats.total} karyawan`}
          />
          <CardContent>
            <Grid container spacing={3}>
              {/* Progress bars */}
              <Grid item xs={12}>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Tingkat Kehadiran</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {stats.attendanceRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.attendanceRate} 
                    color="primary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Ketepatan Waktu</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {stats.punctualityRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.punctualityRate} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Tingkat Absensi</Typography>
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      {stats.absenteeismRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.absenteeismRate} 
                    color="error"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Pie Chart */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Distribusi Status" />
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Insights dan Rekomendasi */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader 
            title="Insights & Rekomendasi"
            avatar={<i className="tabler-bulb" style={{ fontSize: '1.5rem', color: '#ff9800' }} />}
          />
          <CardContent>
            <List>
              {insights.map((insight, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <i 
                      className={insight.icon} 
                      style={{ 
                        color: insight.type === 'success' ? '#4caf50' : 
                               insight.type === 'warning' ? '#ff9800' : 
                               insight.type === 'error' ? '#f44336' : '#2196f3'
                      }} 
                    />
                  </ListItemIcon>
                  <ListItemText>
                    <Alert severity={insight.type} sx={{ mb: 1 }}>
                      {insight.message}
                    </Alert>
                  </ListItemText>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Analisis per Area */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Performa per Area" />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={areaAnalysis}>
                <XAxis dataKey="area" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#4caf50" name="Hadir" />
                <Bar dataKey="late" fill="#ff9800" name="Terlambat" />
                <Bar dataKey="absent" fill="#f44336" name="Tidak Hadir" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Tren dan Prediksi */}
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title="Tindakan yang Disarankan"
            avatar={<i className="tabler-target" style={{ fontSize: '1.5rem', color: '#2196f3' }} />}
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box p={2} bgcolor="success.light" borderRadius={2} mb={2}>
                  <Typography variant="h6" color="success.dark" gutterBottom>
                    <i className="tabler-check" style={{ marginRight: 8 }} />
                    Yang Berjalan Baik
                  </Typography>
                  <Typography variant="body2">
                    • Tingkat kehadiran overall masih dalam batas normal
                    <br />
                    • Sistem pencatatan berjalan dengan baik
                    <br />
                    • Data real-time tersedia
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box p={2} bgcolor="warning.light" borderRadius={2} mb={2}>
                  <Typography variant="h6" color="warning.dark" gutterBottom>
                    <i className="tabler-alert-triangle" style={{ marginRight: 8 }} />
                    Perlu Perhatian
                  </Typography>
                  <Typography variant="body2">
                    • Monitor area dengan tingkat keterlambatan tinggi
                    <br />
                    • Evaluasi kebijakan jam kerja
                    <br />
                    • Periksa faktor eksternal (transportasi, cuaca)
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box p={2} bgcolor="info.light" borderRadius={2} mb={2}>
                  <Typography variant="h6" color="info.dark" gutterBottom>
                    <i className="tabler-target" style={{ marginRight: 8 }} />
                    Rekomendasi
                  </Typography>
                  <Typography variant="body2">
                    • Implementasikan sistem reward untuk ketepatan waktu
                    <br />
                    • Adakan briefing tentang pentingnya disiplin
                    <br />
                    • Pertimbangkan flexible working hours
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default InsightsDashboard;
