'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Stack from '@mui/material/Stack'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import { createColumnHelper, getCoreRowModel, getPaginationRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import type { OvertimeRequest, OvertimeStatus, OvertimeAction, OvertimeActionPayload } from '@/types/overtimeTypes'

// Transform OvertimeRequest to table row format
export interface OvertimeTableRow {
  id: string
  date: string
  employee: {
    id: string
    name: string
    avatar?: string
    department?: string
  }
  timeRange: string
  duration: string
  durationHours: number
  reason: string
  status: OvertimeStatus
  crossMidnight: boolean
  approver?: {
    id: string
    name: string
    approvedAt?: number
    note?: string
  }
  createdAt?: any
  updatedAt?: any
  rawData: OvertimeRequest // Keep reference to original data
}

const columnHelper = createColumnHelper<OvertimeTableRow>()

// Helper functions
const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const formatDuration = (minutes: number) => {
  if (!minutes) return '0h 0m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
}

const transformToTableData = (data: OvertimeRequest[]): OvertimeTableRow[] => {
  return data.map(item => ({
    id: item.id,
    date: item.date,
    employee: {
      id: item.userId || item.uid,
      name: item.userName || item.userId || 'Unknown',
      avatar: item.userAvatar,
      department: item.userDepartment
    },
    timeRange: item.startAt && item.endAt 
      ? `${formatTime(item.startAt)} - ${formatTime(item.endAt)}` 
      : item.startAt 
        ? `${formatTime(item.startAt)} - Ongoing` 
        : '-',
    duration: formatDuration(item.durationMinutes || 0),
    durationHours: (item.durationMinutes || 0) / 60,
    reason: item.reason || '-',
    status: item.status,
    crossMidnight: item.crossMidnight || false,
    approver: item.approverId ? {
      id: item.approverId,
      name: item.approverName || 'Admin',
      approvedAt: item.approvedAt || undefined,
      note: item.approverNote || undefined
    } : undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    rawData: item
  }))
}

const getStatusColor = (status: OvertimeStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'submitted': return 'warning'
    case 'approved': return 'success' 
    case 'rejected': return 'error'
    case 'revision_requested': return 'info'
    case 'cancelled': return 'default'
    case 'draft': return 'secondary'
    default: return 'default'
  }
}

const getStatusLabel = (status: OvertimeStatus): string => {
  switch (status) {
    case 'submitted': return 'Diajukan'
    case 'approved': return 'Disetujui' 
    case 'rejected': return 'Ditolak'
    case 'revision_requested': return 'Perlu Revisi'
    case 'cancelled': return 'Dibatalkan'
    case 'draft': return 'Draft'
    default: return status
  }
}

