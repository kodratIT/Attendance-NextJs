'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import { CircularProgress } from '@mui/material'
import RequestDialog from '@/components/dialogs/request-attendance-dialog'
// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
// import TableFilters from './TableFilters'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick';

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import axios from 'axios'
import {database} from "@/libs/firebase/firebase";
import { ref, onValue, set } from "firebase/database";

// //gagal socket Io
// import io from "socket.io-client";

// const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/socket`, {
//   transports: ["websocket"], // 🔥 Paksa gunakan WebSocket, bukan polling
// });
declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}
type Colors = {
  [key: string]: ThemeColor
}

const colors: Colors = {
  Late: 'warning',
  OnTime: 'success',
  present: 'success',
  'restricted-user': 'error'
}

type UsersTypeWithAction = AttendanceRowType & {
  action?: string
}

type UserRoleType = {
  [key: string]: { icon: string; color: string }
}

type UserStatusType = {
  [key: string]: ThemeColor
}

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}


const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary'
}

// Column Definitions
const columnHelper = createColumnHelper<UsersTypeWithAction>()

const RealtimeTable = ({ tableData }: { tableData?: AttendanceRowType[] }) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(...[tableData])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading,setLoading] = useState<boolean>(false)

  const getColorByLateBy = (lateBy: number) => (lateBy === 0 ? "OnTime" : "Late");

  const fetchData = async () => {
    try {
      setLoading(true);

      let fromDate = new Date();

      // Menyesuaikan zona waktu ke UTC+7
      fromDate.setHours(fromDate.getHours() + 7);

      const formattedToDate = fromDate.getUTCFullYear() + '-' + 
                              String(fromDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                              String(fromDate.getUTCDate()).padStart(2, '0');
                              
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?fromDate=${formattedToDate}&toDate=${formattedToDate}`
      );

      
      // ✅ Reset trigger setelah data diambil
      set(ref(database, "triggers/attendanceUpdate"), false);
      setData(res.data)

      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching filtered data:", error);
      setData([]);
    }
  };
  const realTime = async () => {
    try {
      let fromDate = new Date();

      // Menyesuaikan zona waktu ke UTC+7
      fromDate.setHours(fromDate.getHours() + 7);

      const formattedToDate = fromDate.getUTCFullYear() + '-' + 
                              String(fromDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
                              String(fromDate.getUTCDate()).padStart(2, '0');
                              
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?fromDate=${formattedToDate}&toDate=${formattedToDate}`
      );

      
      // ✅ Reset trigger setelah data diambil
      set(ref(database, "triggers/attendanceUpdate"), false);
      setData(res.data)
    } catch (error) {
      console.error("❌ Error fetching filtered data:", error);
      setData([]);
    }
  };


  // const socket = io(`${process.env.NEXT_PUBLIC_API_URL}`);

//socket io gagal
// useEffect(() => {
//   // Dengarkan event WebSocket untuk update data secara realtime
//   socket.on("attendanceUpdate", () => {
//     console.log("📢 Data berubah! Fetching new attendance data...");
//     fetchData(); // Panggil ulang API untuk mendapatkan data terbaru
//   });

//   return () => {
//     socket.off("attendanceUpdate"); // Hapus listener saat komponen di-unmount
//   };
// }, []);


  useEffect(() => {
    fetchData(); // 🔥 Ambil data pertama kali saat halaman dimuat

    // 🔥 Dengarkan perubahan di Realtime Database
    const triggerRef = ref(database, "triggers/attendanceUpdate");

    onValue(triggerRef, (snapshot) => {
      if (snapshot.val() === true) {
        console.log("📢 Data berubah! Fetching new attendance data...");
        realTime(); // Panggil ulang API untuk mendapatkan data terbaru
      }
    });

    return () => {
      set(triggerRef, false); // Reset trigger saat komponen unmount
    };
  }, []);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);
  
  // Hooks
  const { lang: locale } = useParams()

  const columns = useMemo<ColumnDef<UsersTypeWithAction, any>[]>(() => [
    columnHelper.accessor('name', {
      header: 'Nama',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          {getAvatar({ avatar: row.original.avatar, name: row.original.name })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.name}
            </Typography>
            <Typography variant='body2'>{row.original.name}</Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('shifts', {
      header: 'Shift',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Typography className='capitalize' color='text.primary'>
            {row.original.shifts}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('areas', {
      header: 'Cabang',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Typography className='capitalize' color='text.primary'>
            {row.original.areas}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('checkIn', {
      header: 'Jam Masuk',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.checkIn.time}
        </Typography>
      )
    }),
    columnHelper.accessor('checkOut', {
      header: 'Jam Keluar',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.checkOut.time}
        </Typography>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Chip
            variant="tonal"
            label={row.original.status} // Status tetap ditampilkan
            color={colors[getColorByLateBy(row.original.lateBy)]} // Warna berdasarkan nilai lateBy
            size="small"
            className="capitalize mie-4"
          />
        </div>
      )
    })      
  ], [data, filteredData]);
  

  const table = useReactTable({
    data: filteredData as AttendanceRowType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true, //enable row selection for all rows
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = (params: Pick<AttendanceRowType, 'avatar' | 'name'>) => {
    const { avatar, name } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(name as string)}</CustomAvatar>
    }
  }

  return (
    <>
      <Card>
        {/* <TableFilters setLoading={setLoading} setData={setFilteredData} tableData={tableData} /> */}
        
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
        <div className="flex items-center gap-2">

          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
          {/* Tombol Refresh dengan Loading */}
          <IconButton onClick={fetchData} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <i className="tabler-refresh text-blue-500" />}
          </IconButton>
          </div>
          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Pencarian Karyawan'
              className='is-full sm:is-auto'
            />
            {/* <Button
              color='secondary'
              variant='tonal'
              startIcon={<i className='tabler-upload' />}
              className='is-full sm:is-auto'
            >
              Export
            </Button> */}
            
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                          </div>
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {/* Table with Loading Indicator */}
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="text-center py-10">
                    <CircularProgress />
                  </td>
                </tr>
              </tbody>
            ) : table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => (
                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
        />
      </Card>
    </>
  )
}

export default RealtimeTable