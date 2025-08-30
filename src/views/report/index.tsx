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
import { CircularProgress, Tabs, Tab, Box, Fade } from '@mui/material'

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
import EmptyReportState from '@components/empty-states/EmptyReportState'
import RichAnalyticsDashboard from '@components/analytics/RichAnalyticsDashboard'
import ProfessionalReportTemplate from '@components/reports/ProfessionalReportTemplate'
import AttendancePatternCharts from '@components/charts/AttendancePatternCharts'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { formatSecondsToTime,formatSecondsToMinutes } from '@/utils/dateUtils'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

import axios from 'axios'

import * as XLSX from 'xlsx-js-style';
import { count } from 'console'


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
type CheckInInfo = {
  checkIn: {
    time: string;
    faceVerified: boolean;
    location: {
      name: string;
      latitude: number;
      longitude: number;
    };
  };
  role: string;
};

type BatasTelatResult = {
  jamDasar: string;
  selisih: number;
  skor: number;
};



interface AttendanceMapping {
  [userId: string]: Attendance[];
}
// Parsing waktu (mendukung format HH:MM, HH.MM, HH:MM:SS, HH.MM.SS)
const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr || timeStr === '-') return null;
  const delimiter = timeStr.includes(':') ? ':' : '.';
  const parts = timeStr.split(delimiter);

  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;

  return h * 60 + m;
};

const minutesToTimeStr = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const getJamDasar = (checkInStr: string, role: string, lokasi: string): number | null => {
  const checkInMin = parseTimeToMinutes(checkInStr);
  if (checkInMin === null) return null;

  const roleLower = role.toLowerCase();
  const lokasiLower = lokasi.toLowerCase();

  if (lokasiLower.includes('olak kemang') && checkInMin >= 900 && checkInMin <= 1020) {
    return roleLower === 'dokter' ? 930 : 915; // Dokter: 15:30, Pegawai: 15:15
  }

  if (checkInMin >= 360 && checkInMin <= 540) {
    return roleLower === 'dokter' ? 450 : 420; // Dokter: 07:30, Pegawai: 07:00
  }

  if (checkInMin >= 720 && checkInMin <= 900) {
    return roleLower === 'dokter' ? 810 : 780; // Dokter: 13:30, Pegawai: 13:00
  }

  return null;
};

const calculateScore = (record: AttendanceRowType): number => {
  const checkInStr = record.checkIn?.time || '-';
  const role = record.role || '';
  const lokasi = record.checkIn?.location?.name || '';

  const checkInMin = parseTimeToMinutes(checkInStr);
  const jamDasarMin = getJamDasar(checkInStr, role, lokasi);

  if (checkInMin === null || jamDasarMin === null) {
    console.warn('⛔️ Data tidak valid:', { checkInStr, role, lokasi });
    return 0;
  }

  const batasAbsen = jamDasarMin + 60;
  const selisih = Math.max(0, checkInMin - jamDasarMin);

  // ✅ PERBAIKAN: Jika datang lebih awal atau tepat waktu = skor 100
  if (checkInMin <= jamDasarMin) {
    return 100;
  }
  
  // ✅ Jika terlambat lebih dari 60 menit = skor 0
  if (checkInMin > batasAbsen) {
    return 0;
  }

  // ✅ Perhitungan skor keterlambatan yang konsisten
  if (selisih <= 30) {
    return 100 - selisih;
  } else {
    return Math.max(0, 70 - (selisih - 30) * 2);
  }
};

const processAttendanceData = (
  rawData: Record<string, AttendanceRowType[]>
): AttendanceRowType[] => {
  const processedData: Record<string, AttendanceRowType> = {};

  Object.values(rawData).flat().forEach((record) => {
    const { userId, earlyLeaveBy = 0, workingHours = 0 } = record;
    if (!userId) return;

    const score = calculateScore(record);

    if (!processedData[userId]) {
      processedData[userId] = {
        ...record,
        earlyLeaveBy,
        workingHours,
        score,
        totalScore: score,
        totalHari: 1,
        averageScore: score
      };
    } else {
      processedData[userId].earlyLeaveBy += earlyLeaveBy;
      processedData[userId].workingHours += workingHours;
      processedData[userId].totalScore += score;
      processedData[userId].totalHari += 1;
      const rawAverage = processedData[userId].totalScore / processedData[userId].totalHari;
      processedData[userId].averageScore = Math.floor(rawAverage * 100) / 100;
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

// Helper function to check if filters are applied
const checkHasFilters = (globalFilter: string, rowCount: number, totalData: number) => {
  return globalFilter.trim() !== '' || rowCount < totalData
}

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={true} timeout={500}>
          <Box>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  )
}

// Column Definitions
const columnHelper = createColumnHelper<UsersTypeWithAction>()

const ReportTable = () => {

  // States
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<AttendanceRowType[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRowType[]>([]);
  const [excelData, setExcelData] = useState<AttendanceMapping[]>([]);
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading,setLoading] = useState<boolean>(false);
  const [loadingDownload,setLoadingDownload] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFilters, setHasFilters] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [pdfReportOpen, setPdfReportOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialReport();
  }, []);

  const fetchInitialReport = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching initial report data...");
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("❌ NEXT_PUBLIC_API_URL belum diatur!");
      }

      // Gunakan local timezone untuk konsistensi
      const today = new Date();
      const toDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), 1); // Awal bulan ini

      // Format tanggal untuk API
      const formattedFromDate = fromDate.toISOString().split('T')[0];
      const formattedToDate = toDate.toISOString().split('T')[0];
      
      console.log(`📅 Initial date range: ${formattedFromDate} to ${formattedToDate}`);

      const res = await axios.get(`${apiUrl}/api/report?fromDate=${formattedFromDate}&toDate=${formattedToDate}`);
      
      console.log("✅ Initial API response:", res.data);
      
      // Cek apakah data kosong
      if (!res.data || Object.keys(res.data).length === 0) {
        console.warn("⚠️ No initial data found");
        setData([]);
        setFilteredData([]);
        setExcelData([]);
        return;
      }

      const processed = processAttendanceData(res.data);
      console.log("✅ Initial processed data:", processed);
      
      setData(processed);
      setFilteredData(processed);
      setExcelData(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch data awal:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch initial data');
      setData([]);
      setFilteredData([]);
      setExcelData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

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

    } catch (error) {
      console.error("❌ Error fetching filtered data:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
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
    columnHelper.accessor('areas', {
      header: 'Cabang',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {`${row.original.areas}`}
        </Typography>
      ) 
    }),
    columnHelper.accessor('totalHari', {
      header: 'Hari Kerja',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {`${row.original.totalHari} Hari`}
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
    // columnHelper.accessor('totalScore', {
    //   header: 'Persentase Kedisiplinan',
    //   cell: ({ row }) => {
    //     const totalScore = row.original.totalScore;
    //     const totalHari = row.original.totalHari;

    //     let average = 0;
    //     if (totalHari > 0) {
    //       average = Math.floor((totalScore / totalHari) * 100) / 100;
    //     }

    //     return (
    //       <Typography className='capitalize' color='text.primary'>
    //         {totalScore}
    //       </Typography>
    //     );
    //   }
    // }),
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

          <IconButton onClick={() => handleDownloadSlipGajiResmi(row.original.userId)}>
            <i className="tabler-file-invoice text-green-500" />
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

  const handleDownloadSemuaSlipGaji = () => {

    
  try {
    if (!excelData || Object.keys(excelData).length === 0) {
      alert("Data pegawai kosong.");
      return;
    }

    const formatRupiah = (value: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(value);
    };

    const lokasiFix = (namaLokasi: string, isMinggu: boolean): string => {
      let lokasi = namaLokasi;
      if (/aurduri/i.test(namaLokasi)) lokasi = "Patimura";
      return isMinggu ? `Praktek ${lokasi} Minggu` : `Praktek ${lokasi}`;
    };

    const groupedByRole: Record<string, string[]> = {};
    for (const userId of Object.keys(excelData)) {
      let userid1 : any= userId;
      const records = excelData[userid1];
      if (Array.isArray(records) && records.length > 0) {
        const role = records[0]?.role?.toLowerCase() || "unknown";
        if (!groupedByRole[role]) groupedByRole[role] = [];
        groupedByRole[role].push(userId);
      }
    }

    const workbook = XLSX.utils.book_new();

    for (const role of Object.keys(groupedByRole)) {
      const userIds = groupedByRole[role];
      const sheetData: (string | number)[][] = [];
      const headerRow = ["No", "Nama Pegawai", "Tempat Praktek", "Hari", "Gaji per Hari", "Jumlah"];
      let no = 1;

      for (const userId of userIds) {
      let userid2 : any= userId;

        const records = excelData[userid2];
        if (!Array.isArray(records) || records.length === 0) continue;

        const pegawai = records[0];
        const nama = pegawai.name || "Tanpa Nama";

        const tempatMap: Record<string, { hari: number; gajiPerHari: number }> = {};

        for (const item of records) {
          const tanggal = new Date(item.date);
          const isMinggu = tanggal.getDay() === 0;
          const lokasiAsli = item.checkIn?.location?.name || "Tanpa Lokasi";
          const lokasi = lokasiFix(lokasiAsli, isMinggu);

          let gaji = 0;
          if (role === "dokter") {
            gaji = item.daily_rate || 0;
            if (/olak\s*kemang/i.test(lokasiAsli) && isMinggu) gaji += 50000;
          } else if (role === "pegawai") {
            if (/olak\s*kemang/i.test(lokasiAsli)) {
              gaji = isMinggu ? 100000 : 70000;
            } else {
              gaji = (item.daily_rate || 0) + (isMinggu ? 10000 : 0);
            }
          } else {
            gaji = item.daily_rate || 0;
          }

          if (!tempatMap[lokasi]) {
            tempatMap[lokasi] = { hari: 0, gajiPerHari: gaji };
          }
          tempatMap[lokasi].hari += 1;
        }

        // Tambah ke sheet jika ada data
        if (Object.keys(tempatMap).length > 0) {
          sheetData.push(headerRow);
          let firstRow = true;
          let total = 0;

          for (const [lokasi, info] of Object.entries(tempatMap)) {
            const jumlah = info.hari * info.gajiPerHari;
            total += jumlah;

            sheetData.push([
              firstRow ? no : "",
              firstRow ? nama : "",
              lokasi,
              info.hari,
              formatRupiah(info.gajiPerHari),
              formatRupiah(jumlah),
            ]);

            firstRow = false;
          }

          sheetData.push(["", "", "Rekapan Gaji", "", "", formatRupiah(total)]);
          sheetData.push([]);
          no++;
        }
      }

      if (sheetData.length > 0) {
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        const sheetName = role === "dokter" ? "Dokter" : "Pegawai";
const safeSheetName = workbook.SheetNames.includes(sheetName)
  ? `${sheetName} (${Math.floor(Math.random() * 1000)})`
  : sheetName;

XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

      }
    }

    // ✅ Final check
    if (workbook.SheetNames.length === 0) {
      alert("Tidak ada data valid untuk dibuat slip gaji.");
      return;
    }

    XLSX.writeFile(workbook, "SlipGaji_Pegawai_Dokter.xlsx");
  } catch (err) {
    console.error("❌ Gagal membuat slip gaji:", err);
    alert("Gagal membuat slip gaji.");
  }
};

  // const handleDownloadSemuaSlipGaji = () => {
  //   console.log(excelData)
  //   try {
  //     if (!excelData || Object.keys(excelData).length === 0) {
  //       alert("Data pegawai kosong.");
  //       return;
  //     }

  //     const sheetData: (string | number)[][] = [];

  //     const formatRupiah = (value: number) => {
  //       return new Intl.NumberFormat('id-ID', {
  //         style: 'currency',
  //         currency: 'IDR',
  //         minimumFractionDigits: 0,
  //       }).format(value);
  //     };

  //     const headerRow = ["No", "Nama Pegawai", "Tempat Praktek", "Hari", "Gaji per Hari", "Jumlah"];
  //     let no = 1;

  //     for (const userId of Object.keys(excelData)) {
  //       let iduser: any = userId;
  //       const records = excelData[iduser];
  //       if (!Array.isArray(records) || records.length === 0) continue;

  //       const pegawai = records[0];
  //       const nama = pegawai.name || "Tanpa Nama";
  //       const role = (pegawai.role || "").toLowerCase();

  //       const lokasiFix = (namaLokasi: string, isMinggu: boolean): string => {
  //         let lokasi = namaLokasi;
  //         if (/aurduri/i.test(namaLokasi)) lokasi = "Patimura";
  //         return isMinggu ? `Praktek ${lokasi} Minggu` : `Praktek ${lokasi}`;
  //       };

  //       const tempatMap: Record<string, { hari: number; gajiPerHari: number }> = {};

  //       for (const item of records) {
  //         const tanggal = new Date(item.date);
  //         const isMinggu = tanggal.getDay() === 0;

  //         const lokasiAsli = item.checkIn?.location?.name || "Tanpa Lokasi";
  //         const lokasi = lokasiFix(lokasiAsli, isMinggu);
  //         let gaji = 0;

  //         if (role === "dokter") {
  //           if (/olak\s*kemang/i.test(lokasiAsli)) {
  //             gaji = item.daily_rate || 0;
  //             if (isMinggu) gaji += 50000;
  //           } else {
  //             gaji = item.daily_rate || 0;
  //           }
  //         } else if (role === "pegawai") {
  //           if (/olak\s*kemang/i.test(lokasiAsli)) {
  //             gaji = isMinggu ? 100000 : 70000;
  //           } else {
  //             gaji = (item.daily_rate || 0) + (isMinggu ? 10000 : 0);
  //           }
  //         } else {
  //           gaji = item.daily_rate || 0;
  //         }

  //         if (!tempatMap[lokasi]) {
  //           tempatMap[lokasi] = { hari: 0, gajiPerHari: gaji };
  //         }
  //         tempatMap[lokasi].hari += 1;
  //       }

  //       // Tambahkan header untuk setiap pegawai
  //       sheetData.push(headerRow);

  //       let firstRow = true;
  //       let total = 0;

  //       for (const [lokasi, info] of Object.entries(tempatMap)) {
  //         const jumlah = info.hari * info.gajiPerHari;
  //         total += jumlah;

  //         sheetData.push([
  //           firstRow ? no : "",
  //           firstRow ? nama : "",
  //           lokasi,
  //           info.hari,
  //           formatRupiah(info.gajiPerHari),
  //           formatRupiah(jumlah)
  //         ]);

  //         firstRow = false;
  //       }

  //       // Baris total per pegawai
  //       sheetData.push(["", "", "Rekapan Gaji", "", "", formatRupiah(total)]);
  //       sheetData.push([]); // baris kosong antar pegawai
  //       no++;
  //     }

  //     const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  //     // Beri border ke semua sel yang ada isinya
  //     const sheetRange = XLSX.utils.decode_range(worksheet['!ref'] || '');
  //     for (let row = sheetRange.s.r; row <= sheetRange.e.r; row++) {
  //       for (let col = sheetRange.s.c; col <= sheetRange.e.c; col++) {
  //         const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
  //         if (!worksheet[cellAddr]) continue;

  //         worksheet[cellAddr].s = worksheet[cellAddr].s || {};
  //         worksheet[cellAddr].s.border = {
  //           top: { style: "thin", color: { rgb: "000000" } },
  //           bottom: { style: "thin", color: { rgb: "000000" } },
  //           left: { style: "thin", color: { rgb: "000000" } },
  //           right: { style: "thin", color: { rgb: "000000" } },
  //         };

  //         // Tebalkan header dan baris "Rekapan Gaji"
  //         const isHeader = sheetData[row]?.[0] === "No";
  //         const isTotal = sheetData[row]?.[2] === "Rekapan Gaji";
  //         if (isHeader || isTotal) {
  //           worksheet[cellAddr].s.font = { bold: true };
  //         }
  //       }
  //     }

  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, worksheet, "Semua Slip Gaji");
  //     XLSX.writeFile(workbook, `SlipGaji_SemuaPegawai.xlsx`);
  //   } catch (err) {
  //     console.error("❌ Gagal membuat slip gaji:", err);
  //     alert("Gagal membuat slip gaji.");
  //   }
  // };

// const handleDownloadSemuaSlipGaji = () => {
//   try {
//     if (!excelData || Object.keys(excelData).length === 0) {
//       alert("Data pegawai kosong.");
//       return;
//     }

//     // Format rupiah
//     const formatRupiah = (value: number) =>
//       new Intl.NumberFormat("id-ID", {
//         style: "currency",
//         currency: "IDR",
//         minimumFractionDigits: 0,
//       }).format(value);

//     // Konversi nama lokasi
//     const lokasiFix = (namaLokasi: string, isMinggu: boolean) => {
//       let lokasi = namaLokasi;
//       if (/aurduri/i.test(namaLokasi)) lokasi = "Patimura";
//       return isMinggu ? `Praktek ${lokasi} Minggu` : `Praktek ${lokasi}`;
//     };

//     // Kelompokkan berdasarkan area + role

//    const grouped: Record<string, string[]> = {};

//   for (const userId of Object.keys(excelData)) {
//     let userid2: any = userId;
//     const records = excelData[userid2];
//     if (!Array.isArray(records) || records.length === 0) continue;

//     const role = records[0]?.role?.toLowerCase() || "unknown";

//     const key = role === "dokter" ? "dokter" : records[0]?.checkIn?.location?.name || "unknown";

//     if (!grouped[key]) grouped[key] = [];
//     grouped[key].push(userId);
//   }

//     const workbook = XLSX.utils.book_new();

//     for (const key of Object.keys(grouped)) {
//       const [areaId, role] = key.split("_");
//       const userIds = grouped[key];
//       const sheetData: (string | number)[][] = [];

//       const headerRow = [
//         "No",
//         "Nama Pegawai",
//         "Tempat Praktek",
//         "Hari",
//         "Gaji per Hari",
//         "Jumlah",
//       ];
//       let no = 1;

//       for (const userId of userIds) {
//          let userid2: any = userId;
//         const records = excelData[userid2];
//         if (!Array.isArray(records) || records.length === 0) continue;

//         const nama = records[0]?.name || "Tanpa Nama";

//         const tempatMap: Record<string, { hari: number; gajiPerHari: number }> =
//           {};

//        for (const item of records) {
//           const tanggal = new Date(item.date);
//           const isMinggu = tanggal.getDay() === 0;

//           const lokasiAsli = item.checkIn?.location?.name || "Tanpa Lokasi";
//           const lokasi = lokasiFix(lokasiAsli, isMinggu);
//           let gaji = 0;

//           if (role === "dokter") {
//             if (/olak\s*kemang/i.test(lokasiAsli)) {
//               gaji = item.daily_rate || 0;
//               if (isMinggu) gaji += 50000;
//             } else {
//               gaji = item.daily_rate || 0;
//             }
//           } else if (role === "pegawai") {
//             if (/olak\s*kemang/i.test(lokasiAsli)) {
//               gaji = isMinggu ? 100000 : 70000;
//             } else {
//               gaji = (item.daily_rate || 0) + (isMinggu ? 10000 : 0);
//             }
//           } else {
//             gaji = item.daily_rate || 0;
//           }

//           if (!tempatMap[lokasi]) {
//             tempatMap[lokasi] = { hari: 0, gajiPerHari: gaji };
//           }
//           tempatMap[lokasi].hari += 1;
//         }

//         sheetData.push(headerRow);
//         let firstRow = true;
//         let total = 0;

//         for (const [lokasi, info] of Object.entries(tempatMap)) {
//           const jumlah = info.hari * info.gajiPerHari;
//           total += jumlah;

//           sheetData.push([
//             firstRow ? no : "",
//             firstRow ? nama : "",
//             lokasi,
//             info.hari,
//             formatRupiah(info.gajiPerHari),
//             formatRupiah(jumlah),
//           ]);
//           firstRow = false;
//         }

//         sheetData.push(["", "", "Rekapan Gaji", "", "", formatRupiah(total)]);
//         sheetData.push([]);
//         no++;
//       }

//       // Buat worksheet dan beri style border + bold header/total
//       const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
//       const range = XLSX.utils.decode_range(worksheet["!ref"] || "");

      

//     const sheetName = key === "dokter"
//       ? "Semua Dokter"
//       : `${key}_Pegawai`;

//       XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
//     }

//     XLSX.writeFile(workbook, `SlipGaji_SemuaPegawai.xlsx`);
//   } catch (err) {
//     console.error("❌ Gagal membuat slip gaji:", err);
//     alert("Gagal membuat slip gaji.");
//   }
// };



  const handleDownloadSlipGajiResmi = (userId: any) => {
    try {
      const filterData = excelData[userId];

      if (!Array.isArray(filterData) || filterData.length === 0) {
        alert("Data tidak ditemukan.");
        return;
      }

      const pegawai = filterData[0];
      const nama = pegawai.name || 'Tanpa Nama';
      const role = (pegawai.role || '').toLowerCase();

      const lokasiFix = (namaLokasi: string, isMinggu: boolean): string => {
        let lokasi = namaLokasi;
        if (/aurduri/i.test(namaLokasi)) lokasi = "Patimura";
        return isMinggu ? `Praktek ${lokasi} Minggu` : `Praktek ${lokasi}`;
      };

      const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value);
      };

      // Rekap berdasarkan lokasi
      const tempatMap: Record<string, { hari: number; gajiPerHari: number }> = {};
      for (const item of filterData) {
        const tanggal = new Date(item.date);
        const isMinggu = tanggal.getDay() === 0;

        const lokasiAsli = item.checkIn?.location?.name || 'Tanpa Lokasi';
        const lokasi = lokasiFix(lokasiAsli, isMinggu);

        let gaji = 0;

        if (role === "dokter") {
          if (/olak\s*kemang/i.test(lokasiAsli)) {
            gaji = item.daily_rate || 0;
            if (isMinggu) gaji += 50000;
          } else {
            gaji = item.daily_rate || 0;
          }
        } else if (role === "pegawai") {
          if (/olak\s*kemang/i.test(lokasiAsli)) {
            gaji = isMinggu ? 100000 : 70000;
          } else {
            gaji = (item.daily_rate || 0) + (isMinggu ? 10000 : 0);
          }
        } else {
          gaji = item.daily_rate || 0;
        }

        if (!tempatMap[lokasi]) {
          tempatMap[lokasi] = { hari: 0, gajiPerHari: gaji };
        }
        tempatMap[lokasi].hari += 1;
      }

      // Susun sheet
      const sheetData: (string | number)[][] = [];
      sheetData.push(["No", "Nama Pegawai", "Tempat Praktek", "Hari", "Gaji per Hari", "Jumlah"]);

      let no = 1;
      let total = 0;
      let firstRow = true;

      for (const [lokasi, info] of Object.entries(tempatMap)) {
        const jumlah = info.hari * info.gajiPerHari;
        total += jumlah;
        sheetData.push([
          firstRow ? no : "",
          firstRow ? nama : "",
          lokasi,
          info.hari,
          formatRupiah(info.gajiPerHari),
          formatRupiah(jumlah),
        ]);
        firstRow = false;
      }

      sheetData.push(["", "", "Rekapan Gaji", "", "", formatRupiah(total)]);

      // Buat file Excel
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Bold header & total
      const boldRows = [0, sheetData.length - 1];
      boldRows.forEach(row => {
        const cols = sheetData[row].length;
        for (let c = 0; c < cols; c++) {
          const cellAddr = XLSX.utils.encode_cell({ c, r: row });
          if (worksheet[cellAddr]) {
            worksheet[cellAddr].s = { font: { bold: true } };
          }
        }
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Slip Gaji");
      XLSX.writeFile(workbook, `SlipGaji_${nama}.xlsx`);
    } catch (err) {
      console.error("❌ Gagal membuat slip gaji:", err);
      alert("Gagal membuat slip gaji.");
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

  const getBatasTelatFromCheckIn = (data: CheckInInfo): BatasTelatResult => {
  const checkInStr = data.checkIn?.time;
  const role = data.role || '';
  const lokasi = data.checkIn?.location?.name || '';

  if (!checkInStr) {
    return {
      jamDasar: '-',
      selisih: 0,
      skor: 0
    };
  }

  const checkInMin = parseTimeToMinutes(checkInStr);
  const jamDasarMin = getJamDasar(checkInStr, role, lokasi);

  if (checkInMin === null || jamDasarMin === null) {
    return {
      jamDasar: '-',
      selisih: 0,
      skor: 0
    };
  }

  const batasAbsen = jamDasarMin + 60;
  const selisih = Math.max(0, checkInMin - jamDasarMin);

  let skor = 0;
  if (checkInMin <= jamDasarMin) {
    skor = 100;
  } else if (checkInMin <= batasAbsen) {
    if (selisih <= 30) {
      skor = 100 - selisih;
    } else {
      skor = Math.max(0, 70 - (selisih - 30) * 2);
    }
  }

  return {
    jamDasar: minutesToTimeStr(jamDasarMin),
    selisih,
    skor
  };
};

const handleExportPresensiSemuaKaryawan = () => {
  try {
    if (!excelData || Object.keys(excelData).length === 0) {
      alert("Data presensi kosong.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Step 1: Kelompokkan data berdasarkan areaId dan role
    const groupedData: Record<
      string, // `${areaId}_${role}`
      Record<
        string, // userId
        {
          name: string;
          records: Record<string, string | number>[];
          totalSkor: number;
          totalHari: number;
        }
      >
    > = {};

    for (const userId in excelData) {
      const userRecords = excelData[userId];
      if (!Array.isArray(userRecords)) continue;

      for (const record of userRecords) {
        const jamMasuk = record.checkIn?.time || '-';
        const role = record.role || 'UnknownRole';
        const lokasi = record.checkIn?.location?.name ?? '-';
        const areaId = record.areas || 'UnknownArea';
        const key = `${areaId}_${role}`;

        const { jamDasar, selisih, skor } = getBatasTelatFromCheckIn({
          checkIn: {
            time: jamMasuk,
            faceVerified: false,
            location: {
              name: lokasi,
              latitude: 0,
              longitude: 0
            }
          },
          role
        });

        if (!groupedData[key]) {
          groupedData[key] = {};
        }

        if (!groupedData[key][userId]) {
          groupedData[key][userId] = {
            name: record.name || '-',
            records: [],
            totalSkor: 0,
            totalHari: 0
          };
        }

        const userData = groupedData[key][userId];

        userData.records.push({
          No: userData.records.length + 1,
          Nama: userData.name,
          "Jam Masuk": jamMasuk,
          "Jam Dasar": jamDasar,
          Role: role,
          Lokasi: lokasi,
          "Selisih (mnt)": selisih,
          "Skor Kedisiplinan": skor
        });

        userData.totalSkor += skor;
        userData.totalHari++;
      }
    }

    // Step 2: Buat sheet untuk tiap kombinasi areaId + role
    for (const key in groupedData) {
      const sheetRecords: Record<string, string | number>[] = [];

      // Ambil semua pegawai dalam satu kombinasi sheet
      const userList = Object.values(groupedData[key])
        .map((user) => {
          const rataRata = user.totalHari > 0 ? user.totalSkor / user.totalHari : 0;
          return { ...user, rataRata };
        })
        // Urutkan berdasarkan rata-rata descending
        .sort((a, b) => b.rataRata - a.rataRata);

      // Susun sheet berdasarkan urutan tersebut
      for (const user of userList) {
        sheetRecords.push(...user.records);

        sheetRecords.push(
          { No: '', Nama: '', "Jam Masuk": 'Total Skor', "Jam Dasar": '', Role: '', Lokasi: '', "Selisih (mnt)": '', "Skor Kedisiplinan": user.totalSkor },
          { No: '', Nama: '', "Jam Masuk": 'Total Hari', "Jam Dasar": '', Role: '', Lokasi: '', "Selisih (mnt)": '', "Skor Kedisiplinan": user.totalHari },
          { No: '', Nama: '', "Jam Masuk": '📊 Tingkat Kedisiplinan (%)', "Jam Dasar": '', Role: '', Lokasi: '', "Selisih (mnt)": '', "Skor Kedisiplinan": `${user.rataRata.toFixed(2)}%` },
          { No: '', Nama: '', "Jam Masuk": '', "Jam Dasar": '', Role: '', Lokasi: '', "Selisih (mnt)": '', "Skor Kedisiplinan": '' }
        );
      }

            // Tambahkan baris pemisah kosong dulu (opsional)
      // Tambahkan baris kosong pemisah
      sheetRecords.push({
        No: '', Nama: '', "Jam Masuk": '', "Jam Dasar": '', Role: '', Lokasi: '', "Selisih (mnt)": '', "Skor Kedisiplinan": ''
      });

      // Waktu sekarang pakai Date bawaan
      const now = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Tambahkan footer cetakan
      sheetRecords.push({
        No: '', Nama: '', "Jam Masuk": `📋 Dicetak dari sistem pada ${now}`, "Jam Dasar": '', Role: '', Lokasi: '', "Selisih (mnt)": '', "Skor Kedisiplinan": ''
      });

      const sheetName = key.substring(0, 31);
      const worksheet = XLSX.utils.json_to_sheet(sheetRecords);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    XLSX.writeFile(workbook, `Laporan_Presensi_PerArea_PerRole.xlsx`);
  } catch (err) {
    console.error("❌ Gagal ekspor presensi:", err);
    alert("Gagal ekspor presensi.");
  }
};

  return (
    <>
      <Card>
        <TableFilters
          setLoading={setLoading}
          setData={setFilteredData}
          setExcelData={setExcelData}
        />
        
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                px: 3,
                py: 2
              }
            }}
          >
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <i className="tabler-table" />
                  📊 Data Laporan
                </Box>
              } 
              id="report-tab-0"
              aria-controls="report-tabpanel-0"
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <i className="tabler-chart-bar" />
                  📈 Analytics & Insights
                </Box>
              } 
              id="report-tab-1"
              aria-controls="report-tabpanel-1"
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <i className="tabler-chart-line" />
                  📊 Visual Charts
                </Box>
              } 
              id="report-tab-2"
              aria-controls="report-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={currentTab} index={0}>
        
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
            <Button
              color="primary"
              variant="tonal"
              onClick={handleExportPresensiSemuaKaryawan}
              startIcon={<i className="tabler-upload" />}
              className="is-full sm:is-auto"
            >
              Ekspor Laporan Presensi
            </Button>

            <Button
              color="primary"
              variant="tonal"
              onClick={handleDownloadSemuaSlipGaji}
              startIcon={<i className="tabler-upload" />}
              className="is-full sm:is-auto"
            >
              Ekspor Slip Gaji
            </Button>
            
            <Button
              color="secondary"
              variant="contained"
              onClick={() => setPdfReportOpen(true)}
              startIcon={<i className="tabler-file-export" />}
              className="is-full sm:is-auto"
              sx={{
                background: 'linear-gradient(135deg, #e91e63, #ad1457)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #c2185b, #880e4f)'
                }
              }}
            >
              📄 PDF Report
            </Button>

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
        
        {/* Show empty state when no data and not loading */}
        {!loading && table.getFilteredRowModel().rows.length === 0 && (
          <EmptyReportState
            type={error ? 'error' : (checkHasFilters(globalFilter, table.getFilteredRowModel().rows.length, data.length) ? 'no-results' : 'no-data')}
            onRefresh={() => {
              setError(null)
              fetchData()
            }}
            onResetFilters={() => {
              setGlobalFilter('')
              // Reset other filters if needed
            }}
          />
        )}
        
        {table.getFilteredRowModel().rows.length > 0 && (
          <TablePagination
            component={() => (
              <TablePaginationComponent
                pageIndex={table.getState().pagination.pageIndex}
                pageSize={table.getState().pagination.pageSize}
                rowCount={table.getFilteredRowModel().rows.length}
                onPageChange={(_, pageIndex) => table.setPageIndex(pageIndex)}
              />
            )}
            count={table.getFilteredRowModel().rows.length}
            rowsPerPage={table.getState().pagination.pageSize}
            page={table.getState().pagination.pageIndex}
            onPageChange={(_, page) => table.setPageIndex(page)}
          />
        )}
        </TabPanel>

        {/* Tab 2: Analytics Dashboard */}
        <TabPanel value={currentTab} index={1}>
          <RichAnalyticsDashboard 
            data={filteredData}
          />
        </TabPanel>

        {/* Tab 3: Visual Data Charts */}
        <TabPanel value={currentTab} index={2}>
          <AttendancePatternCharts 
            data={filteredData}
          />
        </TabPanel>
      </Card>
      
      {/* Professional PDF Report Generator */}
      <ProfessionalReportTemplate
        data={filteredData}
        open={pdfReportOpen}
        onClose={() => setPdfReportOpen(false)}
        userRole="manager" // This should come from actual user context/auth
      />
    </>
  )
}

export default ReportTable
