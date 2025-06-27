// React Imports
import { useState, useEffect } from 'react';
import axios from 'axios';
// MUI Imports
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
// Type Imports
import type { AttendanceRowType } from '@/types/attendanceRowTypes';
// Component Imports
import CustomTextField from '@core/components/mui/TextField';
import { AreaType } from '@/types/areaTypes';

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


const processAttendanceData = (rawData: Record<string, AttendanceRowType[]>): AttendanceRowType[] => {
  const processedData: Record<string, AttendanceRowType> = {};

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

const TableFilters = ({
  setLoading,
  setData,
  tableData,
  setExcelData
}: {
  setLoading: (loading: boolean) => void;
  setData: (data: AttendanceRowType[]) => void;
  tableData?: AttendanceRowType[];
  setExcelData:(data: AttendanceMapping[]) => void;
}) => {
  // States
  const [status, setStatus] = useState<AttendanceRowType['status']>('');
  const [dateRange, setDateRange] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [areas, setAreas] = useState<AreaType[]>([]);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  // Fetch daftar area kerja dari API saat pertama kali load
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/areas`);
        
        setAreas(res.data.data);
      } catch (error) {
        console.error("❌ Error fetching areas:", error);
      }
    };
    fetchAreas();
  }, []);

  // Fetch data berdasarkan filter hanya jika pengguna melakukan perubahan
  // useEffect(() => {
  //   if (!isFiltering) return;

  //   const fetchFilteredData = async () => {
  //     try {
  //       setLoading(true);

  //       let fromDate = new Date();
  //       let toDate = new Date();

  //       // Menyesuaikan zona waktu ke UTC+7
  //       fromDate.setHours(fromDate.getHours() + 7);
  //       toDate.setHours(toDate.getHours() + 7);

  //       // Menyesuaikan rentang waktu berdasarkan filter
  //       // Menyesuaikan rentang waktu berdasarkan filter
  //       if (dateRange === "7d") {
  //         fromDate.setDate(toDate.getDate() - 6);
  //       } else if (dateRange === "14d") {
  //         fromDate.setDate(toDate.getDate() - 13);
  //       } else if (dateRange === "1m") {
  //         fromDate.setMonth(toDate.getMonth() - 1);
  //       }

  //       // Format tanggal dengan UTC+7
  //       const formattedFromDate = fromDate.getUTCFullYear() + '-' + 
  //                                 String(fromDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
  //                                 String(fromDate.getUTCDate()).padStart(2, '0');

  //       const formattedToDate = toDate.getUTCFullYear() + '-' + 
  //                               String(toDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
  //                               String(toDate.getUTCDate()).padStart(2, '0');
                                
  //       const res = await axios.get(
  //         `${process.env.NEXT_PUBLIC_API_URL}/api/report?fromDate=${formattedFromDate}&toDate=${formattedToDate}`
  //       );
                             
  //       let b =processAttendanceData(res.data)
  //       let filteredData = b;

  //       // if (status) {
  //       //   filteredData = filteredData.filter((row: AttendanceRowType) => row.status === status);
  //       // }
  //       if (area) {
  //         console.log("Data sebelum filter:", filteredData);
  //         filteredData = filteredData.filter((row: AttendanceRowType) => row.areas.trim().toLowerCase() === area.trim().toLowerCase());
  //         console.log("Data setelah filter:", filteredData); 
  //       }
        

  //       setExcelData(res.data)
  //       setData(filteredData);
  //       setLoading(false);
  //     } catch (error) {
  //       console.error("❌ Error fetching filtered data:", error);
  //       setData([]);
  //     }
  //   };
  //   fetchFilteredData();
  
  // }, [status, dateRange, area, isFiltering, setData,setLoading]);
// useEffect(() => {
//   if (!isFiltering) return;

//   const fetchFilteredData = async () => {
//     try {
//       setLoading(true);

//       let toDate = new Date();
//       toDate.setHours(toDate.getHours() + 7); // UTC+7

//       let fromDate = new Date(toDate);

//       const awalBulanIni = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
//       awalBulanIni.setHours(awalBulanIni.getHours() + 7); // UTC+7

//       if (dateRange === "7d") {
//         fromDate.setDate(toDate.getDate() - 6);
//       } else if (dateRange === "14d") {
//         fromDate.setDate(toDate.getDate() - 13);
//       } else if (dateRange === "1m") {
//         fromDate.setMonth(toDate.getMonth() - 1);
//       }

//       if (fromDate < awalBulanIni) {
//         fromDate = awalBulanIni;
//       }

//       const formattedFromDate =
//         fromDate.getUTCFullYear() +
//         '-' +
//         String(fromDate.getUTCMonth() + 1).padStart(2, '0') +
//         '-' +
//         String(fromDate.getUTCDate()).padStart(2, '0');

//       const formattedToDate =
//         toDate.getUTCFullYear() +
//         '-' +
//         String(toDate.getUTCMonth() + 1).padStart(2, '0') +
//         '-' +
//         String(toDate.getUTCDate()).padStart(2, '0');

//       const res = await axios.get(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/report?fromDate=${formattedFromDate}&toDate=${formattedToDate}`
//       );

//       const processed = processAttendanceData(res.data);
//       let filteredData = processed;

//       // Filter berdasarkan area (jika ada)
//       if (area) {
//         filteredData = filteredData.filter(
//           (row: AttendanceRowType) =>
//             row.areas.trim().toLowerCase() === area.trim().toLowerCase()
//         );
//       }

//       // Filter berdasarkan status → role
//       if (status) {
//         filteredData = filteredData.filter(
//           (row: AttendanceRowType) =>
//             row.role?.trim().toLowerCase() === status.trim().toLowerCase()
//         );
//       }

//       setExcelData(res.data);
//       setData(filteredData);
//       setLoading(false);
//     } catch (error) {
//       console.error("❌ Error fetching filtered data:", error);
//       setData([]);
//     }
//   };

//   fetchFilteredData();
// }, [status, dateRange, area, isFiltering, setData, setLoading]);

const [rawData, setRawData] = useState<any[]>([]); // cache data dari API

useEffect(() => {
  if (!isFiltering) return;

  const fetchApiIfNeeded = async () => {
    try {
      setLoading(true);

      // Hitung range tanggal
      let toDate = new Date();
      toDate.setHours(toDate.getHours() + 7); // UTC+7
      let fromDate = new Date(toDate);
      const awalBulanIni = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
      awalBulanIni.setHours(awalBulanIni.getHours() + 7);

      if (dateRange === "7d") {
        fromDate.setDate(toDate.getDate() - 6);
      } else if (dateRange === "14d") {
        fromDate.setDate(toDate.getDate() - 13);
      } else if (dateRange === "1m") {
        fromDate.setMonth(toDate.getMonth() - 1);
      }

      if (fromDate < awalBulanIni) {
        fromDate = awalBulanIni;
      }

      const formattedFromDate =
        fromDate.getUTCFullYear() +
        '-' +
        String(fromDate.getUTCMonth() + 1).padStart(2, '0') +
        '-' +
        String(fromDate.getUTCDate()).padStart(2, '0');

      const formattedToDate =
        toDate.getUTCFullYear() +
        '-' +
        String(toDate.getUTCMonth() + 1).padStart(2, '0') +
        '-' +
        String(toDate.getUTCDate()).padStart(2, '0');

      // Ambil data dari API
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/report?fromDate=${formattedFromDate}&toDate=${formattedToDate}`
      );

      const processed = processAttendanceData(res.data);

      // Cache
      setRawData(processed);
      setExcelData(res.data);

      // Apply filter langsung
      applyFilters(processed);

      setLoading(false);
    } catch (err) {
      console.error("❌ Gagal ambil data:", err);
      setData([]);
      setLoading(false);
    }
  };

  fetchApiIfNeeded();
}, [dateRange, isFiltering]);

useEffect(() => {
  if (!isFiltering || rawData.length === 0) return;

  // Apply ulang filter dari cache
  applyFilters(rawData);
}, [area, status]);

// 🔧 Fungsi pemroses filter
const applyFilters = (source: AttendanceRowType[]) => {
  let filtered = [...source];

  if (area) {
    filtered = filtered.filter(
      (row) => row.areas?.trim().toLowerCase() === area.trim().toLowerCase()
    );
  }

  if (status != "") {
    filtered = filtered.filter(
      (row) => row.role?.trim().toLowerCase() === status.trim().toLowerCase()
    );
  }

  setData(filtered);
};

  return (
    <CardContent>
      <Grid container spacing={4}>
        {/* Filter Status */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            label="Roles"
            id="select-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AttendanceRowType['role']);
              setIsFiltering(true);
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="dokter">Dokter</MenuItem>
            <MenuItem value="pegawai">Pegawai</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Filter Rentang Waktu */}
        <Grid item xs={12} sm={4}>
            <CustomTextField
              select
              fullWidth
              label="Rentang Tanggal"
              id="select-date-range"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setIsFiltering(true);
              }}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="">Hari Ini </MenuItem>
              <MenuItem value="7d">7 Hari Terakhir</MenuItem>
              <MenuItem value="14d">14 Hari Terakhir</MenuItem>
              <MenuItem value="1m">1 Bulan Terakhir</MenuItem>

            </CustomTextField>
          </Grid>

        {/* Filter Area */}
        <Grid item xs={12} sm={4}>
        <CustomTextField
          select
          fullWidth
          label="Cabang"
          id="select-area"
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setIsFiltering(true);
          }}
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="">Semua Cabang</MenuItem>
          {areas.length > 0 ? (
            areas.map((areaObj) => (
              <MenuItem key={areaObj.name} value={areaObj.name}>
                {areaObj.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>Tidak ada wilayah yang tersedia</MenuItem>
          )}
        </CustomTextField>
      </Grid>
      </Grid>
    </CardContent>
  );
};

export default TableFilters;
