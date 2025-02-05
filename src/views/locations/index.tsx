'use client';
// React Imports
import { useState, useEffect, useMemo } from 'react';
// MUI Imports
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import type { TextFieldProps } from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
// Third-party Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';
import type { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
// Type Imports
import type { LocationRowType } from '@/types/locationTypes'; // Sesuaikan dengan tipe data locations
// Component Imports
import CustomTextField from '@core/components/mui/TextField';
import TablePaginationComponent from '@components/TablePaginationComponent';
import LocationDialog from '@/components/dialogs/location-dialog';
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick';
// Style Imports
import tableStyles from '@core/styles/table.module.css';

const Locations = ({ locationsData }: { locationsData?: LocationRowType[] }) => {
  // States
  const [data, setData] = useState<LocationRowType[]>(locationsData || []); // Mulai dengan props atau data kosong
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(false); // Loading state untuk fetch data

  // Fetch Data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/locations`, {
        headers: {
          'Cache-Control': 'no-store', // Hindari caching agar selalu mendapatkan data terbaru
        },
      });
      setData(res.data);
    } catch (error) {
      console.error(error);
      alert('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  // Ambil data saat komponen pertama kali di-mount
  useEffect(() => {
    if (!locationsData) {
      fetchData(); // Fetch data hanya jika props kosong
    } else {
      setData(locationsData); // Gunakan props langsung
    }
  }, [locationsData]);

  // Columns definition helper
  const columnHelper = createColumnHelper<LocationRowType>();

  // Columns definition
  const columns = useMemo<ColumnDef<LocationRowType, any>[]>(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => <Typography color="text.primary">{row.original.name}</Typography>,
    }),
    columnHelper.accessor('assignedTo', {
      header: 'Assigned To',
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        if (!assignedTo || assignedTo.length === 0) {
          return <Typography color="text.secondary">-</Typography>;
        }
        return (
          <div className="flex flex-wrap gap-2">
            {assignedTo.map((item, index) => (
              <Chip
                key={index}
                variant="tonal"
                label={item.name}
                color="primary"
                size="small"
                className="capitalize mie-4"
              />
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor('longitude', {
      header: 'Longitude',
      cell: ({ row }) => <Typography>{row.original.longitude}</Typography>,
    }),
    columnHelper.accessor('latitude', {
      header: 'Latitude',
      cell: ({ row }) => <Typography>{row.original.latitude}</Typography>,
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
            dialog={LocationDialog}
            dialogProps={{
              state: 'EDIT',
              data: row.original as LocationRowType,
              refreshData: fetchData, // Refresh data after edit
            }}
          />
          {/* Tombol Delete */}
          <OpenDialogOnElementClick
            element={IconButton}
            elementProps={{
              children: <i className="tabler-trash text-red-500" />,
            }}
            dialog={LocationDialog}
            dialogProps={{
              state: 'DELETE',
              data: row.original as LocationRowType,
              refreshData: fetchData, // Refresh data after delete
            }}
          />
        </div>
      ),
      enableSorting: false,
    }),
  ], []);

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
  });

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
            placeholder="Search Locations"
            className="is-full sm:is-auto"
          />
          <OpenDialogOnElementClick
            element={Button}
            elementProps={{
              variant: 'contained',
              startIcon: <i className="tabler-plus" />,
              children: 'Add Location',
            }}
            dialog={LocationDialog}
            dialogProps={{
              state: 'ADD',
              data: null,
              refreshData: fetchData, // Refresh data after add
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
  );
};

export default Locations;