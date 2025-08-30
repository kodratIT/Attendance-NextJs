// React Imports
import { useState, useEffect } from 'react';
import axios from 'axios';
// MUI Imports
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
// Date Picker Imports
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id as localeId } from 'date-fns/locale';
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
  const [isCustomDateRange, setIsCustomDateRange] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [contractStatus, setContractStatus] = useState<string>('');
  const [jobPosition, setJobPosition] = useState<string>('');
  const [disciplineRange, setDisciplineRange] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  const [workingHoursRange, setWorkingHoursRange] = useState<{ min: number; max: number }>({ min: 0, max: 12 });
  const [showPivotGrouping, setShowPivotGrouping] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);
  const [availableContractTypes, setAvailableContractTypes] = useState<string[]>([]);

  // ✅ Fetch daftar area dan populate filter options
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

  // Update available filter options when raw data changes
  useEffect(() => {
    if (rawData.length > 0) {
      // Extract unique roles
      const roles = [...new Set(rawData.map(emp => emp.role).filter(Boolean))];
      setAvailableRoles(roles);
      
      // Extract unique job positions (mock data for now - adjust based on your data structure)
      const positions = [...new Set(rawData.map(emp => emp.shifts || 'Standard').filter(Boolean))];
      setAvailablePositions(positions);
      
      // Extract contract types (mock - adjust based on your data structure)
      const contractTypes = ['Tetap', 'Kontrak', 'Magang', 'Paruh Waktu'];
      setAvailableContractTypes(contractTypes);
    }
  }, [rawData]);

  // ✅ Fetch API berdasarkan dateRange atau custom date
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`🔄 Fetching data for dateRange: ${dateRange}, isCustom: ${isCustomDateRange}`);
        
        let fromDate: Date;
        let toDate: Date;
        
        if (isCustomDateRange && customStartDate && customEndDate) {
          // Gunakan custom date range
          fromDate = new Date(customStartDate.getFullYear(), customStartDate.getMonth(), customStartDate.getDate());
          toDate = new Date(customEndDate.getFullYear(), customEndDate.getMonth(), customEndDate.getDate());
          console.log(`📅 CUSTOM RANGE: ${fromDate.toLocaleDateString('id-ID')} sampai ${toDate.toLocaleDateString('id-ID')}`);
        } else {
          // Gunakan preset date range
          const now = new Date();
          toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          fromDate = new Date(toDate);
          
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
  }, [dateRange, isCustomDateRange, customStartDate, customEndDate]);

  // ✅ Filter lokal saat filter apapun berubah
  useEffect(() => {
    if (rawData.length > 0) applyFilters(rawData);
  }, [area, status, jobPosition, contractStatus, disciplineRange, workingHoursRange]);

  const applyFilters = (source: AttendanceRowType[]) => {
    let filtered = [...source];

    // Basic filters
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

    // Advanced filters
    if (jobPosition) {
      filtered = filtered.filter(
        (row) => row.shifts?.trim().toLowerCase() === jobPosition.trim().toLowerCase()
      );
    }

    // Contract status filter (mock implementation)
    if (contractStatus) {
      // For now, we'll use a mock filter based on role or other criteria
      // Adjust this logic based on your actual data structure
      filtered = filtered.filter((row) => {
        if (contractStatus === 'Tetap') return row.role === 'dokter';
        if (contractStatus === 'Kontrak') return row.role === 'pegawai';
        return true;
      });
    }

    // Discipline score range filter
    if (disciplineRange.min > 0 || disciplineRange.max < 100) {
      filtered = filtered.filter((row) => {
        const score = row.averageScore || row.score || 0;
        return score >= disciplineRange.min && score <= disciplineRange.max;
      });
    }

    // Working hours range filter
    if (workingHoursRange.min > 0 || workingHoursRange.max < 12) {
      filtered = filtered.filter((row) => {
        const hours = (row.workingHours || 0) / 3600; // Convert from seconds to hours
        return hours >= workingHoursRange.min && hours <= workingHoursRange.max;
      });
    }

    console.log(`✅ Applied filters: ${filtered.length}/${source.length} records`);
    setData(filtered);
  };

  // Handler untuk custom date range
  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      if (customStartDate <= customEndDate) {
        setIsCustomDateRange(true);
        setDateRange(''); // Clear preset selection
        console.log(`📅 Applied custom range: ${customStartDate.toLocaleDateString('id-ID')} to ${customEndDate.toLocaleDateString('id-ID')}`);
      } else {
        alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir! 📅');
      }
    } else {
      alert('Silakan pilih tanggal mulai dan akhir! ⚠️');
    }
  };

  const handleResetToPreset = () => {
    setIsCustomDateRange(false);
    setCustomStartDate(null);
    setCustomEndDate(null);
    setDateRange('7d'); // Reset ke default
  };

  const handleResetAllFilters = () => {
    setStatus('');
    setArea('');
    setJobPosition('');
    setContractStatus('');
    setDisciplineRange({ min: 0, max: 100 });
    setWorkingHoursRange({ min: 0, max: 12 });
    setGroupBy([]);
    handleResetToPreset();
  };

  const handleGroupByChange = (groupField: string) => {
    setGroupBy(prev => {
      if (prev.includes(groupField)) {
        return prev.filter(field => field !== groupField);
      } else {
        return [...prev, groupField];
      }
    });
  };

  const handlePresetChange = (newRange: string) => {
    setIsCustomDateRange(false);
    setCustomStartDate(null);
    setCustomEndDate(null);
    setDateRange(newRange);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={localeId}>
      <CardContent>
        {/* Header dengan toggle advanced filters */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-filter text-primary" style={{ fontSize: '1.2rem' }} />
            Filter Laporan
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<i className={`tabler-chevron-${showAdvancedFilters ? 'up' : 'down'}`} />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            sx={{ borderRadius: '12px' }}
          >
            {showAdvancedFilters ? 'Sembunyikan' : 'Filter Lanjutan'}
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Filter Roles */}
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              select
              fullWidth
              label="👨‍⚕️ Roles"
              id="select-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceRowType['role'])}
              SelectProps={{ displayEmpty: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <MenuItem value="">🌟 All Roles</MenuItem>
              <MenuItem value="dokter">👨‍⚕️ Dokter</MenuItem>
              <MenuItem value="pegawai">👥 Pegawai</MenuItem>
            </CustomTextField>
          </Grid>

          {/* Filter Date Range dengan Custom Option */}
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              select
              fullWidth
              label="📅 Rentang Waktu"
              id="select-date-range"
              value={isCustomDateRange ? 'custom' : dateRange}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'custom') {
                  setShowAdvancedFilters(true);
                } else {
                  handlePresetChange(value);
                }
              }}
              SelectProps={{ displayEmpty: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <MenuItem value="7d">📊 7 Hari Terakhir</MenuItem>
              <MenuItem value="14d">📈 14 Hari Terakhir</MenuItem>
              <MenuItem value="1m">🗓️ Bulan Ini</MenuItem>
              <MenuItem value="last1m">⏪ Bulan Lalu</MenuItem>
              <MenuItem value="custom" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                🎯 Custom Range
              </MenuItem>
            </CustomTextField>
          </Grid>

          {/* Filter Area */}
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              select
              fullWidth
              label="🏢 Cabang"
              id="select-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <MenuItem value="">🌎 Semua Cabang</MenuItem>
              {areas.length > 0 ? (
                areas.map((areaObj) => (
                  <MenuItem key={areaObj.name} value={areaObj.name}>
                    📍 {areaObj.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>⚠️ Tidak ada wilayah yang tersedia</MenuItem>
              )}
            </CustomTextField>
          </Grid>

          {/* Status Indicator */}
          <Grid item xs={12} sm={6} md={3}>
            <Box 
              sx={{ 
                height: '56px',
                display: 'flex', 
                alignItems: 'center',
                px: 2,
                border: '1px solid',
                borderColor: isCustomDateRange ? 'primary.main' : 'divider',
                borderRadius: '12px',
                backgroundColor: isCustomDateRange ? 'primary.50' : 'background.paper'
              }}
            >
              {isCustomDateRange ? (
                <Typography variant="body2" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🎯 Custom: {customStartDate?.toLocaleDateString('id-ID')} - {customEndDate?.toLocaleDateString('id-ID')}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⏱️ Mode: Preset Range
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Advanced Filters Section */}
        <Collapse in={showAdvancedFilters}>
          <Box mt={4} p={3} sx={{ 
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.05), rgba(67, 56, 202, 0.05))',
            backdropFilter: 'blur(10px)'
          }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="tabler-settings text-primary" style={{ fontSize: '1.3rem' }} />
              🎛️ Filter Lanjutan
            </Typography>
            
            {/* Custom Date Range Picker */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'primary.main',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(124, 77, 255, 0.05)'
                }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🗓️ Pilih Rentang Tanggal Custom
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="📅 Tanggal Mulai"
                        value={customStartDate}
                        onChange={(newValue) => setCustomStartDate(newValue as Date | null)}
                        slotProps={{ 
                          textField: { 
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px'
                              }
                            }
                          } 
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="📅 Tanggal Akhir"
                        value={customEndDate}
                        onChange={(newValue) => setCustomEndDate(newValue as Date | null)}
                        minDate={customStartDate || undefined}
                        slotProps={{ 
                          textField: { 
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px'
                              }
                            }
                          } 
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box display="flex" flexDirection="column" gap={2} height="100%" justifyContent="center">
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleCustomDateApply}
                    disabled={!customStartDate || !customEndDate}
                    startIcon={<i className="tabler-calendar-check" />}
                    sx={{
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #7c4dff, #4338ca)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #6c42e8, #3730a3)'
                      },
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    🚀 Terapkan Custom Range
                  </Button>
                  
                  {isCustomDateRange && (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleResetToPreset}
                      startIcon={<i className="tabler-refresh" />}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none'
                      }}
                    >
                      🔄 Reset ke Preset
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
            
            
            {/* Multi-level Advanced Filters */}
            <Divider sx={{ my: 3 }} />
            
            {/* Additional Filter Controls */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {/* Job Position Filter */}
              <Grid item xs={12} md={6}>
                <CustomTextField
                  select
                  fullWidth
                  label="💼 Posisi Pekerjaan"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px'
                    }
                  }}
                >
                  <MenuItem value="">🌟 Semua Posisi</MenuItem>
                  {availablePositions.map((position) => (
                    <MenuItem key={position} value={position}>
                      💼 {position}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              
              {/* Contract Status Filter */}
              <Grid item xs={12} md={6}>
                <CustomTextField
                  select
                  fullWidth
                  label="📋 Status Kontrak"
                  value={contractStatus}
                  onChange={(e) => setContractStatus(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px'
                    }
                  }}
                >
                  <MenuItem value="">🌟 Semua Status</MenuItem>
                  {availableContractTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      📋 {type}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
            </Grid>
            
            {/* Range Filters */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {/* Discipline Score Range */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🎯 Rentang Skor Kedisiplinan
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <Slider
                      value={[disciplineRange.min, disciplineRange.max]}
                      onChange={(_, newValue) => {
                        const [min, max] = newValue as number[];
                        setDisciplineRange({ min, max });
                      }}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                      step={5}
                      marks={[
                        { value: 0, label: '0' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' }
                      ]}
                      sx={{
                        '& .MuiSlider-thumb': {
                          backgroundColor: '#7c4dff'
                        },
                        '& .MuiSlider-track': {
                          background: 'linear-gradient(90deg, #ff9800, #4caf50)'
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Skor: {disciplineRange.min} - {disciplineRange.max}
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Working Hours Range */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    ⏰ Rentang Jam Kerja
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <Slider
                      value={[workingHoursRange.min, workingHoursRange.max]}
                      onChange={(_, newValue) => {
                        const [min, max] = newValue as number[];
                        setWorkingHoursRange({ min, max });
                      }}
                      valueLabelDisplay="auto"
                      min={0}
                      max={12}
                      step={0.5}
                      marks={[
                        { value: 0, label: '0h' },
                        { value: 6, label: '6h' },
                        { value: 8, label: '8h' },
                        { value: 12, label: '12h' }
                      ]}
                      sx={{
                        '& .MuiSlider-thumb': {
                          backgroundColor: '#2196f3'
                        },
                        '& .MuiSlider-track': {
                          background: 'linear-gradient(90deg, #ff5722, #2196f3)'
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Jam: {workingHoursRange.min}h - {workingHoursRange.max}h
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Pivot Grouping Section */}
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className="tabler-table-options text-primary" style={{ fontSize: '1.2rem' }} />
                  🔄 Pengelompokan Data (Pivot)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<i className={`tabler-chevron-${showPivotGrouping ? 'up' : 'down'}`} />}
                  onClick={() => setShowPivotGrouping(!showPivotGrouping)}
                  sx={{ borderRadius: '8px' }}
                >
                  {showPivotGrouping ? 'Tutup' : 'Pivot Mode'}
                </Button>
              </Box>
              
              <Collapse in={showPivotGrouping}>
                <Paper sx={{ p: 3, borderRadius: '12px', backgroundColor: 'rgba(33, 150, 243, 0.05)' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    📊 Pilih Field untuk Grouping:
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={groupBy.includes('areas')}
                            onChange={() => handleGroupByChange('areas')}
                            color="primary"
                          />
                        }
                        label="🏢 Per Cabang"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={groupBy.includes('role')}
                            onChange={() => handleGroupByChange('role')}
                            color="primary"
                          />
                        }
                        label="👥 Per Role"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={groupBy.includes('shifts')}
                            onChange={() => handleGroupByChange('shifts')}
                            color="primary"
                          />
                        }
                        label="⏰ Per Shift"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={groupBy.includes('contractStatus')}
                            onChange={() => handleGroupByChange('contractStatus')}
                            color="primary"
                          />
                        }
                        label="📋 Per Status"
                      />
                    </Grid>
                  </Grid>
                  
                  {groupBy.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        🔀 Aktif Grouping:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {groupBy.map((field) => {
                          const fieldLabels: { [key: string]: string } = {
                            areas: '🏢 Cabang',
                            role: '👥 Role', 
                            shifts: '⏰ Shift',
                            contractStatus: '📋 Status'
                          };
                          
                          return (
                            <Chip
                              key={field}
                              label={fieldLabels[field] || field}
                              onDelete={() => handleGroupByChange(field)}
                              color="primary"
                              variant="filled"
                              size="small"
                              sx={{ 
                                borderRadius: '16px',
                                '& .MuiChip-deleteIcon': {
                                  color: 'primary.contrastText'
                                }
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Collapse>
            </Box>
            
            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<i className="tabler-refresh" />}
                  onClick={handleResetAllFilters}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    borderColor: 'warning.main',
                    color: 'warning.main',
                    '&:hover': {
                      borderColor: 'warning.dark',
                      backgroundColor: 'warning.50'
                    }
                  }}
                >
                  🔄 Reset Semua Filter
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                💡 Tip: Gunakan kombinasi filter untuk analisis data yang lebih spesifik
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </LocalizationProvider>
  );
};

export default TableFilters;