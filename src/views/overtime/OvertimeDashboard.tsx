'use client'

import React, { useState } from 'react'
import { Grid, Box, Tab, Tabs, Paper, Typography, Card, CardContent } from '@mui/material'
import type { OvertimeRequest, OvertimeStats } from '@/types/overtimeTypes'
import StatsCard from '@/components/StatsCard'
import OvertimeView from './index'

interface OvertimeDashboardProps {
  tableData?: OvertimeRequest[]
  stats?: OvertimeStats
  onRefresh?: () => Promise<void>
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`overtime-tabpanel-${index}`}
      aria-labelledby={`overtime-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `overtime-tab-${index}`,
    'aria-controls': `overtime-tabpanel-${index}`,
  }
}

const OvertimeDashboard: React.FC<OvertimeDashboardProps> = ({ 
  tableData = [], 
  stats = {
    total: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    totalHours: 0,
    averageHours: 0
  },
  onRefresh 
}) => {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Total Pengajuan"
            value={stats.total}
            icon={<i className="tabler-clock-hour-4" style={{ fontSize: '1.5rem' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Menunggu Persetujuan"
            value={stats.submitted}
            icon={<i className="tabler-clock-pause" style={{ fontSize: '1.5rem' }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Disetujui"
            value={stats.approved}
            icon={<i className="tabler-check" style={{ fontSize: '1.5rem' }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Ditolak"
            value={stats.rejected}
            icon={<i className="tabler-x" style={{ fontSize: '1.5rem' }} />}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Total Jam"
            value={`${Math.round(stats.totalHours)}j`}
            icon={<i className="tabler-clock" style={{ fontSize: '1.5rem' }} />}
            color="#7b1fa2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Rata-rata Jam"
            value={`${Math.round(stats.averageHours * 10) / 10}j`}
            icon={<i className="tabler-chart-line" style={{ fontSize: '1.5rem' }} />}
            color="#1976d2"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="overtime dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Manajemen Lembur" {...a11yProps(0)} />
          <Tab label="Laporan & Analytics" {...a11yProps(1)} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <OvertimeView 
          tableData={tableData} 
          onRefresh={onRefresh}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {[
                    { label: 'Menunggu Persetujuan', value: stats.submitted, color: '#ed6c02' },
                    { label: 'Disetujui', value: stats.approved, color: '#2e7d32' },
                    { label: 'Ditolak', value: stats.rejected, color: '#d32f2f' },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: item.color,
                          borderRadius: '50%',
                          mr: 1
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ringkasan Waktu
                </Typography>
                <Box sx={{ mt: 2, space: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Total Jam Lembur
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {Math.round(stats.totalHours)} jam
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Rata-rata per Pengajuan
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {Math.round(stats.averageHours * 10) / 10} jam
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Total Pengajuan
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {stats.total} pengajuan
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="textSecondary">
                      Tingkat Persetujuan
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informasi Sistem
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Data lembur tersinkronisasi dengan aplikasi mobile. Perubahan status akan otomatis 
                  diperbarui di aplikasi mobile karyawan.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  )
}

export default OvertimeDashboard
