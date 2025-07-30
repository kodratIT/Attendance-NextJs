'use client'

import React, { useState, useEffect } from 'react'
import { Grid, Box, Tab, Tabs, Paper, Typography, Button } from '@mui/material'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'

// Import all attendance components
import UserListTable from './index'
import InsightsDashboard from '@/components/insights/InsightsDashboard'
import RealTimeChart from '@/components/charts/RealTimeChart'
import HeatMap from '@/components/charts/HeatMap'
import SavedFilters, { SavedFilter } from '@/components/attendance/SavedFilters'
import VirtualizedTable from '@/components/table/VirtualizedTable'
import DrillDown from '@/components/attendance/DrillDown'
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics'
import useCacheManager from '@/hooks/useCacheManager'

interface AttendanceDashboardProps {
  tableData?: AttendanceRowType[]
}

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
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `attendance-tab-${index}`,
    'aria-controls': `attendance-tabpanel-${index}`,
  }
}

const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ tableData = [] }) => {
  const [tabValue, setTabValue] = useState(0)
  const [selectedRow, setSelectedRow] = useState<AttendanceRowType | null>(null)
  const [currentFilters, setCurrentFilters] = useState<SavedFilter['filters']>({
    dateRange: { startDate: null, endDate: null },
    status: [],
    departments: [],
    employees: [],
    sortBy: '',
    sortOrder: 'asc'
  })
  
  // Initialize cache manager for attendance data
  const cacheManager = useCacheManager<AttendanceRowType[]>({
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 50,
    enableOptimistic: true
  })

  // Auto-apply default filter on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('attendance-saved-filters')
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        const defaultFilter = parsed.find((f: SavedFilter) => f.isDefault)
        if (defaultFilter) {
          setCurrentFilters(defaultFilter.filters)
        }
      } catch (error) {
        console.error('Error loading default filter:', error)
      }
    }
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleApplyFilter = (filters: SavedFilter['filters']) => {
    setCurrentFilters(filters)
    // You can add additional filtering logic here
    console.log('Applied filters:', filters)
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="attendance dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Attendance Table" {...a11yProps(0)} />
          <Tab label="Analytics Dashboard" {...a11yProps(1)} />
          <Tab label="Real-time Charts" {...a11yProps(2)} />
          <Tab label="Heat Map" {...a11yProps(3)} />
          <Tab label="Saved Filters" {...a11yProps(4)} />
          <Tab label="Virtual Table" {...a11yProps(5)} />
          <Tab label="Drill Down" {...a11yProps(6)} />
          <Tab label="Predictive Analytics" {...a11yProps(7)} />
          <Tab label="Cache Management" {...a11yProps(8)} />
        </Tabs>
      </Paper> */}

      <TabPanel value={tabValue} index={0}>
        <UserListTable tableData={tableData} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <InsightsDashboard attendanceData={tableData} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <RealTimeChart />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <HeatMap attendanceData={tableData} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <SavedFilters
              onApplyFilter={handleApplyFilter}
              currentFilters={currentFilters}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Box>
                <h3>Filter Preview</h3>
                <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(currentFilters, null, 2)}
                </pre>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Virtual Table Tab */}
      <TabPanel value={tabValue} index={5}>
        <VirtualizedTable 
          data={tableData} 
          columns={[
            {
              key: 'name',
              label: 'Name',
              width: 200,
              render: (value) => value || '-'
            },
            {
              key: 'shifts',
              label: 'Shift',
              width: 150,
              render: (value) => value || '-'
            },
            {
              key: 'checkIn',
              label: 'Check-In',
              width: 120,
              render: (value) => value?.time || '-'
            },
            {
              key: 'checkOut',
              label: 'Check-Out',
              width: 120,
              render: (value) => value?.time || '-'
            },
            {
              key: 'status',
              label: 'Status',
              width: 100,
              render: (value) => value || '-'
            }
          ]} 
          hasNextPage={false} 
          loading={false} 
        />
      </TabPanel>

      {/* Drill Down Tab */}
      <TabPanel value={tabValue} index={6}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Select Employee for Drill Down
              </Typography>
              {tableData.map((row, index) => (
                <Box key={index} mb={1}>
                  <Button 
                    variant={selectedRow?.name === row.name ? "contained" : "outlined"}
                    onClick={() => setSelectedRow(row)}
                    fullWidth
                  >
                    {row.name}
                  </Button>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            {selectedRow && <DrillDown row={selectedRow} />}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Predictive Analytics Tab */}
      <TabPanel value={tabValue} index={7}>
        <PredictiveAnalytics data={tableData} />
      </TabPanel>

      {/* Cache Management Tab */}
      <TabPanel value={tabValue} index={8}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Cache Statistics
              </Typography>
              <Typography variant="body1">Cache Size: {cacheManager.stats.cacheSize}</Typography>
              <Typography variant="body1">Optimistic Updates: {cacheManager.stats.optimisticUpdates}</Typography>
              <Typography variant="body1">Hit Rate: {cacheManager.stats.hitRate}%</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Cache Actions
              </Typography>
              <Box display="flex" gap={2} flexDirection="column">
                <Button variant="outlined" onClick={() => cacheManager.clear()}>
                  Clear Cache
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => {
                    cacheManager.set('attendance-data', tableData)
                  }}
                >
                  Cache Current Data
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  )
}

export default AttendanceDashboard
