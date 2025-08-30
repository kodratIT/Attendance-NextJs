'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Paper,
  Divider,
  Chip,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'

// Type for autoTable options
interface AutoTableOptions {
  head?: any[][]
  body?: any[][]
  startY?: number
  theme?: 'striped' | 'grid' | 'plain'
  headStyles?: any
  bodyStyles?: any
  alternateRowStyles?: any
  margin?: { left?: number; right?: number; top?: number; bottom?: number }
  columnStyles?: any
}

interface ProfessionalReportTemplateProps {
  data: AttendanceRowType[]
  open: boolean
  onClose: () => void
  userRole?: string // For role-based access control
}

interface ReportConfig {
  template: 'summary' | 'detailed' | 'executive' | 'discipline'
  includeCharts: boolean
  includeAnalytics: boolean
  includeRecommendations: boolean
  dateRange: string
  customTitle: string
  sections: string[]
}

const REPORT_TEMPLATES = {
  summary: {
    name: '📋 Laporan Ringkasan',
    description: 'Laporan singkat dengan KPI utama dan statistik dasar',
    icon: '📊',
    requiredRole: 'all',
    defaultSections: ['overview', 'kpi', 'departments']
  },
  detailed: {
    name: '📄 Laporan Detail',
    description: 'Laporan lengkap dengan semua data dan analisis mendalam',
    icon: '📑',
    requiredRole: 'manager',
    defaultSections: ['overview', 'kpi', 'departments', 'individual', 'charts', 'recommendations']
  },
  executive: {
    name: '👔 Executive Dashboard',
    description: 'Laporan tingkat manajemen dengan insights strategis',
    icon: '📈',
    requiredRole: 'executive',
    defaultSections: ['overview', 'strategic-kpi', 'trends', 'recommendations', 'action-items']
  },
  discipline: {
    name: '🎯 Laporan Kedisiplinan',
    description: 'Fokus pada analisis kedisiplinan dan performa karyawan',
    icon: '⚖️',
    requiredRole: 'hr',
    defaultSections: ['discipline-overview', 'discipline-details', 'attention-needed', 'recommendations']
  }
}

const AVAILABLE_SECTIONS = {
  overview: '🔍 Ringkasan Umum',
  kpi: '📊 Key Performance Indicators',
  'strategic-kpi': '🎯 Strategic KPIs',
  departments: '🏢 Analisis per Departemen',
  individual: '👤 Data Individual',
  charts: '📈 Visualisasi Data',
  trends: '📉 Analisis Tren',
  'discipline-overview': '⚖️ Overview Kedisiplinan',
  'discipline-details': '📝 Detail Kedisiplinan',
  'attention-needed': '⚠️ Perlu Perhatian',
  recommendations: '💡 Rekomendasi',
  'action-items': '✅ Action Items'
}

