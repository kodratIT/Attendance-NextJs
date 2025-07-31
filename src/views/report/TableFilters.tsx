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

  if (checkInMin < jamDasarMin) return 0;

  const selisih = checkInMin - jamDasarMin;
  const batasAbsen = jamDasarMin + 60;

  if (checkInMin > batasAbsen) return 0;

  if (selisih <= 30) return 100 - selisih;

  return Math.max(0, 70 - (selisih - 30) * 2);
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

const TableFilters = ({
  setLoading,
  setData,
  tableData,
  setExcelData
}: {
  setLoading: (loading: boolean) => void;
  setData: (data: AttendanceRowType[]) => void;
  tableData?: AttendanceRowType[];
  setExcelData: (data: AttendanceMapping[]) => void;
}) => {
  const [status, setStatus] = useState<AttendanceRowType['status']>('');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [area, setArea] = useState<string>('');
  const [areas, setAreas] = useState<AreaType[]>([]);
  const [rawData, setRawData] = useState<AttendanceRowType[]>([]);

  // ✅ Fetch daftar area sekali saja
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

  // ✅ Fetch API hanya saat dateRange berubah
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`🔄 Fetching data for dateRange: ${dateRange}`);
        
        // Gunakan local timezone untuk konsistensi
        const now = new Date();
        let toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let fromDate = new Date(toDate);
        
        // Hitung rentang tanggal berdasarkan pilihan
        console.log(`📊 Current date (now): ${now.toLocaleDateString('id-ID')}`);
        console.log(`📊 Initial toDate: ${toDate.toLocaleDateString('id-ID')}`);
        
        switch (dateRange) {
          case "7d":
            // 7 hari terakhir (termasuk hari ini)
            fromDate = new Date(toDate);
            fromDate.setDate(toDate.getDate() - 6);
            console.log(`📅 7D: ${fromDate.toLocaleDateString('id-ID')} sampai ${toDate.toLocaleDateString('id-ID')}`);
            break;
          case "14d":
            // 14 hari terakhir (termasuk hari ini)
            fromDate = new Date(toDate);
            fromDate.setDate(toDate.getDate() - 13);
            console.log(`📅 14D: ${fromDate.toLocaleDateString('id-ID')} sampai ${toDate.toLocaleDateString('id-ID')}`);
            break;
          case "1m":
            // BULAN INI: Dari tanggal 1 bulan ini sampai hari ini
            fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
            console.log(`📅 BULAN INI: ${fromDate.toLocaleDateString('id-ID')} sampai ${toDate.toLocaleDateString('id-ID')}`);
            console.log(`📊 Bulan ini = ${toDate.getMonth() + 1}/${toDate.getFullYear()}`);
            break;
          case "last1m":
            // BULAN LALU: Dari tanggal 1 bulan lalu sampai tanggal terakhir bulan lalu
            const currentMonth = toDate.getMonth();
            const currentYear = toDate.getFullYear();
            const lastMonth = currentMonth - 1;
            const yearForLastMonth = lastMonth < 0 ? currentYear - 1 : currentYear;
            const adjustedLastMonth = lastMonth < 0 ? 11 : lastMonth;
            
            fromDate = new Date(yearForLastMonth, adjustedLastMonth, 1); // Tanggal 1 bulan lalu
            toDate = new Date(yearForLastMonth, adjustedLastMonth + 1, 0); // Tanggal terakhir bulan lalu
            
            console.log(`📅 BULAN LALU: ${fromDate.toLocaleDateString('id-ID')} sampai ${toDate.toLocaleDateString('id-ID')}`);
            console.log(`📊 Bulan lalu = ${adjustedLastMonth + 1}/${yearForLastMonth}`);
            console.log(`📊 Current month = ${currentMonth + 1}/${currentYear}`);
            break;
          default:
            // Default 7 hari
            fromDate = new Date(toDate);
            fromDate.setDate(toDate.getDate() - 6);
            console.log(`📅 DEFAULT: ${fromDate.toLocaleDateString('id-ID')} sampai ${toDate.toLocaleDateString('id-ID')}`);
        }

        // Format tanggal untuk API (YYYY-MM-DD)
        const formattedFromDate = fromDate.toISOString().split('T')[0];
        const formattedToDate = toDate.toISOString().split('T')[0];
        
        console.log(`📅 Date range: ${formattedFromDate} to ${formattedToDate}`);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("❌ NEXT_PUBLIC_API_URL tidak ditemukan!");
        }

        const res = await axios.get(
          `${apiUrl}/api/report?fromDate=${formattedFromDate}&toDate=${formattedToDate}`
        );

        console.log(`✅ Raw API response:`, res.data);
        
        // Cek apakah data kosong
        if (!res.data || Object.keys(res.data).length === 0) {
          console.warn(`⚠️ No data found for date range: ${formattedFromDate} to ${formattedToDate}`);
          setRawData([]);
          setExcelData([]);
          setData([]);
          return;
        }

        const processed = processAttendanceData(res.data);
        console.log(`✅ Processed data:`, processed);
        
        setRawData(processed);
        setExcelData(res.data);
        applyFilters(processed);
        
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setRawData([]);
        setExcelData([]);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // ✅ Filter lokal saat role atau area berubah
  useEffect(() => {
    if (rawData.length > 0) applyFilters(rawData);
  }, [area, status]);

  const applyFilters = (source: AttendanceRowType[]) => {
    let filtered = [...source];

    if (area) {
      filtered = filtered.filter(
        (row) => row.areas?.trim().toLowerCase() === area.trim().toLowerCase()
      );
    }

    if (status) {
      filtered = filtered.filter(
        (row) => row.role?.trim().toLowerCase() === status.trim().toLowerCase()
      );
    }

    setData(filtered);
  };

  return (
    <CardContent>
      <Grid container spacing={4}>
        {/* Filter Roles */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            label="Roles"
            id="select-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceRowType['role'])}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="dokter">Dokter</MenuItem>
            <MenuItem value="pegawai">Pegawai</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Filter Date Range */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            label="Rentang Waktu"
            id="select-date-range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="7d">7 Hari Terakhir</MenuItem>
            <MenuItem value="14d">14 Hari Terakhir</MenuItem>
            <MenuItem value="1m">Bulan Ini</MenuItem>
            <MenuItem value="last1m">Bulan Lalu</MenuItem>
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
            onChange={(e) => setArea(e.target.value)}
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