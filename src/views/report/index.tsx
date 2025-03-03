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
import TableFilters from './TableFilters'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { formatSecondsToTime } from '@/utils/dateUtils'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import axios from 'axios'

import * as XLSX from 'xlsx';

type Colors = {
  [key: string]: ThemeColor
}

export interface CheckDetails {
  time: string;
  faceVerified: boolean;
  location: object;
}

export interface Attendance {
  attendanceId: string;
  userId: string;
  name: string;
  date: string;
  areas: string;
  shifts: string;
  avatar: string;
  checkIn: CheckDetails;
  checkOut: CheckDetails;
  createdAt: string;
  updatedAt: string;
  earlyLeaveBy: number;
  lateBy: number;
  status: string;
  workingHours: number;
}

interface AttendanceMapping {
  [userId: string]: Attendance[];
}

const processAttendanceData = (rawData: Record<string, Attendance[]>): Attendance[] => {
  const processedData: Record<string, Attendance> = {};

  Object.values(rawData).flat().forEach((record) => {
    const { userId, earlyLeaveBy, lateBy, workingHours, ...rest } = record;

    if (!processedData[userId]) {
      processedData[userId] = { ...record };
    } else {
      processedData[userId].earlyLeaveBy += earlyLeaveBy;
      processedData[userId].lateBy += lateBy;
      processedData[userId].workingHours += workingHours;
    }
  });

  return Object.values(processedData);
};

const colors: Colors = {
  Late: 'warning',
  OnTime: 'success',
  present: 'success',
  'restricted-user': 'error'
}

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
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

const ReportTable = ({ tableData }: { tableData?: AttendanceRowType[] }) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(...[tableData])
  const [filteredData, setFilteredData] = useState(data)
  const [excelData, setExcelData] = useState<AttendanceMapping[]>([]);
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading,setLoading] = useState<boolean>(false)
  const [loadingDownload,setLoadingDownload] = useState<boolean>(false)

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/report?fromDate=${formattedToDate}&toDate=${formattedToDate}`
      );

      setExcelData(res.data)

      console.log(excelData)
      setData(res.data)

      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching filtered data:", error);
      setData([]);
    }
  };
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
            {/* <Typography variant='body2'>{row.original.name}</Typography> */}
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
        <Typography className='capitalize' color='text.primary'>
          {row.original.areas}
        </Typography>
      )
    }),
    columnHelper.accessor('earlyLeaveBy', {
      header: 'Pulang Lebih Awal',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {formatSecondsToTime(row.original.earlyLeaveBy)}
        </Typography>
      )
    }),
    columnHelper.accessor('lateBy', {
      header: 'Keterlambatan',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {formatSecondsToTime(row.original.lateBy)}
        </Typography>
      ) 
    }),
    columnHelper.accessor('workingHours', {
      header: 'Jam Kerja',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {formatSecondsToTime(row.original.workingHours)}
        </Typography>
      ) 
    }),
    columnHelper.accessor('action', {
      header: 'Aksi',
      cell: ({ row }) => (
        <div className='flex items-center'>
          {/* <OptionMenu
            iconButtonProps={{ size: 'medium', onClick: (e) => e.stopPropagation() }} // Prevent row click events
            iconClassName='text-textSecondary'
            options={[
              {
                text: 'Unduh Laporan',
                icon: 'tabler-download',
                menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
              }
            ]}
          /> */}
          <IconButton onClick={()=> handleDownloadExcel(row.original.userId)} disabled={loadingDownload}>
                  {loadingDownload ? <CircularProgress size={24} /> : <i className="tabler-download text-blue-500" />}
          </IconButton>

        </div>
      ),    
      enableSorting: false
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

  const handleDownloadExcel = (userId: any) => {
    try {
        // Ensure that excelData is defined and has the key for the provided userId
        if (!excelData) {
            alert("No data found for the selected user.");
            return;
        }

        // const report = excelData[userId]
        const filterData = excelData[userId]

        // Call the function to download Excel
        if (Array.isArray(filterData)) {
          const formattedData = filterData.map(record => ({
            'Tanggal': record.date,
            'User ID': record.userId,
            'Nama': record.name,
            'Cabang' : record.areas,
            'Shifs': record.shifts,
            'Jam Masuk': record.checkIn.time,
            'Jam Keluar': record.checkOut.time,
            'Pulang Lebih Awal': formatSecondsToTime(record.earlyLeaveBy),
            'Jam Telat': formatSecondsToTime(record.lateBy),
            'Waktu Bekerja': formatSecondsToTime(record.workingHours),
            'Status': record.status,
            // Tambahkan atau sesuaikan field sesuai kebutuhan
        }));

          downloadExcel(formattedData, `AttendanceReport-${userId}`);
        } else {
          alert("Invalid data format");
          return;
        }
    } catch (error) {
        // This will catch any other errors that might occur in the process, such as during filtering or file creation
        console.error("Error downloading the Excel file:", error);
        alert("Failed to download the report. Please try again.");
    }
};

const downloadExcel = (data: any[], fileName: string) => {
    try {
        const workbook = XLSX.utils.book_new();
       
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        
        // Buffer the workbook and initiate download
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
        console.error("Failed to create Excel file:", error);
        throw error; // Optional: rethrow to handle it further up in your application if needed
    }
};

  
  return (
    <>
      <Card>
        <TableFilters setLoading={setLoading} setData={setFilteredData} tableData={tableData} setExcelData={setExcelData} />
        
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
              placeholder='Pencarian Pengguna'
              className='is-full sm:is-auto'
            />
            {/* <Button
              color='primary'
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
                    Tidak Ada Data Yang Tersedia
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

export default ReportTable