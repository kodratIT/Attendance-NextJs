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
import CircularProgress from '@mui/material/CircularProgress'

import { createColumnHelper, getCoreRowModel, getPaginationRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import '@/styles/table-hover.css'

export type RequestRow = {
  id: string
  employeeId: string
  employeeName?: string
  employeeAvatar?: string | null
  employeeDepartment?: string | null
  employeeEmail?: string
  type: 'LUPA_ABSEN' | 'KOREKSI_JAM'
  subtype: 'CHECKIN' | 'CHECKOUT' | 'BOTH' | null
  date: string
  requested_time_in?: string | null
  requested_time_out?: string | null
  reason: string
  status: 'SUBMITTED' | 'NEEDS_REVISION' | 'APPROVED' | 'REJECTED' | 'CANCELED'
}

const columnHelper = createColumnHelper<RequestRow>()

const getTypeLabel = (type: string) => {
  switch(type) {
    case 'LUPA_ABSEN': return '🙈 Lupa Absen'
    case 'KOREKSI_JAM': return '⏰ Koreksi Jam'
    default: return type
  }
}

const getSubtypeLabel = (subtype: string | null) => {
  if (!subtype) return '-'
  switch(subtype) {
    case 'CHECKIN': return '📥 Masuk'
    case 'CHECKOUT': return '📤 Pulang'
    case 'BOTH': return '🔄 Keduanya'
    default: return subtype
  }
}

const getStatusChip = (status: string) => {
  const statusConfig = {
    'SUBMITTED': { label: '⏳ Nunggu Approve', color: 'warning' as const },
    'APPROVED': { label: '✅ Udah Disetujui', color: 'success' as const },
    'REJECTED': { label: '❌ Ditolak', color: 'error' as const },
    'NEEDS_REVISION': { label: '📝 Perlu Revisi', color: 'info' as const },
    'CANCELED': { label: '🚫 Dibatalkan', color: 'default' as const }
  }
  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'default' as const }
  return <Chip size="small" label={config.label} color={config.color} sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
}

const columns: ColumnDef<RequestRow, any>[] = [
  columnHelper.accessor('date', { header: '📅 Tanggal', cell: info => info.getValue() }),
  columnHelper.accessor('employeeName', { header: '👤 Nama Karyawan', cell: info => info.getValue() || info.row.original.employeeId }),
  columnHelper.accessor('employeeDepartment', { header: '🏢 Departemen', cell: info => info.getValue() || '-' }),
  columnHelper.accessor('type', { header: '📋 Tipe Request', cell: info => getTypeLabel(info.getValue()) }),
  columnHelper.accessor('subtype', { header: '🔖 Detail', cell: info => getSubtypeLabel(info.getValue()) }),
  columnHelper.accessor('requested_time_in', { header: '🕐 Jam Masuk', cell: info => info.getValue() || '-' }),
  columnHelper.accessor('requested_time_out', { header: '🕕 Jam Pulang', cell: info => info.getValue() || '-' }),
  columnHelper.accessor('status', { header: '📊 Status', cell: info => getStatusChip(info.getValue()) }),
]

