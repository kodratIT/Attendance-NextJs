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
        const today = new Date();
        today.setHours(today.getHours() + 7);

        let toDate = new Date(today);
        let fromDate = new Date(toDate);
        const awalBulanIni = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
        awalBulanIni.setHours(awalBulanIni.getHours() + 7);

        if (dateRange === "7d") {
          fromDate.setDate(toDate.getDate() - 6);
        } else if (dateRange === "14d") {
          fromDate.setDate(toDate.getDate() - 13);
        } else if (dateRange === "1m") {
          fromDate.setMonth(toDate.getMonth() - 1);
        } else if (dateRange === "last1m") {
          fromDate = new Date(toDate.getFullYear(), toDate.getMonth() - 1, 1);
          toDate = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
        }

        if (dateRange !== "last1m" && fromDate < awalBulanIni) {
          fromDate = awalBulanIni;
        }

        const formattedFromDate = fromDate.toISOString().split('T')[0];
        const formattedToDate = toDate.toISOString().split('T')[0];

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/report?fromDate=${formattedFromDate}&toDate=${formattedToDate}`
        );

        const processed = processAttendanceData(res.data);
        setRawData(processed);
        setExcelData(res.data);
        applyFilters(processed);
      } catch (err) {
        console.error("❌ Gagal ambil data:", err);
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