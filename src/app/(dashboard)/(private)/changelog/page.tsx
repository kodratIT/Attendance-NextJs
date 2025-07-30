'use client'

import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Avatar from '@mui/material/Avatar'
import Paper from '@mui/material/Paper'

interface ChangelogEntry {
  version: string
  date: string
  type: 'feature' | 'improvement' | 'bugfix' | 'breaking'
  title: string
  description: string
  icon: string
}

const changelogData: ChangelogEntry[] = [
  {
    version: '3.1.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Dashboard Beranda yang Disempurnakan dengan Navigasi Tab',
    description: 'Mendesain ulang dashboard beranda dengan antarmuka tab modern yang mencakup Riwayat Absensi, Analytics, Tren Analytics, Predictive Analytics, dan tab Insights.',
    icon: 'tabler-trending-up'
  },
  {
    version: '3.1.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Riwayat Absensi Real-time dengan Filter Lanjutan',
    description: 'Menambahkan komponen riwayat absensi yang canggih dengan filter area dan status, detail karyawan yang dapat diklik, dan pembaruan real-time setiap menit.',
    icon: 'tabler-filter'
  },
  {
    version: '3.1.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Sistem Modal Detail Karyawan',
    description: 'Mengimplementasikan modal detail karyawan yang komprehensif dengan foto absensi, waktu check-in/out, data lokasi, dan riwayat absensi lengkap.',
    icon: 'tabler-eye'
  },
  {
    version: '3.1.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Mesin Analytics dan Insights Lanjutan',
    description: 'Menambahkan dashboard analytics komprehensif dengan analisis tren, predictive analytics, dan insight cerdas untuk pola absensi dan performa karyawan.',
    icon: 'tabler-bolt'
  },
  {
    version: '3.1.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Panel Statistik Absensi yang Disempurnakan',
    description: 'Mendesain ulang panel statistik dengan kalkulasi tingkat kehadiran real-time, pelacakan persentase keterlambatan, dan indikator visual yang menarik.',
    icon: 'tabler-users'
  },
  {
    version: '3.1.0',
    date: '2025-08-01',
    type: 'improvement',
    title: 'Optimisasi Pengambilan Data dengan Caching',
    description: 'Mengimplementasikan sistem caching cerdas dengan optimistic updates, permintaan API paralel, dan interval refresh otomatis untuk performa yang lebih baik.',
    icon: 'tabler-database'
  },
  {
    version: '3.1.0',
    date: '2025-08-01',
    type: 'improvement',
    title: 'Peningkatan UI/UX dengan Loading States',
    description: 'Menambahkan skeleton loading yang indah, penanganan error yang lebih baik, dan transisi yang halus di seluruh dashboard untuk pengalaman pengguna yang lebih baik.',
    icon: 'tabler-code'
  },
  {
    version: '3.0.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Dashboard Analytics Lanjutan',
    description: 'Mengintegrasikan dashboard analytics komprehensif dengan grafik interaktif, tren absensi, perbandingan departemen, dan insight real-time.',
    icon: 'tabler-trending-up'
  },
  {
    version: '3.0.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Mesin Predictive Analytics',
    description: 'Menambahkan predictive analytics bertenaga machine learning untuk forecasting absensi, deteksi anomali, dan prediksi tren.',
    icon: 'tabler-bolt'
  },
  {
    version: '3.0.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Tabel Virtual dengan Lazy Loading',
    description: 'Mengimplementasikan komponen tabel virtual performa tinggi dengan lazy loading untuk menangani dataset besar secara efisien.',
    icon: 'tabler-database'
  },
  {
    version: '3.0.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Sistem Filter Lanjutan',
    description: 'Membangun fungsionalitas saved filters yang canggih dengan status filter persisten dan preset filter cepat.',
    icon: 'tabler-filter'
  },
  {
    version: '3.0.0',
    date: '2025-08-01',
    type: 'feature',
    title: 'Eksplorasi Data Drill-Down',
    description: 'Menambahkan kemampuan drill-down detail untuk inspeksi data mendalam dengan tampilan detail berbasis modal.',
    icon: 'tabler-eye'
  },
  {
    version: '3.0.0',
    date: '2025-08-01',
    type: 'improvement',
    title: 'Dashboard Beranda yang Disempurnakan',
    description: 'Mengoptimalkan halaman beranda dengan tab analytics terintegrasi dan pengalaman pengguna yang lebih baik dengan navigasi tab.',
    icon: 'tabler-users'
  },
  {
    version: '3.0.0',
    date: '2025-08-01',
    type: 'improvement',
    title: 'Sistem Manajemen Cache',
    description: 'Mengimplementasikan sistem caching cerdas dengan optimistic updates untuk performa dan pengalaman pengguna yang lebih baik.',
    icon: 'tabler-code'
  }
]

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'feature':
      return 'New Feature'
    case 'improvement':
      return 'Improvement'
    case 'bugfix':
      return 'Bug Fix'
    case 'breaking':
      return 'Breaking Change'
    default:
      return type
  }
}

export default function ChangelogPage() {
  // Group by version
  const groupedChangelog = changelogData.reduce((acc, entry) => {
    if (!acc[entry.version]) {
      acc[entry.version] = []
    }
    acc[entry.version].push(entry)
    return acc
  }, {} as Record<string, ChangelogEntry[]>)

  const getChipColor = (type: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (type) {
      case 'feature': return 'success'
      case 'improvement': return 'info'
      case 'bugfix': return 'warning'
      case 'breaking': return 'error'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Changelog
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay up to date with the latest features, improvements, and bug fixes in our attendance management system.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Object.entries(groupedChangelog).map(([version, entries]) => (
          <Card key={version} elevation={3}>
            <CardHeader
              title={`Version ${version}`}
              subheader={
                <Box display="flex" alignItems="center" gap={1}>
                  <i className="tabler-calendar" style={{ fontSize: '1rem' }} />
                  {new Date(entries[0].date).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Box>
              }
              action={
                <Chip 
                  label={`${entries.length} ${entries.length === 1 ? 'Update' : 'Updates'}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {entries.map((entry, index) => (
                  <Box key={index}>
                    <Box display="flex" gap={2}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: 'grey.100',
                          color: 'text.primary'
                        }}
                      >
                        <i className={entry.icon} style={{ fontSize: '1rem' }} />
                      </Avatar>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {entry.title}
                          </Typography>
                          <Chip 
                            label={getTypeLabel(entry.type)}
                            color={getChipColor(entry.type)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {entry.description}
                        </Typography>
                      </Box>
                    </Box>
                    {index < entries.length - 1 && (
                      <Divider sx={{ mt: 3 }} />
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: 4, 
            bgcolor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <Box color="text.secondary">
            <i className="tabler-code" style={{ fontSize: '2rem', opacity: 0.5 }} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              More updates coming soon. Stay tuned for new features and improvements!
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