export default function RequestsView() {
  const api = process.env.NEXT_PUBLIC_API_URL || ''
  const [data, setData] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)

  // filters
  const [status, setStatus] = useState<'ALL' | RequestRow['status']>('SUBMITTED')
  const [type, setType] = useState<'ALL' | RequestRow['type']>('ALL')
  const [employeeId, setEmployeeId] = useState('')

  const [toast, setToast] = useState<{open:boolean;msg:string;sev:'success'|'error'|'info'}>({open:false,msg:'',sev:'success'})

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null) // 'APPROVE', 'REJECT', 'NEEDS_REVISION'

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: string[] = []
      if (status !== 'ALL') params.push(`status=${status}`)
      if (type !== 'ALL') params.push(`type=${type}`)
      if (employeeId.trim()) params.push(`employeeId=${encodeURIComponent(employeeId.trim())}`)
      const qs = params.length ? `?${params.join('&')}` : ''
      const res = await axios.get(`${api}/api/requests${qs}`)
      setData(res.data?.data || [])
    } catch (e:any) {
      setToast({open:true, msg: e?.response?.data?.message || 'Gagal memuat data', sev:'error'})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchData() 
  }, [status, type]) // fetchData is stable since it doesn't use any dependencies

  const table = useReactTable({
    data,
    columns: [
      ...columns,
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Detail">
              <IconButton size="small" onClick={() => openDetail(row.original)}><i className="tabler-eye" /></IconButton>
            </Tooltip>
            {row.original.status === 'SUBMITTED' && (
              <Tooltip title="Batalkan">
                <IconButton size="small" onClick={() => cancelOwn(row.original)}><i className="tabler-x" /></IconButton>
              </Tooltip>
            )}
          </Stack>
        )
      })
    ],
    state: {},
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: {
      fuzzy: (row, columnId, value) => String(row.getValue(columnId))
        .toLowerCase()
        .includes(String(value).toLowerCase())
    }
  })

  const openDetail = async (row: RequestRow) => {
    try {
      const res = await axios.get(`${api}/api/requests/${row.id}/context`)
      setDetail(res.data?.data)
      setNote('')
      setDetailOpen(true)
    } catch (e:any) {
      setToast({open:true, msg: e?.response?.data?.message || 'Gagal memuat detail', sev:'error'})
    }
  }

  const act = async (action: 'APPROVE'|'REJECT'|'NEEDS_REVISION') => {
    if (!detail?.request?.id || actionLoading) return
    
    setActionLoading(action)
    try {
      await axios.patch(`${api}/api/requests/${detail.request.id}`, { action, reviewerNote: note })
      setDetailOpen(false)
      const messages = {
        'APPROVE': '✨ Yeay! Request berhasil disetujui!',
        'REJECT': '😔 Request ditolak dengan alasan yang jelas',
        'NEEDS_REVISION': '📝 Request perlu diperbaiki dulu ya'
      }
      setToast({open:true, msg: messages[action], sev:'success'})
      await fetchData()
    } catch (e:any) {
      setToast({open:true, msg: e?.response?.data?.message || 'Wah, ada error nih! Coba lagi ya 😅', sev:'error'})
    } finally {
      setActionLoading(null)
    }
  }

  const cancelOwn = async (row: RequestRow) => {
    try {
      await axios.patch(`${api}/api/requests/${row.id}`, { action:'CANCEL' })
      setToast({open:true, msg:'Dibatalkan', sev:'success'})
      await fetchData()
    } catch (e:any) {
      setToast({open:true, msg: e?.response?.data?.message || 'Gagal membatalkan', sev:'error'})
    }
  }

  return (
    <>
      <Card className="mb-4" sx={{ 
        boxShadow: (theme) => theme.palette.mode === 'dark' 
          ? '0 4px 12px rgba(0,0,0,0.3)' 
          : '0 4px 12px rgba(0,0,0,0.1)', 
        borderRadius: 2,
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
      }}>
        <CardHeader 
          title="🏠 Dashboard Request" 
          subheader="Kelola semua permohonan absensi disini"
          titleTypographyProps={{ variant: 'h5', fontWeight: 'bold', color: 'primary.main' }}
          subheaderTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
          action={(
          <Stack direction={{xs:'column', sm:'row'}} spacing={2} alignItems="center">
            <FormControl size="small" sx={{minWidth:180}}>
              <InputLabel>🔍 Filter Status</InputLabel>
              <Select label="🔍 Filter Status" value={status} onChange={e => setStatus(e.target.value as any)}>
                <MenuItem value="ALL">🌟 Semua Status</MenuItem>
                <MenuItem value="SUBMITTED">⏳ Nunggu Approve</MenuItem>
                <MenuItem value="NEEDS_REVISION">📝 Perlu Revisi</MenuItem>
                <MenuItem value="APPROVED">✅ Udah Disetujui</MenuItem>
                <MenuItem value="REJECTED">❌ Ditolak</MenuItem>
                <MenuItem value="CANCELED">🚫 Dibatalkan</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{minWidth:180}}>
              <InputLabel>📋 Tipe Request</InputLabel>
              <Select label="📋 Tipe Request" value={type} onChange={e => setType(e.target.value as any)}>
                <MenuItem value="ALL">🌟 Semua Tipe</MenuItem>
                <MenuItem value="LUPA_ABSEN">🙈 Lupa Absen</MenuItem>
                <MenuItem value="KOREKSI_JAM">⏰ Koreksi Jam</MenuItem>
              </Select>
            </FormControl>
            <CustomTextField 
              size="small" 
              label="🔎 Cari Employee ID" 
              value={employeeId} 
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="Ketik ID karyawan..."
              sx={{ minWidth: 180 }}
            />
            <Button 
              variant="contained" 
              onClick={fetchData}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                fontWeight: 'bold',
                px: 3
              }}
            >
              🚀 Cari
            </Button>
          </Stack>
        )} />
        <CardContent>
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
                  <tr><td colSpan={columns.length+1}>Memuat...</td></tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr><td colSpan={columns.length+1}>Tidak ada data</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      className="table-row-hover transition-colors duration-200 cursor-pointer"
                      style={{
                        '--hover-bg-light': 'rgba(249, 250, 251, 0.8)',
                        '--hover-bg-dark': 'rgba(55, 65, 81, 0.4)'
                      } as any}
                    >
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
            rowCount={data.length}
            onPageChange={(_, page) => table.setPageIndex(page)}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>

      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.12)',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1.3rem'
        }}>
          📋 Detail Request Karyawan
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {detail && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Card sx={{ 
                p: 2, 
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(59, 130, 246, 0.1)' 
                  : '#f8f9ff', 
                border: (theme) => theme.palette.mode === 'dark' 
                  ? '1px solid rgba(59, 130, 246, 0.2)' 
                  : '1px solid #e3f2fd',
                borderRadius: 2
              }}>
                <Stack spacing={2}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <b>Nama Karyawan:</b> 
                    <span className="font-medium" style={{ color: '#3B82F6' }}>{detail?.user?.name || detail?.request?.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <b>Tanggal Request:</b> 
                    <span className="font-medium">{detail?.request?.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <b>Tipe Request:</b> 
                    <span className="font-medium">{getTypeLabel(detail?.request?.type)}</span>
                    {detail?.request?.subtype && (
                      <span className="text-sm px-2 py-1 rounded-full" style={{ 
                        backgroundColor: '#3B82F6', 
                        color: 'white',
                        fontSize: '0.75rem'
                      }}>
                        {getSubtypeLabel(detail?.request?.subtype)}
                      </span>
                    )}
                  </div>
                </Stack>
              </Card>

              <Card sx={{ 
                p: 2, 
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 152, 0, 0.1)' 
                  : '#fff8f0', 
                border: (theme) => theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 152, 0, 0.2)' 
                  : '1px solid #ffe0b2',
                borderRadius: 2
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⏰</span>
                  <b>Jam yang Diminta:</b>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🕐</span>
                    <span className="text-sm" style={{ opacity: 0.7 }}>Jam Masuk:</span>
                    <span className="font-mono font-medium" style={{ color: '#10B981' }}>
                      {detail?.request?.requested_time_in || '❌ Tidak ada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🕕</span>
                    <span className="text-sm" style={{ opacity: 0.7 }}>Jam Pulang:</span>
                    <span className="font-mono font-medium" style={{ color: '#F59E0B' }}>
                      {detail?.request?.requested_time_out || '❌ Tidak ada'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card sx={{ 
                p: 2, 
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : '#f0f8f0', 
                border: (theme) => theme.palette.mode === 'dark' 
                  ? '1px solid rgba(34, 197, 94, 0.2)' 
                  : '1px solid #c8e6c9',
                borderRadius: 2
              }}>
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-1">💬</span>
                  <div>
                    <b>Alasan Request:</b>
                    <p className="mt-1 leading-relaxed" style={{ opacity: 0.8 }}>{detail?.request?.reason}</p>
                  </div>
                </div>
              </Card>

              {(detail?.request?.attachments || []).length > 0 && (
                <Card sx={{ 
                  p: 2, 
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(107, 114, 128, 0.1)' 
                    : '#fafafa', 
                  border: (theme) => theme.palette.mode === 'dark' 
                    ? '1px solid rgba(107, 114, 128, 0.2)' 
                    : '1px solid #e0e0e0',
                  borderRadius: 2
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📎</span>
                    <b>Lampiran Bukti:</b>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(detail?.request?.attachments || []).map((url: string, idx: number) => (
                      <Button
                        key={idx}
                        variant="outlined"
                        size="small"
                        startIcon={<i className="tabler-file" />}
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ borderRadius: 2 }}
                      >
                        Lampiran {idx+1}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}

              <TextField 
                fullWidth 
                label="📝 Kasih Catatan (Optional)" 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                multiline 
                rows={3}
                placeholder="Tulis catatan untuk karyawan disini..."
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1, justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={() => act('NEEDS_REVISION')}
            disabled={!!actionLoading}
            startIcon={
              actionLoading === 'NEEDS_REVISION' ? 
              <CircularProgress size={16} /> : 
              <span>📝</span>
            }
            sx={{ borderRadius: 2, minWidth: 140 }}
          >
            {actionLoading === 'NEEDS_REVISION' ? 'Processing...' : 'Perlu Revisi'}
          </Button>
          <Button 
            color="error" 
            variant="outlined" 
            onClick={() => act('REJECT')}
            disabled={!!actionLoading}
            startIcon={
              actionLoading === 'REJECT' ? 
              <CircularProgress size={16} /> : 
              <span>❌</span>
            }
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {actionLoading === 'REJECT' ? 'Rejecting...' : 'Tolak'}
          </Button>
          <Button 
            color="primary" 
            variant="contained" 
            onClick={() => act('APPROVE')}
            disabled={!!actionLoading}
            startIcon={
              actionLoading === 'APPROVE' ? 
              <CircularProgress size={16} sx={{ color: 'white' }} /> : 
              <span>✅</span>
            }
            sx={{ 
              borderRadius: 2, 
              minWidth: 120,
              background: actionLoading === 'APPROVE' ? '#666' : 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
              fontWeight: 'bold'
            }}
          >
            {actionLoading === 'APPROVE' ? 'Approving...' : 'Setujui!'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast(v => ({...v, open:false}))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          onClose={() => setToast(v => ({...v, open:false}))} 
          severity={toast.sev} 
          variant="filled" 
          sx={{ 
            width: '100%',
            minWidth: '300px',
            borderRadius: 2,
            fontWeight: 500,
            fontSize: '0.875rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  )
}
