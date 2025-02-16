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

const TableFilters = ({
  setData,
  tableData,
}: {
  setData: (data: AttendanceRowType[]) => void;
  tableData?: AttendanceRowType[];
}) => {
  // States
  const [status, setStatus] = useState<AttendanceRowType['status']>(''); // Filter berdasarkan status
  const [dateRange, setDateRange] = useState<string>('7d'); // Default: 7 hari terakhir
  const [area, setArea] = useState<string>(''); // Filter berdasarkan area kerja
  const [areas, setAreas] = useState<string[]>([]); // Daftar area kerja dari API

  // Fetch daftar area kerja dari API saat pertama kali load
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/areas`);
        setAreas(res.data);
      } catch (error) {
        console.error("❌ Error fetching areas:", error);
      }
    };
    fetchAreas();
  }, []);

  // Fetch data berdasarkan filter
  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
        let fromDate = new Date();
        let toDate = new Date();

        if (dateRange === "7d") {
          fromDate.setDate(toDate.getDate() - 6);
        } else if (dateRange === "14d") {
          fromDate.setDate(toDate.getDate() - 13);
        } else if (dateRange === "1m") {
          fromDate.setMonth(toDate.getMonth() - 1);
        }

        const formattedFromDate = fromDate.toISOString().split("T")[0];
        const formattedToDate = toDate.toISOString().split("T")[0];

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
      } catch (error) {
        console.error("❌ Error fetching filtered data:", error);
        setData([]);
      }
    };

    fetchFilteredData();
  }, [status, dateRange, area, setData]);

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* Filter Status */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            label="Status"
            id="select-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceRowType['status'])}
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
            onChange={(e) => setDateRange(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="14d">Last 14 Days</MenuItem>
            <MenuItem value="1m">Last 1 Month</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Filter Area */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            label="Area"
            id="select-area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">All Areas</MenuItem>
            {areas.map((areaName) => (
              <MenuItem key={areaName} value={areaName}>
                {areaName}
              </MenuItem>
            ))}
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  );
};

export default TableFilters;
