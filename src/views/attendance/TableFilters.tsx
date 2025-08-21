// React Imports
import { useState, useEffect } from 'react';
import axios from 'axios';
// MUI Imports
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// Type Imports
import type { AttendanceRowType } from '@/types/attendanceRowTypes';
// Component Imports
import CustomTextField from '@core/components/mui/TextField';
import { AreaType } from '@/types/areaTypes';

const TableFilters = ({
  setLoading,
  setData,
  tableData,
}: {
  setLoading: (loading: boolean) => void;
  setData: (data: AttendanceRowType[]) => void;
  tableData?: AttendanceRowType[];
}) => {
  // States
  const [status, setStatus] = useState<AttendanceRowType['status']>('');
  const [dateRange, setDateRange] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [areas, setAreas] = useState<AreaType[]>([]);
  const [specificDate, setSpecificDate] = useState<any>(null);
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
  useEffect(() => {
    if (!isFiltering) return;

const fetchFilteredData = async () => {
  try {
    setLoading(true);

    const today = new Date();
    // Gunakan tanggal lokal tanpa konversi UTC agar konsisten dengan penyimpanan
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let fromDate = new Date(todayLocal);
    let toDate = new Date(todayLocal);

    // Jika memilih tanggal spesifik (kalender), gunakan tanggal itu untuk from/to
    if (specificDate) {
      const d = new Date(specificDate.year(), specificDate.month(), specificDate.date());
      fromDate = d;
      toDate = d;
    }

    if (dateRange === "7d") {
      fromDate.setDate(todayLocal.getDate() - 6);
    } else if (dateRange === "14d") {
      fromDate.setDate(todayLocal.getDate() - 13);
    } else if (dateRange === "1m") {
      fromDate.setMonth(todayLocal.getMonth() - 1);
    } else if (dateRange === "last1m") {
      fromDate = new Date(todayLocal.getFullYear(), todayLocal.getMonth() - 1, 1); // Awal bulan lalu
      toDate = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), 0);       // Akhir bulan lalu
    }

    // Format tanggal lokal YYYY-MM-DD
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedFromDate = `${fromDate.getFullYear()}-${pad(fromDate.getMonth() + 1)}-${pad(fromDate.getDate())}`;
    const formattedToDate = `${toDate.getFullYear()}-${pad(toDate.getMonth() + 1)}-${pad(toDate.getDate())}`;


    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?fromDate=${formattedFromDate}&toDate=${formattedToDate}`
    );

    let filteredData = res.data;

    if (status) {
      filteredData = filteredData.filter((row: AttendanceRowType) => row.status === status);
    }

    if (area) {
      filteredData = filteredData.filter((row: AttendanceRowType) => row.areas === area);
    }

    setData(filteredData);
    setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching filtered data:", error);
      setData([]);
      setLoading(false);
    }
  };

    fetchFilteredData();
  
  }, [status, dateRange, area, isFiltering, setData,setLoading]);

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* Filter Status */}
        <Grid item xs={12} sm={6}>
          <CustomTextField
            select
            fullWidth
            label="Status"
            id="select-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AttendanceRowType['status']);
              setIsFiltering(true);
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Filter Rentang Waktu */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            label="Date Range"
            id="select-date-range"
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              setIsFiltering(true);
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">Current Date</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="14d">Last 14 Days</MenuItem>
            <MenuItem value="1m">Last 1 Month</MenuItem>
            <MenuItem value="last1m">Previous Month</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Date Picker untuk Current Date */}
        {dateRange === '' && (
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Pilih Tanggal"
                value={specificDate}
                onChange={(val) => {
                  setSpecificDate(val);
                  setIsFiltering(true);
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        )}

        {/* Filter Area */}
        <Grid item xs={12} sm={6}>
          <CustomTextField
            select
            fullWidth
            label="Area"
            id="select-area"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setIsFiltering(true);
            }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All Areas</MenuItem>
            {areas.length > 0 ? (
              areas.map((areaObj) => (
                <MenuItem key={areaObj.id} value={areaObj.name}>
                  {areaObj.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No areas available</MenuItem>
            )}
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  );
};

export default TableFilters;
