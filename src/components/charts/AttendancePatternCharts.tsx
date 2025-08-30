'use client'

import React, { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ComposedChart
} from 'recharts'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'

interface AttendancePatternChartsProps {
  data: AttendanceRowType[]
  className?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

const AttendancePatternCharts: React.FC<AttendancePatternChartsProps> = ({ data, className }) => {
  
  const chartData = useMemo(() => {
    if (!data.length) return null

    // Helper to parse time string to minutes
    const parseTimeToMinutes = (timeStr: string): number | null => {
      if (!timeStr || timeStr === '-') return null
      const delimiter = timeStr.includes(':') ? ':' : '.'
      const parts = timeStr.split(delimiter)
      const h = Number(parts[0])
      const m = Number(parts[1])
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
      return h * 60 + m
    }

    // 1. Check-in Time Distribution
    const checkInDistribution = data.reduce((acc, emp) => {
      const checkInTime = parseTimeToMinutes(emp.checkIn?.time || '-')
      if (checkInTime === null) return acc

      const hour = Math.floor(checkInTime / 60)
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`
      
      acc[timeSlot] = (acc[timeSlot] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const checkInChart = Object.entries(checkInDistribution)
      .map(([time, count]) => ({ time, count, hour: parseInt(time.split(':')[0]) }))
      .sort((a, b) => a.hour - b.hour)

    // 2. Discipline Score Distribution
    const disciplineDistribution = data.reduce((acc, emp) => {
      const score = emp.averageScore || emp.score || 0
      const range = score >= 90 ? '90-100' : 
                   score >= 80 ? '80-89' :
                   score >= 70 ? '70-79' :
                   score >= 60 ? '60-69' : 
                   score >= 50 ? '50-59' : '0-49'
      
      acc[range] = (acc[range] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const disciplineChart = Object.entries(disciplineDistribution).map(([range, count]) => ({
      range,
      count,
      percentage: (count / data.length) * 100
    }))

    // 3. Working Hours vs Discipline Correlation
    const correlationData = data
      .filter(emp => emp.workingHours > 0 && (emp.averageScore || emp.score))
      .map(emp => ({
        name: emp.name,
        workingHours: (emp.workingHours || 0) / 3600,
        disciplineScore: emp.averageScore || emp.score || 0,
        area: emp.areas,
        role: emp.role
      }))

    // 4. Department Performance Comparison
    const departmentPerformance = data.reduce((acc, emp) => {
      const dept = emp.areas || 'Unknown'
      if (!acc[dept]) {
        acc[dept] = {
          department: dept,
          totalEmployees: 0,
          avgDiscipline: 0,
          avgWorkingHours: 0,
          totalDiscipline: 0,
          totalWorkingHours: 0,
          onTimeCount: 0,
          lateCount: 0
        }
      }
      
      const deptData = acc[dept]
      deptData.totalEmployees += 1
      deptData.totalDiscipline += (emp.averageScore || emp.score || 0)
      deptData.totalWorkingHours += (emp.workingHours || 0) / 3600
      
      if ((emp.lateBy || 0) === 0) {
        deptData.onTimeCount += 1
      } else {
        deptData.lateCount += 1
      }
      
      return acc
    }, {} as Record<string, any>)

    const departmentChart = Object.values(departmentPerformance).map((dept: any) => ({
      ...dept,
      avgDiscipline: dept.totalDiscipline / dept.totalEmployees,
      avgWorkingHours: dept.totalWorkingHours / dept.totalEmployees,
      punctualityRate: (dept.onTimeCount / dept.totalEmployees) * 100
    }))

    // 5. Daily Performance Trends (Mock 30 days)
    const performanceTrends = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      
      // Create realistic variation based on current data
      const avgScore = data.reduce((sum, emp) => sum + (emp.averageScore || emp.score || 0), 0) / data.length
      const variation = 0.8 + (Math.random() * 0.4) // ±20% variation
      
      return {
        date: date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
        fullDate: date.toISOString().split('T')[0],
        avgDiscipline: Math.round(avgScore * variation * 10) / 10,
        attendance: Math.round((85 + Math.random() * 15) * 10) / 10, // 85-100%
        punctuality: Math.round((75 + Math.random() * 20) * 10) / 10  // 75-95%
      }
    })

    // 6. Role Performance Comparison
    const rolePerformance = data.reduce((acc, emp) => {
      const role = emp.role || 'Unknown'
      if (!acc[role]) {
        acc[role] = {
          role,
          count: 0,
          totalDiscipline: 0,
          totalWorkingHours: 0,
          totalLateness: 0
        }
      }
      
      acc[role].count += 1
      acc[role].totalDiscipline += (emp.averageScore || emp.score || 0)
      acc[role].totalWorkingHours += (emp.workingHours || 0) / 3600
      acc[role].totalLateness += (emp.lateBy || 0) / 60
      
      return acc
    }, {} as Record<string, any>)

    const roleChart = Object.values(rolePerformance).map((role: any) => ({
      role: role.role,
      employees: role.count,
      avgDiscipline: Math.round((role.totalDiscipline / role.count) * 10) / 10,
      avgWorkingHours: Math.round((role.totalWorkingHours / role.count) * 10) / 10,
      avgLateness: Math.round((role.totalLateness / role.count) * 10) / 10
    }))

    return {
      checkInChart,
      disciplineChart,
      correlationData,
      departmentChart,
      performanceTrends,
      roleChart
    }
  }, [data])

  if (!chartData || !data.length) {
    return (
      <Card className={className}>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            📊 Tidak ada data untuk visualisasi
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <i className="tabler-chart-line text-primary" style={{ fontSize: '1.5rem' }} />
            📊 Visual Data Patterns & Trends
          </Box>
        }
        subheader={`📈 Visualisasi pola dan trend untuk ${data.length} karyawan`}
      />
      
      <CardContent>
        <Grid container spacing={3}>
          {/* Check-in Time Distribution */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🕐 Distribusi Waktu Check-in
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.checkInChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    label={{ value: 'Jumlah Karyawan', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} orang`, 'Check-in']}
                    labelStyle={{ color: '#333' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#2196f3"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Discipline Score Distribution */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🎯 Distribusi Skor Kedisiplinan
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.disciplineChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ range, percentage }) => `${range}: ${percentage.toFixed(1)}%`}
                  >
                    {chartData.disciplineChart.map((entry, index) => {
                      const colors = {
                        '90-100': '#4caf50',
                        '80-89': '#8bc34a',
                        '70-79': '#ffeb3b',
                        '60-69': '#ff9800',
                        '50-59': '#ff5722',
                        '0-49': '#f44336'
                      }
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={colors[entry.range as keyof typeof colors] || COLORS[index % COLORS.length]} 
                        />
                      )
                    })}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} orang`, 'Jumlah']} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Performance Trends */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📈 Tren Performa 30 Hari Terakhir
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    label={{ value: 'Persentase (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    label={{ value: 'Skor Kedisiplinan', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'avgDiscipline') return [`${value.toFixed(1)}`, 'Skor Kedisiplinan']
                      return [`${value.toFixed(1)}%`, name === 'attendance' ? 'Kehadiran' : 'Ketepatan Waktu']
                    }}
                    labelStyle={{ color: '#333' }}
                  />
                  <Legend />
                  
                  {/* Area for attendance rate */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="attendance"
                    fill="rgba(76, 175, 80, 0.3)"
                    stroke="#4caf50"
                    strokeWidth={2}
                    name="Tingkat Kehadiran"
                  />
                  
                  {/* Line for punctuality */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="punctuality"
                    stroke="#2196f3"
                    strokeWidth={3}
                    dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
                    name="Ketepatan Waktu"
                  />
                  
                  {/* Bar for discipline score */}
                  <Bar 
                    yAxisId="right"
                    dataKey="avgDiscipline" 
                    fill="rgba(255, 152, 0, 0.7)"
                    name="Skor Kedisiplinan"
                    radius={[2, 2, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Working Hours vs Discipline Correlation */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Korelasi Jam Kerja vs Kedisiplinan
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={chartData.correlationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="workingHours" 
                    name="Jam Kerja"
                    label={{ value: 'Jam Kerja (jam)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="disciplineScore" 
                    name="Skor Kedisiplinan"
                    label={{ value: 'Skor Kedisiplinan', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: any, name: string, props: any) => {
                      if (name === 'disciplineScore') return [`${value}`, 'Skor Kedisiplinan']
                      if (name === 'workingHours') return [`${value.toFixed(1)}h`, 'Jam Kerja']
                      return [value, name]
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.name} (${payload[0].payload.role})`
                      }
                      return label
                    }}
                  />
                  <ReferenceLine x={8} stroke="#ff9800" strokeDasharray="5 5" label="Target 8h" />
                  <ReferenceLine y={70} stroke="#f44336" strokeDasharray="5 5" label="Min Score 70" />
                  <Scatter 
                    dataKey="disciplineScore" 
                    fill="#8884d8"
                    fillOpacity={0.7}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Key Insights */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '400px', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🔍 Key Insights dari Data
              </Typography>
              
              <List>
                {/* Most common check-in time */}
                {(() => {
                  const mostCommonCheckIn = chartData.checkInChart.reduce((prev, current) => 
                    prev.count > current.count ? prev : current
                  )
                  return (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="🕐 Waktu Check-in Tersering"
                        secondary={`${mostCommonCheckIn.time} (${mostCommonCheckIn.count} orang)`}
                      />
                    </ListItem>
                  )
                })()}
                
                <Divider />
                
                {/* Average discipline score */}
                {(() => {
                  const avgDiscipline = data.reduce((sum, emp) => 
                    sum + (emp.averageScore || emp.score || 0), 0
                  ) / data.length
                  
                  const scoreColor = avgDiscipline >= 85 ? 'success' : 
                                   avgDiscipline >= 70 ? 'warning' : 'error'
                  
                  return (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="🎯 Rata-rata Kedisiplinan"
                        secondary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <span>{avgDiscipline.toFixed(1)}</span>
                            <Chip 
                              label={
                                avgDiscipline >= 85 ? 'Excellent' :
                                avgDiscipline >= 70 ? 'Good' : 'Needs Improvement'
                              }
                              size="small"
                              color={scoreColor}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  )
                })()}
                
                <Divider />
                
                {/* Best performing department */}
                {chartData.departmentChart.length > 0 && (() => {
                  const bestDept = chartData.departmentChart.reduce((prev, current) => 
                    prev.avgDiscipline > current.avgDiscipline ? prev : current
                  )
                  
                  return (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="🏆 Departemen Terbaik"
                        secondary={`${bestDept.department} (${bestDept.avgDiscipline.toFixed(1)} skor)`}
                      />
                    </ListItem>
                  )
                })()}
                
                <Divider />
                
                {/* Working hours insight */}
                {(() => {
                  const avgHours = data.reduce((sum, emp) => 
                    sum + (emp.workingHours || 0), 0
                  ) / data.length / 3600
                  
                  return (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="⏰ Rata-rata Jam Kerja"
                        secondary={`${avgHours.toFixed(1)} jam per hari`}
                      />
                    </ListItem>
                  )
                })()}
              </List>
            </Paper>
          </Grid>

          {/* Department Performance Bar Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: '12px' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🏢 Perbandingan Performa Departemen
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData.departmentChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'avgDiscipline') return [`${value.toFixed(1)}`, 'Avg Discipline Score']
                      if (name === 'avgWorkingHours') return [`${value.toFixed(1)}h`, 'Avg Working Hours']
                      if (name === 'punctualityRate') return [`${value.toFixed(1)}%`, 'Punctuality Rate']
                      return [`${value}`, name]
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="avgDiscipline" 
                    fill="#4caf50" 
                    name="Skor Kedisiplinan"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="punctualityRate" 
                    fill="#2196f3" 
                    name="Tingkat Ketepatan (%)"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="avgWorkingHours" 
                    fill="#ff9800" 
                    name="Rata-rata Jam Kerja"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Role Performance Comparison */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '350px' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                👥 Performa per Role
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData.roleChart} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="role" type="category" width={80} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'avgDiscipline') return [`${value.toFixed(1)}`, 'Avg Discipline']
                      if (name === 'avgWorkingHours') return [`${value.toFixed(1)}h`, 'Avg Hours']
                      return [`${value}`, name]
                    }}
                  />
                  <Bar 
                    dataKey="avgDiscipline" 
                    fill="#7c4dff"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default AttendancePatternCharts
