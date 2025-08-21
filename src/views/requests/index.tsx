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

import { createColumnHelper, getCoreRowModel, getPaginationRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

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

const columns: ColumnDef<RequestRow, any>[] = [
  columnHelper.accessor('date', { header: 'Tanggal', cell: info => info.getValue() }),
  columnHelper.accessor('employeeName', { header: 'Karyawan', cell: info => info.getValue() || info.row.original.employeeId }),
  columnHelper.accessor('employeeDepartment', { header: 'Departemen', cell: info => info.getValue() || '-' }),
  columnHelper.accessor('type', { header: 'Tipe', cell: info => info.getValue() }),
  columnHelper.accessor('subtype', { header: 'Sub-tipe', cell: info => info.getValue() || '-' }),
  columnHelper.accessor('requested_time_in', { header: 'Time In', cell: info => info.getValue() || '-' }),
  columnHelper.accessor('requested_time_out', { header: 'Time Out', cell: info => info.getValue() || '-' }),
  columnHelper.accessor('status', { header: 'Status', cell: info => <Chip size="small" label={info.getValue()} color={(info.getValue()==='SUBMITTED'?'warning':info.getValue()==='APPROVED'?'success':info.getValue()==='REJECTED'?'error':'default') as any} /> }),
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
    if (!detail?.request?.id) return
    try {
      await axios.patch(`${api}/api/requests/${detail.request.id}`, { action, reviewerNote: note })
      setDetailOpen(false)
      setToast({open:true, msg: action==='APPROVE'?'Disetujui':action==='REJECT'?'Ditolak':'Perlu Revisi', sev:'success'})
      await fetchData()
    } catch (e:any) {
      setToast({open:true, msg: e?.response?.data?.message || 'Aksi gagal', sev:'error'})
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
      <Card className="mb-4">
        <CardHeader title="Permohonan" action={(
          <Stack direction={{xs:'column', sm:'row'}} spacing={2} alignItems="center">
            <FormControl size="small" sx={{minWidth:160}}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={e => setStatus(e.target.value as any)}>
                {['ALL','SUBMITTED','NEEDS_REVISION','APPROVED','REJECTED','CANCELED'].map(s => (
                  <MenuItem key={s} value={s as any}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{minWidth:160}}>
              <InputLabel>Tipe</InputLabel>
              <Select label="Tipe" value={type} onChange={e => setType(e.target.value as any)}>
                {['ALL','LUPA_ABSEN','KOREKSI_JAM'].map(s => (
                  <MenuItem key={s} value={s as any}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <CustomTextField size="small" label="Employee ID" value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
            <Button variant="outlined" onClick={fetchData}>Filter</Button>
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
            rowCount={data.length}
            onPageChange={(_, page) => table.setPageIndex(page)}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth>
        <DialogTitle>Detail Permohonan</DialogTitle>
        <DialogContent>
          {detail && (
            <div className="space-y-3">
              <div><b>Karyawan:</b> {detail?.user?.name || detail?.request?.employeeId}</div>
              <div><b>Tanggal:</b> {detail?.request?.date}</div>
              <div><b>Tipe:</b> {detail?.request?.type}{detail?.request?.subtype ? ` / ${detail.request.subtype}` : ''}</div>
              <div><b>Jam dimohon:</b> In {detail?.request?.requested_time_in || '-'} | Out {detail?.request?.requested_time_out || '-'}</div>
              <div><b>Alasan:</b> {detail?.request?.reason}</div>
              <div className="p-2 border rounded">
                <div className="font-medium mb-1">Lampiran</div>
                <div className="flex flex-wrap gap-2">
                  {(detail?.request?.attachments || []).map((url: string, idx: number) => (
                    <a key={idx} className="text-blue-600 underline" href={url} target="_blank" rel="noreferrer">Lampiran {idx+1}</a>
                  ))}
                </div>
              </div>
              <TextField fullWidth label="Catatan Reviewer" value={note} onChange={e => setNote(e.target.value)} multiline rows={3} />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => act('NEEDS_REVISION')}>Perlu Revisi</Button>
          <Button color="error" variant="outlined" onClick={() => act('REJECT')}>Tolak</Button>
          <Button color="primary" variant="contained" onClick={() => act('APPROVE')}>Setujui</Button>
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
