'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import type { TextFieldProps } from '@mui/material/TextField'
import type { PermissionRowType } from '@/types/permissionTypes'


// Third-party Imports
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import axios from 'axios';


// Type Imports

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import PermissionDialog from '@components/dialogs/permission-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Column Definitions Helper
const columnHelper = createColumnHelper<PermissionRowType>()

const Permissions = ({ permissionsData }: { permissionsData?: PermissionRowType[] }) => {
  // States
  const [data, setData] = useState<PermissionRowType[]>(permissionsData || []) // Mulai dengan data kosong
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false) // Loading state untuk fetch data

  const fetchData = async () => {

    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions`, {
        headers: {
          'Cache-Control': 'no-store' // Hindari caching agar selalu mendapatkan data terbaru
        }
      });
      
      console.log(res)
      setData(res.data);
    } catch (error) {
      console.error(error);
      alert('Error fetching data.');
    } finally {
      setLoading(false);
    }
  }

  // // Ambil data saat komponen pertama kali di-mount
  // useEffect(() => {
  //   fetchData()
  // }, [])

  // Columns definition
  const columns = useMemo<ColumnDef<PermissionRowType, any>[]>(() => [
    // columnHelper.accessor('name', {
    //   header: 'No',
    //   cell: ({ row }) => <Typography color="text.primary">{row.index + 1}</Typography>,
    // }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => <Typography color="text.primary">{row.original.name}</Typography>,
    }),
    columnHelper.accessor('assignedTo', {
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo
        if (!assignedTo) return null

        return Array.isArray(assignedTo) ? (
          assignedTo.map((item, index) => (
            <Chip key={index} variant="tonal" label={item} color="primary" size="small" className="capitalize mie-4" />
          ))
        ) : (
          <Chip variant="tonal" label={assignedTo} color="primary" size="small" className="capitalize" />
        )
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created Date',
      cell: ({ row }) => <Typography>{row.original.createdAt}</Typography>,
    }),
    columnHelper.accessor('action', {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* Tombol Edit */}
          <OpenDialogOnElementClick
            element={IconButton}
            elementProps={{
              children: <i className="tabler-edit text-blue-500" />,
            }}
            dialog={PermissionDialog}
            dialogProps={{
              state: 'edit',
              data: row.original as PermissionRowType,
              refreshData: fetchData, // Refresh data after edit
            }}
          />

          {/* Tombol Delete */}
          <OpenDialogOnElementClick
            element={IconButton}
            elementProps={{
              children: <i className="tabler-trash text-red-500" />,
            }}
            dialog={PermissionDialog}
            dialogProps={{
              state: 'delete',
              data: row.original as PermissionRowType,
              refreshData: fetchData, // Refresh data after delete
            }}
          />
        </div>
      ),
      enableSorting: false,
    }),
  ], [])


  // React Table instance
  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: (row, columnId, value) => rankItem(row.getValue(columnId), value).passed },
    state: { globalFilter },
    globalFilterFn: (row, columnId, value) => rankItem(row.getValue(columnId), value).passed,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5, // Set default jumlah item per halaman menjadi 5
      },
    },
  })
  

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row items-start sm:items-center justify-between flex-wrap">
        <div className="flex items-center gap-2">
          <Typography>Show</Typography>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="is-[70px]"
          >
            <MenuItem value="5">5</MenuItem>
            <MenuItem value="7">7</MenuItem>
            <MenuItem value="9">9</MenuItem>
          </CustomTextField>

          {/* Tombol Refresh dengan Loading */}
          <IconButton onClick={fetchData} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <i className="tabler-refresh text-blue-500" />}
          </IconButton>
        </div>

        <div className="flex flex-wrap gap-4">
          <CustomTextField
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search Permissions"
            className="is-full sm:is-auto"
          />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={{
                variant: 'contained',
                startIcon: <i className="tabler-plus" />,
                children: 'Add Permission',
              }}
              dialog={PermissionDialog}
              dialogProps={{
                state: 'ADD',
                data: null,
                refreshData: fetchData, 
              }}
            />
        </div>
      </CardContent>

      <div className="overflow-x-auto">
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10">
                  <CircularProgress />
                </td>
              </tr>
            ) : data.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-10">
                  <Typography color="textSecondary">No data available</Typography>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
        />
    </Card>
  )
}

export default Permissions