const ProfessionalReportTemplate: React.FC<ProfessionalReportTemplateProps> = ({ 
  data, 
  open, 
  onClose, 
  userRole = 'all' 
}) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    template: 'summary',
    includeCharts: true,
    includeAnalytics: true,
    includeRecommendations: false,
    dateRange: '',
    customTitle: '',
    sections: REPORT_TEMPLATES.summary.defaultSections
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // Check if user has access to specific template
  const hasAccess = (templateKey: keyof typeof REPORT_TEMPLATES): boolean => {
    const template = REPORT_TEMPLATES[templateKey]
    if (template.requiredRole === 'all') return true
    
    // Role hierarchy: executive > manager > hr > all
    const roleHierarchy = ['all', 'hr', 'manager', 'executive']
    const userRoleIndex = roleHierarchy.indexOf(userRole)
    const requiredRoleIndex = roleHierarchy.indexOf(template.requiredRole)
    
    return userRoleIndex >= requiredRoleIndex
  }

  const handleTemplateChange = (template: keyof typeof REPORT_TEMPLATES) => {
    if (!hasAccess(template)) return
    
    setReportConfig(prev => ({
      ...prev,
      template,
      sections: REPORT_TEMPLATES[template].defaultSections
    }))
  }

  const handleSectionToggle = (section: string) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }))
  }

  const generatePDFReport = async () => {
    setIsGenerating(true)
    
    try {
      // Calculate analytics data for PDF
      const analytics = calculateReportAnalytics(data)
      
      // Create PDF content based on selected template and sections
      const pdfContent = await generatePDFContent(reportConfig, analytics, data)
      
      // Generate and download PDF
      await downloadPDF(pdfContent, `Attendance_Report_${Date.now()}.pdf`)
      
      console.log('✅ PDF report generated successfully')
    } catch (error) {
      console.error('❌ Error generating PDF:', error)
      alert('Gagal generate PDF report. Silakan coba lagi.')
    } finally {
      setIsGenerating(false)
      onClose()
    }
  }

  const calculateReportAnalytics = (attendanceData: AttendanceRowType[]) => {
    if (!attendanceData.length) return null

    const totalEmployees = attendanceData.length
    const attendedCount = attendanceData.filter(emp => 
      emp.checkIn?.time && emp.checkIn.time !== '-'
    ).length
    
    const avgDiscipline = attendanceData.reduce((sum, emp) => 
      sum + (emp.averageScore || emp.score || 0), 0
    ) / totalEmployees

    const avgWorkingHours = attendanceData.reduce((sum, emp) => 
      sum + (emp.workingHours || 0), 0
    ) / totalEmployees / 3600

    return {
      totalEmployees,
      attendanceRate: (attendedCount / totalEmployees) * 100,
      avgDiscipline,
      avgWorkingHours,
      generateDate: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const generatePDFContent = async (config: ReportConfig, analytics: any, attendanceData: AttendanceRowType[]) => {
    // This would integrate with a PDF generation library like jsPDF or react-pdf
    // For now, return a mock content structure
    return {
      title: config.customTitle || `${REPORT_TEMPLATES[config.template].name} - ${analytics?.generateDate}`,
      template: config.template,
      sections: config.sections,
      data: attendanceData,
      analytics,
      config
    }
  }

  const downloadPDF = async (content: any, filename: string) => {
    try {
      console.log('📄 Generating Professional PDF with content:', content)
      
      // Create new PDF document with A4 size
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      let yPosition = margin
      
      // Helper function for time formatting
      const formatSecondsToTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}j ${minutes}m`
      }
      
      // Helper function to add header on each page
      const addPageHeader = (pageNum: number, totalPages: number) => {
        // Company header background
        pdf.setFillColor(124, 77, 255)
        pdf.rect(0, 0, pageWidth, 25, 'F')
        
        // Company name/logo area
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('PT. ATTENDANCE SYSTEM', margin, 15)
        
        // Report type on the right
        pdf.setFontSize(12)
        pdf.text(`LAPORAN PRESENSI KARYAWAN`, pageWidth - margin, 15, { align: 'right' })
        
        // Sub-header line
        pdf.setDrawColor(230, 230, 230)
        pdf.setLineWidth(0.5)
        pdf.line(margin, 30, pageWidth - margin, 30)
        
        return 40 // Return new Y position after header
      }
      
      // Helper function to check if new page is needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 30) {
          pdf.addPage()
          yPosition = addPageHeader(pdf.internal.getCurrentPageInfo().pageNumber, pdf.internal.getNumberOfPages())
        }
      }
      
      // Add header to first page
      yPosition = addPageHeader(1, 1)
      
      // Report title section
      yPosition += 10
      pdf.setTextColor(40, 40, 40)
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      const titleText = content.customTitle || content.title
      pdf.text(titleText, pageWidth / 2, yPosition, { align: 'center', maxWidth: contentWidth })
      
      yPosition += 15
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      const generateDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      pdf.text(`Dibuat pada: ${generateDate}`, pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 20
      
      // Executive Summary Box
      if (content.analytics) {
        checkPageBreak(60)
        
        const analytics = content.analytics
        const summaryBoxHeight = 50
        
        // Summary box background
        pdf.setFillColor(248, 249, 250)
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.5)
        pdf.rect(margin, yPosition, contentWidth, summaryBoxHeight, 'FD')
        
        // Summary title
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(40, 40, 40)
        pdf.text('RINGKASAN EKSEKUTIF', margin + 10, yPosition + 12)
        
        // Summary stats in two columns
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(60, 60, 60)
        
        const col1X = margin + 10
        const col2X = margin + (contentWidth / 2) + 10
        const statsY = yPosition + 25
        
        // Left column
        pdf.text(`Total Karyawan: ${analytics.totalEmployees} orang`, col1X, statsY)
        pdf.text(`Tingkat Kehadiran: ${analytics.attendanceRate.toFixed(1)}%`, col1X, statsY + 8)
        
        // Right column
        pdf.text(`Rata-rata Kedisiplinan: ${analytics.avgDiscipline.toFixed(1)}/100`, col2X, statsY)
        pdf.text(`Rata-rata Jam Kerja: ${analytics.avgWorkingHours.toFixed(1)} jam/hari`, col2X, statsY + 8)
        
        yPosition += summaryBoxHeight + 20
      }
      
      // Main data table
      if (content.data && content.data.length > 0) {
        checkPageBreak(80)
        
        // Section title
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(40, 40, 40)
        pdf.text('DETAIL DATA KARYAWAN', margin, yPosition)
        
        yPosition += 15
        
        // Prepare table data with better formatting
        const tableHeaders = [
          'No.',
          'Nama Karyawan',
          'Departemen/Cabang',
          'Hari Kerja',
          'Total Jam Kerja',
          'Tingkat Kedisiplinan'
        ]
        
        const tableData = content.data.map((emp: AttendanceRowType, index: number) => [
          (index + 1).toString(),
          emp.name || 'N/A',
          emp.areas || 'N/A',
          `${emp.totalHari || 0} hari`,
          formatSecondsToTime(emp.workingHours || 0),
          `${(emp.averageScore || emp.score || 0).toFixed(1)}%`
        ])
        
        // Professional table styling
        autoTable(pdf, {
          head: [tableHeaders],
          body: tableData,
          startY: yPosition,
          theme: 'grid',
          headStyles: {
            fillColor: [41, 128, 185], // Professional blue
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: { top: 8, right: 5, bottom: 8, left: 5 }
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [40, 40, 40],
            cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
            lineColor: [200, 200, 200],
            lineWidth: 0.25
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { halign: 'center', cellWidth: 18 }, // No
            1: { halign: 'left', cellWidth: 50 },   // Nama
            2: { halign: 'left', cellWidth: 40 },   // Departemen
            3: { halign: 'center', cellWidth: 28 }, // Hari Kerja
            4: { halign: 'center', cellWidth: 32 }, // Jam Kerja
            5: { halign: 'center', cellWidth: 32 }  // Kedisiplinan
          },
          didDrawPage: (data: any) => {
            // Add page header if new page was created
            if (data.pageNumber > 1) {
              addPageHeader(data.pageNumber, pdf.internal.getNumberOfPages())
            }
          }
        })
        
        yPosition = (pdf as any).lastAutoTable.finalY + 20
      }
      
      // Department Analysis Section
      if (content.sections.includes('departments') && content.data.length > 0) {
        checkPageBreak(100)
        
        // Group data by department
        const deptAnalysis = content.data.reduce((acc: any, emp: AttendanceRowType) => {
          const dept = emp.areas || 'Tidak Diketahui'
          if (!acc[dept]) {
            acc[dept] = {
              count: 0,
              totalDiscipline: 0,
              totalHours: 0
            }
          }
          acc[dept].count += 1
          acc[dept].totalDiscipline += (emp.averageScore || emp.score || 0)
          acc[dept].totalHours += (emp.workingHours || 0)
          return acc
        }, {})
        
        // Section title
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(40, 40, 40)
        pdf.text('ANALISIS PERFORMA PER DEPARTEMEN', margin, yPosition)
        
        yPosition += 15
        
        const deptHeaders = [
          'Departemen',
          'Jumlah Karyawan',
          'Rata-rata Kedisiplinan',
          'Rata-rata Jam Kerja/Hari'
        ]
        
        const deptData = Object.entries(deptAnalysis).map(([dept, data]: [string, any]) => [
          dept,
          `${data.count} orang`,
          `${(data.totalDiscipline / data.count).toFixed(1)}%`,
          `${(data.totalHours / data.count / 3600).toFixed(1)} jam`
        ])
        
        autoTable(pdf, {
          head: [deptHeaders],
          body: deptData,
          startY: yPosition,
          theme: 'grid',
          headStyles: {
            fillColor: [39, 174, 96], // Professional green
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: { top: 8, right: 5, bottom: 8, left: 5 }
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [40, 40, 40],
            cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
            lineColor: [200, 200, 200],
            lineWidth: 0.25
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { halign: 'left', cellWidth: 60 },   // Departemen
            1: { halign: 'center', cellWidth: 40 }, // Jumlah
            2: { halign: 'center', cellWidth: 45 }, // Kedisiplinan
            3: { halign: 'center', cellWidth: 45 }  // Jam Kerja
          }
        })
        
        yPosition = (pdf as any).lastAutoTable.finalY + 20
      }
      
      // Recommendations Section
      if (content.config.includeRecommendations) {
        checkPageBreak(80)
        
        // Section title
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(40, 40, 40)
        pdf.text('REKOMENDASI DAN RENCANA TINDAK LANJUT', margin, yPosition)
        
        yPosition += 15
        
        // Recommendations box
        const recBoxHeight = 60
        pdf.setFillColor(255, 248, 225) // Light orange background
        pdf.setDrawColor(255, 193, 7)   // Orange border
        pdf.setLineWidth(1)
        pdf.rect(margin, yPosition, contentWidth, recBoxHeight, 'FD')
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(60, 60, 60)
        
        const recommendations = [
          '1. Implementasikan sistem monitoring real-time untuk karyawan dengan kedisiplinan < 70%',
          '2. Adakan program pelatihan manajemen waktu untuk departemen dengan performa rendah',
          '3. Buat sistem reward dan recognition untuk karyawan dengan kedisiplinan tinggi',
          '4. Review dan evaluasi kebijakan jam kerja berdasarkan data analisis',
          '5. Lakukan evaluasi dan review bulanan untuk tracking progress improvement'
        ]
        
        let recY = yPosition + 12
        recommendations.forEach(rec => {
          pdf.text(rec, margin + 8, recY, { maxWidth: contentWidth - 16 })
          recY += 10
        })
        
        yPosition += recBoxHeight + 15
      }
      
      // Add professional footer to all pages
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        
        // Footer line
        pdf.setDrawColor(230, 230, 230)
        pdf.setLineWidth(0.5)
        pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)
        
        // Footer content
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(120, 120, 120)
        
        // Left side - Generated info
        pdf.text('Generated by Attendance Management System', margin, pageHeight - 12)
        
        // Center - Report date
        const footerDate = new Date().toLocaleDateString('id-ID')
        pdf.text(`Tanggal: ${footerDate}`, pageWidth / 2, pageHeight - 12, { align: 'center' })
        
        // Right side - Page number
        pdf.text(`Hal. ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' })
        
        // Confidential watermark
        pdf.setFontSize(6)
        pdf.setTextColor(150, 150, 150)
        pdf.text('CONFIDENTIAL - INTERNAL USE ONLY', pageWidth / 2, pageHeight - 5, { align: 'center' })
      }
      
      // Save the PDF with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const finalFilename = `Laporan_Presensi_${timestamp}.pdf`
      pdf.save(finalFilename)
      
      console.log('✅ Professional PDF report generated successfully:', finalFilename)
      
    } catch (error) {
      console.error('❌ Error generating professional PDF:', error)
      throw error
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #7c4dff, #4338ca)',
        color: 'white',
        borderRadius: '16px 16px 0 0'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <i className="tabler-file-export" style={{ fontSize: '1.5rem' }} />
          📄 Generator Laporan Profesional
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Template Selection */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                🎨 Pilih Template
              </Typography>
              
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={reportConfig.template}
                  onChange={(e) => handleTemplateChange(e.target.value as keyof typeof REPORT_TEMPLATES)}
                >
                  {Object.entries(REPORT_TEMPLATES).map(([key, template]) => {
                    const accessible = hasAccess(key as keyof typeof REPORT_TEMPLATES)
                    
                    return (
                      <Paper 
                        key={key}
                        sx={{ 
                          p: 2, 
                          mb: 2,
                          border: '1px solid',
                          borderColor: reportConfig.template === key ? 'primary.main' : 'divider',
                          borderRadius: '8px',
                          backgroundColor: !accessible ? 'action.disabled' : 
                                         reportConfig.template === key ? 'primary.50' : 'transparent',
                          opacity: accessible ? 1 : 0.5,
                          cursor: accessible ? 'pointer' : 'not-allowed'
                        }}
                        onClick={() => accessible && handleTemplateChange(key as keyof typeof REPORT_TEMPLATES)}
                      >
                        <FormControlLabel
                          value={key}
                          control={<Radio disabled={!accessible} />}
                          disabled={!accessible}
                          label={
                            <Box>
                              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {template.icon} {template.name}
                                {!accessible && <Chip label="Akses Terbatas" size="small" color="error" />}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {template.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Role: {template.requiredRole}
                              </Typography>
                            </Box>
                          }
                          sx={{ width: '100%', m: 0 }}
                        />
                      </Paper>
                    )
                  })}
                </RadioGroup>
              </FormControl>
            </Paper>
          </Grid>

          {/* Configuration Options */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                ⚙️ Konfigurasi Laporan
              </Typography>

              {/* Custom Title */}
              <TextField
                fullWidth
                label="📝 Judul Custom (Opsional)"
                value={reportConfig.customTitle}
                onChange={(e) => setReportConfig(prev => ({ ...prev, customTitle: e.target.value }))}
                placeholder="Masukkan judul laporan custom..."
                sx={{ mb: 3 }}
              />

              {/* Report Options */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  📋 Opsi Laporan:
                </Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeCharts}
                      onChange={(e) => setReportConfig(prev => ({ 
                        ...prev, 
                        includeCharts: e.target.checked 
                      }))}
                    />
                  }
                  label="📊 Sertakan Charts & Grafik"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeAnalytics}
                      onChange={(e) => setReportConfig(prev => ({ 
                        ...prev, 
                        includeAnalytics: e.target.checked 
                      }))}
                    />
                  }
                  label="📈 Sertakan Analytics Detail"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={reportConfig.includeRecommendations}
                      onChange={(e) => setReportConfig(prev => ({ 
                        ...prev, 
                        includeRecommendations: e.target.checked 
                      }))}
                    />
                  }
                  label="💡 Sertakan Rekomendasi"
                />
              </Box>

              {/* Data Summary */}
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  📊 Data yang akan dimasukkan:
                </Typography>
                <Typography variant="body2">
                  • Total Karyawan: {data.length}<br/>
                  • Periode: {reportConfig.dateRange || 'Sesuai filter aktif'}<br/>
                  • Template: {REPORT_TEMPLATES[reportConfig.template].name}
                </Typography>
              </Alert>
            </Paper>
          </Grid>

          {/* Section Selection */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                📑 Pilih Sections yang Disertakan
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(AVAILABLE_SECTIONS).map(([key, label]) => (
                  <Grid item xs={12} sm={6} md={4} key={key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reportConfig.sections.includes(key)}
                          onChange={() => handleSectionToggle(key)}
                          color="primary"
                        />
                      }
                      label={label}
                      sx={{
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {reportConfig.sections.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    📋 Sections Terpilih:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {reportConfig.sections.map((section) => (
                      <Chip
                        key={section}
                        label={AVAILABLE_SECTIONS[section as keyof typeof AVAILABLE_SECTIONS]}
                        onDelete={() => handleSectionToggle(section)}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: '12px', backgroundColor: 'rgba(124, 77, 255, 0.05)' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                👁️ Preview Laporan
              </Typography>
              
              <Box sx={{ 
                border: '2px dashed', 
                borderColor: 'primary.main', 
                borderRadius: '8px', 
                p: 3,
                backgroundColor: 'background.paper'
              }}>
                <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
                  {reportConfig.customTitle || `${REPORT_TEMPLATES[reportConfig.template].name}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                  Generated on {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric'
                  })}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  📋 Contents akan mencakup:
                </Typography>
                
                <List dense>
                  {reportConfig.sections.map((section, index) => (
                    <ListItem key={section}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography variant="body2" color="primary.main" fontWeight="bold">
                          {index + 1}.
                        </Typography>
                      </ListItemIcon>
                      <ListItemText 
                        primary={AVAILABLE_SECTIONS[section as keyof typeof AVAILABLE_SECTIONS]}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                  
                  {reportConfig.includeCharts && (
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <i className="tabler-chart-bar text-primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="📊 Charts & Visualisasi" 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  )}
                  
                  {reportConfig.includeRecommendations && (
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <i className="tabler-bulb text-primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="💡 Rekomendasi & Action Items" 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Progress Indicator */}
        {isGenerating && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              🔄 Sedang generate PDF report...
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: '8px' }}
        >
          ❌ Batal
        </Button>
        
        <Button
          onClick={generatePDFReport}
          variant="contained"
          disabled={isGenerating || reportConfig.sections.length === 0}
          startIcon={isGenerating ? undefined : <i className="tabler-download" />}
          sx={{
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c4dff, #4338ca)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6c42e8, #3730a3)'
            }
          }}
        >
          {isGenerating ? '🔄 Generating...' : '📄 Generate PDF Report'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProfessionalReportTemplate
