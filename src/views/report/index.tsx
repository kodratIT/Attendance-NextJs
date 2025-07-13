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

interface AttendanceMapping {
  [userId: string]: Attendance[];
}

const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr || timeStr === '-' || (!timeStr.includes(':') && !timeStr.includes('.'))) return null;

  const delimiter = timeStr.includes(':') ? ':' : '.';
  const [h, m] = timeStr.split(delimiter).map(Number);
  if (isNaN(h) || isNaN(m)) return null;

  return h * 60 + m;
};


const getBatasTelatFromCheckIn = (
  checkInStr: string,
  role: string,
  lokasi: string
): number | null => {
  const roleLower = role?.toLowerCase() || '';
  const lokasiLower = lokasi?.toLowerCase() || '';
  const checkInMin = parseTimeToMinutes(checkInStr);
  if (checkInMin === null) return null;

  if (checkInMin >= parseTimeToMinutes("06:00")! && checkInMin <= parseTimeToMinutes("09:00")!) {
    return parseTimeToMinutes(roleLower === 'dokter' ? "08:00" : "07:30")!;
  }

  if (checkInMin >= parseTimeToMinutes("12:00")! && checkInMin <= parseTimeToMinutes("15:00")!) {
    return parseTimeToMinutes(roleLower === 'dokter' ? "14:00" : "13:30")!;
  }

  if (
    lokasiLower.includes('olak kemang') &&
    checkInMin >= parseTimeToMinutes("15:00")! &&
    checkInMin <= parseTimeToMinutes("17:00")!
  ) {
    return parseTimeToMinutes(roleLower === 'dokter' ? "16:00" : "15:45")!;
  }

  return null;
};


const calculateScore = (record: AttendanceRowType): number => {
  const jamMasukStr = record.checkIn?.time || '-';
  const role = record.role || '';
  const lokasi = record.checkIn?.location?.name || '';

  const checkInMin = parseTimeToMinutes(jamMasukStr);
  const batasMin = getBatasTelatFromCheckIn(jamMasukStr, role, lokasi);

  if (checkInMin === null || batasMin === null) return 100;

  const diff = batasMin - checkInMin;
  return Math.max(0, 100 + diff); // Naik/turun sesuai menit lebih awal atau telat
};

const processAttendanceData = (
  rawData: Record<string, AttendanceRowType[]>
): AttendanceRowType[] => {
  const processedData: Record<string, AttendanceRowType & { totalScore: number }> = {};

  Object.values(rawData).flat().forEach((record) => {
    const { userId, earlyLeaveBy, workingHours,lateBy } = record;
    if (!userId) return;

    const score = calculateScore(record);

    if (!processedData[userId]) {
      processedData[userId] = {
        ...record,
        areaId: record.areaId || '',
        role: record.role || '',
        earlyLeaveBy: earlyLeaveBy || 0,
        workingHours: workingHours || 0,
        score: 0,
        totalScore: score,
        totalHari: 1
      };
    } else {
      processedData[userId].earlyLeaveBy += earlyLeaveBy || 0;
      processedData[userId].workingHours += workingHours || 0;
      processedData[userId].totalScore += score;
      processedData[userId].totalHari += 1;
    }
  });

  return Object.values(processedData).map((item) => ({
    ...item,
    score: item.totalScore, // murni jumlah score semua hari
  }));
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

  useEffect(() => {
    fetchInitialReport();
  }, []);

  const fetchInitialReport = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) throw new Error("❌ NEXT_PUBLIC_API_URL belum diatur!");

      const today = new Date();
      today.setHours(today.getHours() + 7); // UTC+7

      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - 6);

      const formatDate = (date: Date) =>
        date.getUTCFullYear() +
        '-' +
        String(date.getUTCMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getUTCDate()).padStart(2, '0');

      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(today);

      const res = await axios.get(`${apiUrl}/api/report?fromDate=${formattedFromDate}&toDate=${formattedToDate}`);

      const processed = processAttendanceData(res.data);
      setData(processed);
      setFilteredData(processed); // optional, jika awal ingin langsung ditampilkan semua
      setExcelData(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch data awal:", err);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

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
    columnHelper.accessor('score', {
      header: 'Score Presensi',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.totalScore}
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
    console.log(excelData)
    try {
      if (!excelData || Object.keys(excelData).length === 0) {
        alert("Data pegawai kosong.");
        return;
      }

      const sheetData: (string | number)[][] = [];

      const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(value);
      };

      const headerRow = ["No", "Nama Pegawai", "Tempat Praktek", "Hari", "Gaji per Hari", "Jumlah"];
      let no = 1;

      for (const userId of Object.keys(excelData)) {
        let iduser: any = userId;
        const records = excelData[iduser];
        if (!Array.isArray(records) || records.length === 0) continue;

        const pegawai = records[0];
        const nama = pegawai.name || "Tanpa Nama";
        const role = (pegawai.role || "").toLowerCase();

        const lokasiFix = (namaLokasi: string, isMinggu: boolean): string => {
          let lokasi = namaLokasi;
          if (/aurduri/i.test(namaLokasi)) lokasi = "Patimura";
          return isMinggu ? `Praktek ${lokasi} Minggu` : `Praktek ${lokasi}`;
        };

        const tempatMap: Record<string, { hari: number; gajiPerHari: number }> = {};

        for (const item of records) {
          const tanggal = new Date(item.date);
          const isMinggu = tanggal.getDay() === 0;

          const lokasiAsli = item.checkIn?.location?.name || "Tanpa Lokasi";
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

        // Tambahkan header untuk setiap pegawai
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
            formatRupiah(jumlah)
          ]);

          firstRow = false;
        }

        // Baris total per pegawai
        sheetData.push(["", "", "Rekapan Gaji", "", "", formatRupiah(total)]);
        sheetData.push([]); // baris kosong antar pegawai
        no++;
      }

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Beri border ke semua sel yang ada isinya
      const sheetRange = XLSX.utils.decode_range(worksheet['!ref'] || '');
      for (let row = sheetRange.s.r; row <= sheetRange.e.r; row++) {
        for (let col = sheetRange.s.c; col <= sheetRange.e.c; col++) {
          const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellAddr]) continue;

          worksheet[cellAddr].s = worksheet[cellAddr].s || {};
          worksheet[cellAddr].s.border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          };

          // Tebalkan header dan baris "Rekapan Gaji"
          const isHeader = sheetData[row]?.[0] === "No";
          const isTotal = sheetData[row]?.[2] === "Rekapan Gaji";
          if (isHeader || isTotal) {
            worksheet[cellAddr].s.font = { bold: true };
          }
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Semua Slip Gaji");
      XLSX.writeFile(workbook, `SlipGaji_SemuaPegawai.xlsx`);
    } catch (err) {
      console.error("❌ Gagal membuat slip gaji:", err);
      alert("Gagal membuat slip gaji.");
    }
  };

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

  const handleExportPresensiSemuaKaryawan = () => {
    try {
      if (!excelData || Object.keys(excelData).length === 0) {
        alert("Data presensi kosong.");
        return;
      }

      const workbook = XLSX.utils.book_new();

      for (const userId in excelData) {
        const records = excelData[userId];
        if (!Array.isArray(records) || records.length === 0) continue;

        const pegawai = records[0];
        const nama = pegawai.name || "Tanpa Nama";
        const sheetName = nama.substring(0, 31); // Sheet name max 31 chars

        const sheetData = records.map((record) => ({
          Tanggal: record.date,
          Nama: record.name,
          Cabang: record.areas,
          "Jam Masuk": record.checkIn.time,
          "Jam Keluar": record.checkOut.time,
          Status: record.status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      XLSX.writeFile(workbook, `Laporan_Presensi_SemuaPegawai.xlsx`);
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
              color='primary'
              variant='tonal'
              onClick={handleExportPresensiSemuaKaryawan}
              startIcon={<i className='tabler-upload' />}
              className='is-full sm:is-auto'
            >
              Expor Laporan Presensi
            </Button>
            <Button
              color='primary'
              variant='tonal'
              onClick={handleDownloadSemuaSlipGaji}
              startIcon={<i className='tabler-upload' />}
              className='is-full sm:is-auto'
            >
              Expor Slip Gaji
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