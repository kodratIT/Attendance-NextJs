'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getSession } from 'next-auth/react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';
import type { AreaType } from '@/types/areaTypes';
import AttendanceChart from '@views/dashboard/AttendanceChart';
import DepartmentChart from '@views/dashboard/DepartmentChart';
import EnhancedKPICard from '@views/dashboard/EnhancedKPICard';
import TimeInsights from '@views/dashboard/TimeInsights';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import MenuItem from '@mui/material/MenuItem';
import TablePagination from '@mui/material/TablePagination';
import CustomTextField from '@core/components/mui/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import EmployeeDetailModal from '@/components/modals/EmployeeDetailModal';
import { addSamplePhotos } from '@/utils/samplePhotoData';
import TrendAnalysisChart from '@/components/charts/TrendAnalysisChart';
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import InsightsDashboard from '@/components/insights/InsightsDashboard';

const Loading = () => (
  <div className="flex justify-center items-center min-h-[200px]">
    <CircularProgress />
  </div>
);

const LoadingSkeleton = () => (
  <Grid container spacing={6}>
    {Array.from({ length: 4 }).map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <Card>
          <CardContent>
            <Skeleton variant="text" height={24} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="rectangular" height={60} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

// Import tambahan untuk table
import { 
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
} from '@tanstack/react-table';
import TablePaginationComponent from '@components/TablePaginationComponent';
import tableStyles from '@core/styles/table.module.css';

// Enhanced Attendance History Component with Table Implementation
const AttendanceHistoryWithFilter = ({ attendanceData, areaData, loading }: { attendanceData: AttendanceRowType[], areaData: AreaType[], loading: boolean }) => {
  const [filteredData, setFilteredData] = useState<AttendanceRowType[]>(attendanceData);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceRowType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Set areas for filter
  const uniqueAreas = useMemo(() => {
    return areaData.map((area: AreaType) => area.name);
  }, [areaData]);

  // Filter data based on selected filters
  useEffect(() => {
    let filtered = attendanceData;
    
    if (selectedArea !== 'all') {
      filtered = filtered.filter(item => item.areas === selectedArea);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === selectedStatus.toLowerCase());
    }
    
    setFilteredData(filtered);
  }, [attendanceData, selectedArea, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      default: return 'default';
    }
  };

  const handleEmployeeClick = useCallback((employee: AttendanceRowType) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedEmployee(null);
  }, []);

  // Column Definitions menggunakan createColumnHelper
  const columnHelper = createColumnHelper<AttendanceRowType>();
  
  const columns = useMemo<ColumnDef<AttendanceRowType, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Nama Karyawan',
        cell: ({ row }) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar 
              src={row.original.avatar}
              sx={{ 
                width: 32,
                height: 32,
                bgcolor: `${getStatusColor(row.original.status)}.light`,
                color: `${getStatusColor(row.original.status)}.main`,
              }}
            >
              {row.original.name.charAt(0)}
            </Avatar>
            <Typography variant="body2" fontWeight="medium">
              {row.original.name}
            </Typography>
          </Box>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip 
            label={row.original.status}
            color={getStatusColor(row.original.status) as any}
            size="small"
            variant="tonal"
          />
        ),
      }),
      columnHelper.accessor('checkIn.time', {
        header: 'Check In',
        cell: ({ row }) => (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="body2">
              {row.original.checkIn?.time || '-'}
            </Typography>
            {row.original.checkIn?.imageUrl && (
              <i className="tabler-camera" style={{ fontSize: '0.875rem', color: '#28a745' }} title="Foto check-in tersedia" />
            )}
          </Box>
        ),
      }),
      columnHelper.accessor('checkOut.time', {
        header: 'Check Out',
        cell: ({ row }) => (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="body2">
              {row.original.checkOut?.time || '-'}
            </Typography>
            {row.original.checkOut?.imageUrl && (
              <i className="tabler-camera" style={{ fontSize: '0.875rem', color: '#dc3545' }} title="Foto check-out tersedia" />
            )}
          </Box>
        ),
      }),
      columnHelper.accessor('areas', {
        header: 'Area',
        cell: ({ row }) => (
          <Typography variant="body2">
            {row.original.areas}
          </Typography>
        ),
      }),
      columnHelper.accessor('shifts', {
        header: 'Shift',
        cell: ({ row }) => (
          <Typography variant="body2">
            {row.original.shifts}
          </Typography>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <IconButton 
            size="small"
            onClick={() => handleEmployeeClick(row.original)}
          >
            <i className="tabler-eye" />
          </IconButton>
        ),
      }),
    ],
    [getStatusColor, handleEmployeeClick]
  );

  // React Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    filterFns: {
      fuzzy: (row, columnId, value) => String(row.getValue(columnId))
        .toLowerCase()
        .includes(String(value).toLowerCase())
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row items-start sm:items-center justify-between flex-wrap">
        <div className="flex items-center gap-2">
          <Typography>Show</Typography>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="is-[70px]"
          >
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="25">25</MenuItem>
            <MenuItem value="50">50</MenuItem>
          </CustomTextField>
        </div>

        <div className="flex flex-wrap gap-2">
          <CustomTextField
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cari karyawan..."
            className="is-full sm:is-auto"
            size="small"
          />
          <CustomTextField
            select
            size="small"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Semua Area</MenuItem>
            {uniqueAreas.map((area) => (
              <MenuItem key={area} value={area}>{area}</MenuItem>
            ))}
          </CustomTextField>
          <CustomTextField
            select
            size="small"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">Semua Status</MenuItem>
            <MenuItem value="present">Hadir</MenuItem>
            <MenuItem value="late">Terlambat</MenuItem>
            <MenuItem value="absent">Tidak Hadir</MenuItem>
          </CustomTextField>
        </div>
      </CardContent>

      <div className="overflow-x-auto">
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10">
                  <CircularProgress />
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-10">
                  <Typography color="textSecondary">Tidak ada data absensi</Typography>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
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
      
      {/* Employee Detail Modal */}
      <EmployeeDetailModal 
        open={modalOpen}
        onClose={handleCloseModal}
        employee={selectedEmployee}
      />
    </Card>
  );
};

const AttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttendanceRowType[]>([]);
  const [areaData, setAreaData] = useState<AreaType[]>([]);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [countLate, setCountLate] = useState(0);
  const [countPresent, setCountPresent] = useState(0);
  const [countAbsent, setCountAbsent] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [chartData, setChartData] = useState({
    attendance: {
      dates: [] as string[],
      onTime: [] as number[],
      late: [] as number[],
      absent: [] as number[],
    },
    department: {
      areas: [] as string[],
      counts: [] as number[],
    }
  });

  const { showNotification } = useNotification();

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  // Optimized fetch function with caching
  const fetchDataOptimized = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getSession();
      if (!session) return;

      const role = session?.user?.role?.name;
      const userAreaIds: string[] = Array.isArray(session?.user?.areas) ? session.user.areas : [];

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error('❌ NEXT_PUBLIC_API_URL not set');

      // Fetch area data
      const areasRes = await axios.get(`${apiUrl}/api/areas`);
      const areaData = areasRes.data?.data || [];

      // Use current date only for better caching
      const now = new Date();
      now.setHours(now.getHours() + 7);
      const fromDate = now.toISOString().slice(0, 10);

      // Parallel requests for better performance
      const [attendanceRes, usersRes] = await Promise.all([
        axios.get(`${apiUrl}/api/attendance?fromDate=${fromDate}&toDate=${fromDate}`, {
          headers: {
            'Cache-Control': 'max-age=60', // Cache for 1 minute
          },
          timeout: 10000,
        }),
        axios.get(`${apiUrl}/api/users`, {
          headers: {
            'Cache-Control': 'max-age=300', // Cache users for 5 minutes
          },
        })
      ]);

      let attendanceData: AttendanceRowType[] = attendanceRes.data || [];
      let users = usersRes.data || [];

      // Filter data based on role (optimized)
      if (role === 'Admin') {
        attendanceData = attendanceData.filter((row: AttendanceRowType) => {
          return typeof row?.areaId === 'string' && userAreaIds.includes(row.areaId);
        });
        
        users = users.filter((user: any) =>
          Array.isArray(user.areas) &&
          user.areas.some((area: any) => userAreaIds.includes(area.id))
        );
      }

      // Optimized counting using reduce
      const { late, present, absent } = attendanceData.reduce(
        (acc, item) => {
          if (item.status === 'present') acc.present += 1;
          else if (item.status === 'late') acc.late += 1;
          else if (item.status === 'absent') acc.absent += 1;
          return acc;
        },
        {present: 0, late: 0, absent: 0}
      );

      setCountLate(late);
      setCountPresent(present);
      setCountAbsent(absent);
      
      // Add sample photos for testing (remove this in production)
      const attendanceDataWithPhotos = addSamplePhotos(attendanceData);
      setData(attendanceDataWithPhotos);
      
      setEmployeeCount(users.length);
      setAreaData(areaData);

      // Generate optimized mock chart data
      const mockAttendanceData = {
        dates: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        onTime: [present, present-5, present+2, present-1, present+3, present-2, present],
        late: [late, late+2, late-1, late+1, late-1, late+2, late],
        absent: [absent, absent+1, absent-1, absent, absent+1, absent-1, absent],
      };

      // Optimized department data generation
      const departmentCounts = attendanceData.reduce((acc: { [key: string]: number }, item) => {
        const areaName = item.areas || 'Unknown';
        acc[areaName] = (acc[areaName] || 0) + 1;
        return acc;
      }, {});

      const mockDepartmentData = {
        areas: Object.keys(departmentCounts).length > 0 ? Object.keys(departmentCounts) : ['Jakarta', 'Bandung', 'Surabaya'],
        counts: Object.keys(departmentCounts).length > 0 ? Object.values(departmentCounts) : [present, late, absent],
      };

      setChartData({
        attendance: mockAttendanceData,
        department: mockDepartmentData,
      });

    } catch (error: any) {
      console.error('❌ Error:', error.message || error);
      setData([]);
      setEmployeeCount(0);
      showNotification('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchDataOptimized();
    
    // Setup auto-refresh every 5 minutes (reduced frequency)
    const interval = setInterval(() => {
      fetchDataOptimized();
    }, 300000); // 5 minutes instead of 1 minute

    return () => clearInterval(interval);
  }, [fetchDataOptimized]);

  // Memoized statistics calculation
  const statistics = useMemo(() => {
    const totalEmployees = employeeCount;
    const attendanceRate = totalEmployees > 0 ? ((countPresent + countLate) / totalEmployees * 100).toFixed(1) : '0';
    const lateRate = totalEmployees > 0 ? (countLate / totalEmployees * 100).toFixed(1) : '0';
    
    return {
      totalEmployees,
      attendanceRate,
      lateRate,
      presentCount: countPresent,
      lateCount: countLate,
      absentCount: countAbsent
    };
  }, [employeeCount, countPresent, countLate, countAbsent]);

  if (loading) return <LoadingSkeleton />;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Modern Header with Statistics */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Dashboard Absensi
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Pantau kehadiran karyawan secara real-time
            </Typography>
          </Box>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={fetchDataOptimized} 
              disabled={loading}
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: 'white' }
              }}
            >
              {loading ? <CircularProgress size={24} /> : <i className="tabler-refresh" />}
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {statistics.presentCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hadir
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {statistics.lateCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Terlambat
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="bold" color="error.main">
                {statistics.absentCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tidak Hadir
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="bold" color="info.main">
                {statistics.attendanceRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tingkat Kehadiran
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ width: '100%', mb: 2 }}>
        {/* Tab Navigation */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Riwayat Absensi" icon={<i className="tabler-history" />} iconPosition="start" />
          <Tab label="Analytics" icon={<i className="tabler-chart-pie" />} iconPosition="start" />
          <Tab label="Analytics Treand" icon={<i className="tabler-brain" />} iconPosition="start" />
           <Tab label="Predictive Analytics" icon={<i className="tabler-chart-bar" />} iconPosition="start" />
          <Tab label="Insights" icon={<i className="tabler-bulb" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}

      {/* Attendance History Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={6}>
          {/* Enhanced Attendance History with Filters */}
          <Grid item xs={12}>
            <AttendanceHistoryWithFilter attendanceData={data} areaData={areaData} loading={loading} />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Analytics Dashboard Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ p: 2 }}>
          <InsightsDashboard attendanceData={data} />
        </Box>
      </TabPanel>

     

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={6}>
          {/* Trend Analysis Chart */}
          <Grid item xs={12}>
            <TrendAnalysisChart period="week" />
          </Grid>
          
          {/* Attendance Chart */}
          <Grid item xs={12} md={6}>
            <AttendanceChart data={chartData.attendance} />
          </Grid>
          
          {/* Department Chart */}
          <Grid item xs={12} md={6}>
            <DepartmentChart data={chartData.department} />
          </Grid>
        </Grid>
      </TabPanel>

       {/* Predictive Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ p: 2 }}>
          <PredictiveAnalytics data={data} />
        </Box>
      </TabPanel>

      {/* Insights Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={6}>
          {/* Time Insights */}
          <Grid item xs={12} md={6}>
            <TimeInsights />
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <EnhancedKPICard
                  title="Tingkat Kehadiran"
                  subtitle="Persentase kehadiran hari ini"
                  currentValue={parseFloat(statistics.attendanceRate)}
                  previousValue={parseFloat(statistics.attendanceRate) - 5}
                  target={95}
                  icon="tabler-users"
                  color="primary"
                />
              </Grid>
              <Grid item xs={12}>
                <EnhancedKPICard
                  title="Keterlambatan"
                  subtitle="Persentase keterlambatan"
                  currentValue={parseFloat(statistics.lateRate)}
                  previousValue={parseFloat(statistics.lateRate) + 2}
                  icon="tabler-clock"
                  color="warning"
                />
              </Grid>
              <Grid item xs={12}>
                <EnhancedKPICard
                  title="Total Karyawan"
                  subtitle="Jumlah karyawan aktif"
                  currentValue={statistics.totalEmployees}
                  previousValue={statistics.totalEmployees - 2}
                  icon="tabler-users"
                  color="info"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </TabPanel>

    </Box>
  );
};

export default AttendancePage;

