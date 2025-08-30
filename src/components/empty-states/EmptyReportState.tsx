'use client'

import React from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Divider
} from '@mui/material'

interface EmptyReportStateProps {
  type: 'no-data' | 'no-results' | 'error' | 'loading-error'
  title?: string
  message?: string
  suggestions?: string[]
  onRefresh?: () => void
  onResetFilters?: () => void
  className?: string
}

const EmptyReportState: React.FC<EmptyReportStateProps> = ({
  type,
  title,
  message,
  suggestions,
  onRefresh,
  onResetFilters,
  className
}) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-data':
        return {
          icon: '📊',
          defaultTitle: 'Belum Ada Data Laporan',
          defaultMessage: 'Data presensi untuk periode yang dipilih belum tersedia.',
          iconClass: 'tabler-chart-line',
          bgGradient: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(143, 55, 199, 0.1))',
          suggestions: [
            '📅 Coba pilih rentang tanggal yang berbeda',
            '🔄 Periksa koneksi internet dan refresh halaman',
            '👥 Pastikan ada karyawan yang sudah melakukan presensi'
          ]
        }
      
      case 'no-results':
        return {
          icon: '🔍',
          defaultTitle: 'Hasil Pencarian Kosong',
          defaultMessage: 'Tidak ditemukan data yang sesuai dengan filter yang diterapkan.',
          iconClass: 'tabler-search-off',
          bgGradient: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.1))',
          suggestions: [
            '🎯 Coba ubah atau hapus beberapa filter',
            '📝 Periksa ejaan nama karyawan atau area',
            '🗓️ Perluas rentang tanggal pencarian'
          ]
        }
      
      case 'error':
        return {
          icon: '⚠️',
          defaultTitle: 'Oops! Terjadi Kesalahan',
          defaultMessage: 'Gagal memuat data laporan. Silakan coba beberapa saat lagi.',
          iconClass: 'tabler-alert-triangle',
          bgGradient: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(255, 87, 34, 0.1))',
          suggestions: [
            '🔄 Refresh halaman untuk memuat ulang data',
            '🌐 Periksa koneksi internet Anda',
            '📞 Hubungi admin jika masalah berlanjut'
          ]
        }
      
      case 'loading-error':
        return {
          icon: '⏳',
          defaultTitle: 'Gagal Memuat Data',
          defaultMessage: 'Server sedang sibuk atau tidak merespons.',
          iconClass: 'tabler-loader',
          bgGradient: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(233, 30, 99, 0.1))',
          suggestions: [
            '⏰ Tunggu sebentar dan coba lagi',
            '🔄 Klik tombol refresh untuk mencoba lagi',
            '🛠️ Laporkan jika masalah terus terjadi'
          ]
        }
      
      default:
        return {
          icon: '🤔',
          defaultTitle: 'Tidak Ada Data',
          defaultMessage: 'Data tidak tersedia saat ini.',
          iconClass: 'tabler-database-off',
          bgGradient: 'linear-gradient(135deg, rgba(96, 125, 139, 0.1), rgba(120, 144, 156, 0.1))',
          suggestions: []
        }
    }
  }

  const content = getEmptyStateContent()
  const displayTitle = title || content.defaultTitle
  const displayMessage = message || content.defaultMessage
  const displaySuggestions = suggestions || content.suggestions

  return (
    <Card 
      className={className}
      sx={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <CardContent sx={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
        <Box
          sx={{
            background: content.bgGradient,
            borderRadius: '20px',
            p: 4,
            mb: 3
          }}
        >
          {/* Large Emoji Icon */}
          <Typography 
            sx={{ 
              fontSize: '4rem', 
              lineHeight: 1,
              mb: 2,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
            }}
          >
            {content.icon}
          </Typography>
          
          {/* Tabler Icon as backup */}
          <i 
            className={`${content.iconClass} text-6xl opacity-20`} 
            style={{ 
              display: 'block',
              fontSize: '3rem',
              marginBottom: '1rem'
            }} 
          />
          
          <Typography variant="h5" color="text.primary" fontWeight="bold" gutterBottom>
            {displayTitle}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {displayMessage}
          </Typography>
          
          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            {onRefresh && (
              <Button
                variant="contained"
                onClick={onRefresh}
                startIcon={<i className="tabler-refresh" />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #7c4dff, #4338ca)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #6c42e8, #3730a3)'
                  }
                }}
              >
                🔄 Refresh Data
              </Button>
            )}
            
            {onResetFilters && type === 'no-results' && (
              <Button
                variant="outlined"
                onClick={onResetFilters}
                startIcon={<i className="tabler-filter-off" />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none'
                }}
              >
                🧹 Reset Filter
              </Button>
            )}
          </Box>
        </Box>

        {/* Suggestions */}
        {displaySuggestions.length > 0 && (
          <>
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                💭 Saran
              </Typography>
            </Divider>
            
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px'
              }}
            >
              <Box component="ul" sx={{ 
                listStyle: 'none', 
                p: 0, 
                m: 0,
                '& li': {
                  py: 0.5,
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1
                }
              }}>
                {displaySuggestions.map((suggestion, index) => (
                  <li key={index}>
                    {suggestion}
                  </li>
                ))}
              </Box>
            </Paper>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default EmptyReportState
