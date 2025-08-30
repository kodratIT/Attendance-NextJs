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
            title="📋 Total Pengajuan"
            value={stats.total}
            icon={<span style={{ fontSize: '1.8rem' }}>🕰️</span>}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="⏳ Nunggu Approve"
            value={stats.submitted}
            icon={<span style={{ fontSize: '1.8rem' }}>⏱️</span>}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="✅ Udah Disetujui"
            value={stats.approved}
            icon={<span style={{ fontSize: '1.8rem' }}>🎉</span>}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="❌ Ditolak"
            value={stats.rejected}
            icon={<span style={{ fontSize: '1.8rem' }}>😭</span>}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="⏰ Total Jam Lembur"
            value={`${Math.round(stats.totalHours)}j`}
            icon={<span style={{ fontSize: '1.8rem' }}>🔥</span>}
            color="#7b1fa2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="📈 Rata-rata"
            value={`${Math.round(stats.averageHours * 10) / 10}j`}
            icon={<span style={{ fontSize: '1.8rem' }}>📊</span>}
            color="#1976d2"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper 
        elevation={1} 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : '0 4px 12px rgba(0,0,0,0.1)',
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="overtime dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab label="🏢 Kelola Lembur" {...a11yProps(0)} />
          <Tab label="📈 Report & Analytics" {...a11yProps(1)} />
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
            <Card sx={{
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.1)',
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📈 Status Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {[
                    { label: '⏳ Nunggu Persetujuan', value: stats.submitted, color: '#ed6c02', emoji: '⏳' },
                    { label: '✅ Udah Disetujui', value: stats.approved, color: '#2e7d32', emoji: '🎉' },
                    { label: '❌ Ditolak', value: stats.rejected, color: '#d32f2f', emoji: '😭' },
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
            <Card sx={{
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.1)',
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⏰ Ringkasan Waktu
                </Typography>
                <Box sx={{ mt: 2, space: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🔥 Total Jam Lembur
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {Math.round(stats.totalHours)} jam
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      📈 Rata-rata per Request
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {Math.round(stats.averageHours * 10) / 10} jam
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      📋 Total Pengajuan
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {stats.total} pengajuan
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🎯 Success Rate
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="success.main">
                      {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.1)',
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📱 Info Real-time
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  ✨ Data lembur tersinkronisasi real-time dengan mobile app! Semua perubahan status 
                  langsung keliatan di app mobile karyawan.
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔄 Last update: {new Date().toLocaleString('id-ID')}
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