const columns: ColumnDef<OvertimeTableRow, any>[] = [
  columnHelper.accessor('date', { 
    header: 'Tanggal', 
    cell: info => {
      const value = info.getValue()
      return value ? new Date(value).toLocaleDateString('id-ID') : '-'
    }
  }),
  columnHelper.accessor('employee', { 
    header: 'Karyawan', 
    cell: info => {
      const employee = info.getValue()
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar 
            src={employee.avatar} 
            sx={{ width: 32, height: 32 }}
            alt={employee.name}
          >
            {employee.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {employee.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {employee.id}
            </Typography>
          </Box>
        </Box>
      )
    }
  }),
  columnHelper.accessor('timeRange', { header: 'Waktu', cell: info => info.getValue() }),
  columnHelper.accessor('duration', { 
    header: 'Durasi', 
    cell: info => {
      const row = info.row.original
      return (
        <Box>
          <Typography variant="body2">{info.getValue()}</Typography>
          {row.crossMidnight && (
            <Chip size="small" label="Lintas Hari" color="info" sx={{ mt: 0.5, fontSize: '0.7rem' }} />
          )}
        </Box>
      )
    }
  }),
  columnHelper.accessor('reason', { 
    header: 'Alasan', 
    cell: info => {
      const value = info.getValue()
      return (
        <Tooltip title={value} placement="top">
          <Typography 
            variant="body2" 
            sx={{ 
              maxWidth: 200, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}
          >
            {value}
          </Typography>
        </Tooltip>
      )
    }
  }),
  columnHelper.accessor('status', { 
    header: 'Status', 
    cell: info => {
      const status = info.getValue()
      return (
        <Chip 
          size="small" 
          label={getStatusLabel(status)} 
          color={getStatusColor(status)}
        />
      )
    }
  }),
]

interface OvertimeViewProps {
  tableData?: OvertimeRequest[]
  onRefresh?: () => Promise<void>
}

export default function OvertimeView({ tableData = [], onRefresh }: OvertimeViewProps) {
  const api = process.env.NEXT_PUBLIC_API_URL || ''
  const [data, setData] = useState<OvertimeTableRow[]>([])
  const [loading, setLoading] = useState(false)
  
  // CSS untuk spinning animation
  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
  
  // Add styles to document head jika belum ada
  useEffect(() => {
    if (!document.getElementById('spinner-styles')) {
      const style = document.createElement('style')
      style.id = 'spinner-styles'
      style.textContent = spinKeyframes
      document.head.appendChild(style)
    }
  }, [])

  // Filters
  const [status, setStatus] = useState<'all' | OvertimeStatus>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  const [toast, setToast] = useState<{open:boolean;msg:string;sev:'success'|'error'|'info'}>({open:false,msg:'',sev:'success'})

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<OvertimeTableRow | null>(null)
  const [approverNote, setApproverNote] = useState('')
  
  // Loading states untuk setiap row action
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({})

  // Transform tableData to table rows
  useEffect(() => {
    if (tableData) {
      setData(transformToTableData(tableData))
    }
  }, [tableData])

  const fetchData = async () => {
    if (onRefresh) {
      setLoading(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Error refreshing data:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    let filtered = data

    if (status !== 'all') {
      filtered = filtered.filter(item => item.status === status)
    }

    if (dateFrom) {
      filtered = filtered.filter(item => item.date >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter(item => item.date <= dateTo)
    }

    if (employeeId.trim()) {
      const searchTerm = employeeId.toLowerCase()
      filtered = filtered.filter(item => 
        item.employee.id.toLowerCase().includes(searchTerm) ||
        item.employee.name.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  }, [data, status, dateFrom, dateTo, employeeId])

  const table = useReactTable({
    data: filteredData,
    columns: [
      ...columns,
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Detail">
              <IconButton size="small" onClick={() => openDetail(row.original)}>
                <i className="tabler-eye" />
              </IconButton>
            </Tooltip>
            {row.original.status === 'submitted' && (
              <>
                <Tooltip title={actionLoading[`${row.original.id}-approve`] ? 'Sedang memproses...' : 'Setujui'}>
                  <IconButton 
                    size="small" 
                    color="success"
                    disabled={actionLoading[`${row.original.id}-approve`] || Object.keys(actionLoading).some(key => key.startsWith(row.original.id))}
                    onClick={() => handleAction(row.original, 'approve')}
                  >
                    {actionLoading[`${row.original.id}-approve`] ? (
                      <i className="tabler-loader-2" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <i className="tabler-check" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title={actionLoading[`${row.original.id}-reject`] ? 'Sedang memproses...' : 'Tolak'}>
                  <IconButton 
                    size="small" 
                    color="error"
                    disabled={actionLoading[`${row.original.id}-reject`] || Object.keys(actionLoading).some(key => key.startsWith(row.original.id))}
                    onClick={() => openApprovalDialog(row.original, 'reject')}
                  >
                    {actionLoading[`${row.original.id}-reject`] ? (
                      <i className="tabler-loader-2" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <i className="tabler-x" />
                    )}
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        )
      })
    ],
    state: {},
    filterFns: {
      fuzzy: (row, columnId, value) => String(row.getValue(columnId))
        .toLowerCase()
        .includes(String(value).toLowerCase())
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const openDetail = (row: OvertimeTableRow) => {
    setDetail(row)
    setApproverNote(row.approver?.note || '')
    setDetailOpen(true)
  }

  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    row: OvertimeTableRow | null
    action: OvertimeAction | null
  }>({ open: false, row: null, action: null })

  const openApprovalDialog = (row: OvertimeTableRow, action: OvertimeAction) => {
    setActionDialog({ open: true, row, action })
    setApproverNote('')
  }

  const handleAction = async (row: OvertimeTableRow, action: OvertimeAction, note?: string) => {
    if (!row?.id) return
    
    // Set loading state untuk row ini
    const loadingKey = `${row.id}-${action}`
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }))
    
    try {
      const payload: OvertimeActionPayload = {
        action,
        approverId: 'dashboard-user',
        approverName: 'Dashboard Admin',
        approverNote: note || undefined
      }

      await axios.patch(`${api}/api/overtime/${row.id}`, payload)
      
      const actionLabels = {
        approve: 'Disetujui',
        reject: 'Ditolak',
        revision_requested: 'Perlu Revisi',
        cancel: 'Dibatalkan'
      }
      
      setToast({
        open: true, 
        msg: `Pengajuan lembur ${actionLabels[action]}`, 
        sev: 'success'
      })
      
      setActionDialog({ open: false, row: null, action: null })
      await fetchData()
    } catch (e: any) {
      setToast({
        open: true, 
        msg: e?.response?.data?.message || 'Aksi gagal', 
        sev: 'error'
      })
    } finally {
      // Clear loading state
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState[loadingKey]
        return newState
      })
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader 
          title={(
            <Typography variant="h5" component="h1" fontWeight="bold">
              🕰️ Manajemen Lembur
            </Typography>
          )}
        />
        <CardContent>
          {/* Filter Section */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              🔍 Filter & Pencarian
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select label="Status" value={status} onChange={e => setStatus(e.target.value as any)}>
                    {['all','submitted','approved','rejected','revision_requested','cancelled','draft'].map(s => (
                      <MenuItem key={s} value={s as any}>
                        {s === 'all' ? 'Semua' : getStatusLabel(s as OvertimeStatus)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2.5}>
                <CustomTextField 
                  fullWidth
                  size="small" 
                  label="Tanggal Dari" 
                  type="date"
                  value={dateFrom} 
                  onChange={e => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2.5}>
                <CustomTextField 
                  fullWidth
                  size="small" 
                  label="Tanggal Sampai" 
                  type="date"
                  value={dateTo} 
                  onChange={e => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomTextField 
                  fullWidth
                  size="small" 
                  label="Cari Karyawan" 
                  value={employeeId} 
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="Nama atau ID karyawan..."
                  InputProps={{
                    startAdornment: <i className="tabler-search" style={{ marginRight: 8, color: '#666' }} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <Button 
                  fullWidth
                  variant="contained" 
                  onClick={fetchData} 
                  disabled={loading}
                  startIcon={<i className="tabler-refresh" />}
                  sx={{ height: 40 }}
                >
                  {loading ? 'Memuat...' : 'Refresh'}
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {/* Table Section */}
          <div className="overflow-x-auto">
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="whitespace-nowrap">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={columns.length + 1}>Memuat...</td></tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr><td colSpan={columns.length + 1}>Tidak ada data</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePaginationComponent
            pageIndex={table.getState().pagination?.pageIndex || 0}
            pageSize={table.getState().pagination?.pageSize || 10}
            rowCount={filteredData.length}
            onPageChange={(_, page) => table.setPageIndex(page)}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-clock-hour-4" style={{ fontSize: '1.5rem', color: '#1976d2' }} />
            <Typography variant="h6">Detail Pengajuan Lembur</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detail && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Employee Info */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    👤 Informasi Karyawan
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      src={detail.employee.avatar} 
                      sx={{ width: 48, height: 48 }}
                      alt={detail.employee.name}
                    >
                      {detail.employee.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {detail.employee.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {detail.employee.id}
                      </Typography>
                      {detail.employee.department && (
                        <Typography variant="body2" color="text.secondary">
                          {detail.employee.department}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              {/* Time Info */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    ⏰ Informasi Waktu
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Tanggal:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(detail.date).toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Waktu:</Typography>
                      <Typography variant="body2" fontWeight="medium">{detail.timeRange}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Durasi:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">{detail.duration}</Typography>
                        {detail.crossMidnight && (
                          <Chip size="small" label="Lintas Hari" color="info" />
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
              
              {/* Reason */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    📝 Alasan Lembur
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    p: 2, 
                    bgcolor: 'white', 
                    borderRadius: 1, 
                    border: '1px solid #e0e0e0',
                    minHeight: 60,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {detail.reason || 'Tidak ada alasan yang diberikan'}
                  </Typography>
                </Box>
              </Grid>
              
              {/* Status & Approval Info */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    📊 Status & Persetujuan
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">Status:</Typography>
                      <Chip size="small" label={getStatusLabel(detail.status)} color={getStatusColor(detail.status)} />
                    </Box>
                    
                    {detail.approver && (
                      <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          👨‍💼 Informasi Persetujuan
                        </Typography>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Disetujui oleh:</Typography>
                            <Typography variant="body2" fontWeight="medium">{detail.approver.name}</Typography>
                          </Box>
                          {detail.approver.approvedAt && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">Tanggal:</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {new Date(detail.approver.approvedAt).toLocaleString('id-ID')}
                              </Typography>
                            </Box>
                          )}
                          {detail.approver.note && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>Catatan:</Typography>
                              <Typography variant="body2" sx={{ 
                                p: 1, 
                                bgcolor: 'grey.100', 
                                borderRadius: 1,
                                fontStyle: 'italic'
                              }}>
                                &quot;{detail.approver.note}&quot;
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} startIcon={<i className="tabler-x" />}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, row: null, action: null })}>
        <DialogTitle>
          {actionDialog.action === 'approve' ? 'Setujui' : 'Tolak'} Pengajuan Lembur
        </DialogTitle>
        <DialogContent>
          {actionDialog.row && (
            <div className="space-y-3">
              <div><b>Karyawan:</b> {actionDialog.row.employee.name}</div>
              <div><b>Tanggal:</b> {new Date(actionDialog.row.date).toLocaleDateString('id-ID')}</div>
              <div><b>Durasi:</b> {actionDialog.row.duration}</div>
              <div><b>Alasan:</b> {actionDialog.row.reason}</div>
              
              <TextField 
                fullWidth 
                label="Catatan (opsional)" 
                value={approverNote} 
                onChange={e => setApproverNote(e.target.value)} 
                multiline 
                rows={3}
                placeholder={actionDialog.action === 'approve' ? 'Catatan persetujuan...' : 'Alasan penolakan...'}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActionDialog({ open: false, row: null, action: null })}
            disabled={actionDialog.row ? Object.keys(actionLoading).some(key => key.startsWith(actionDialog.row!.id)) : false}
          >
            Batal
          </Button>
          <Button 
            color={actionDialog.action === 'approve' ? 'primary' : 'error'}
            variant="contained" 
            disabled={actionDialog.row ? actionLoading[`${actionDialog.row.id}-${actionDialog.action}`] : false}
            startIcon={actionDialog.row && actionLoading[`${actionDialog.row.id}-${actionDialog.action}`] ? (
              <i className="tabler-loader-2" style={{ animation: 'spin 1s linear infinite' }} />
            ) : undefined}
            onClick={() => {
              if (actionDialog.row && actionDialog.action) {
                handleAction(actionDialog.row, actionDialog.action, approverNote)
              }
            }}
          >
            {actionDialog.row && actionLoading[`${actionDialog.row.id}-${actionDialog.action}`] ? (
              'Memproses...'
            ) : (
              actionDialog.action === 'approve' ? 'Setujui' : 'Tolak'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(v => ({...v, open:false}))}>
        <Alert onClose={() => setToast(v => ({...v, open:false}))} severity={toast.sev} variant="filled" sx={{ width: '100%' }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  )
}
