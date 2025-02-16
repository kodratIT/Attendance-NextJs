// React Imports
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Validasi bahwa tableData adalah array sebelum melakukan filter
    if (!Array.isArray(tableData)) {
      console.error('tableData is not an array:', tableData);
      setData([]); // Set fallback ke array kosong jika tableData tidak valid
      return;
    }

    // Logika filtering berdasarkan status
    const filteredData = tableData.filter((row) => {
      if (status && row.status !== status) return false; // Filter berdasarkan status
      return true;
    });

    // Mengatur data terfilter
    setData(filteredData);
  }, [status, tableData, setData]);

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* Filter Status */}
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id="select-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceRowType['status'])}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">Select Status</MenuItem>
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id="select-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceRowType['status'])}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">Select Status</MenuItem>
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
          </CustomTextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <CustomTextField
            select
            fullWidth
            id="select-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceRowType['status'])}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">Select Status</MenuItem>
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  );
};

export default TableFilters;