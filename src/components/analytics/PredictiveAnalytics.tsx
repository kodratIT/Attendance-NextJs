'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Chip,
  LinearProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts'
import type { AttendanceRowType } from '@/types/attendanceRowTypes'

interface PredictiveAnalyticsProps {
  data: AttendanceRowType[]
  className?: string
}

interface PredictionData {
  date: string
  actual: number
  predicted: number
  confidence: number
}

interface Anomaly {
  id: string
  type: 'attendance_drop' | 'unusual_pattern' | 'late_spike' | 'early_departure'
  severity: 'low' | 'medium' | 'high'
  description: string
  date: string
  value: number
  expectedRange: [number, number]
  employee?: string
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ 
  data, 
  className 
}) => {
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)

  // Simple trend prediction algorithm
  const generatePredictions = useMemo(() => {
    if (!data.length) return []

    // Group data by date
    const dailyData = data.reduce((acc, row) => {
      const date = new Date().toISOString().split('T')[0] // Simplified for demo
      if (!acc[date]) {
        acc[date] = { total: 0, onTime: 0, late: 0 }
      }
      acc[date].total++
      if (row.lateBy === 0) acc[date].onTime++
      else acc[date].late++
      return acc
    }, {} as Record<string, { total: number; onTime: number; late: number }>)

    // Generate predictions for next 7 days
    const predictions: PredictionData[] = []
    const dates = Object.keys(dailyData).sort()
    const recentTrend = dates.slice(-7).map(date => dailyData[date].total)
    
    // Simple linear regression for prediction
    const avgAttendance = recentTrend.reduce((a, b) => a + b, 0) / recentTrend.length
    const trend = recentTrend.length > 1 
      ? (recentTrend[recentTrend.length - 1] - recentTrend[0]) / (recentTrend.length - 1)
      : 0

    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + i)
      
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        actual: 0, // No actual data for future
        predicted: Math.max(0, Math.round(avgAttendance + (trend * i))),
        confidence: Math.max(0.3, 1 - (i * 0.1)) // Decreasing confidence over time
      })
    }

    return predictions
  }, [data])

  // Anomaly detection algorithm
  const detectAnomalies = useMemo(() => {
    if (!data.length) return []

    const anomalies: Anomaly[] = []
    
    // Calculate statistical baselines
    const totalEmployees = data.length
    const avgLateTime = data.reduce((sum, row) => sum + row.lateBy, 0) / totalEmployees
    const stdLateTime = Math.sqrt(
      data.reduce((sum, row) => sum + Math.pow(row.lateBy - avgLateTime, 2), 0) / totalEmployees
    )

    // Detect unusual lateness patterns
    data.forEach((row, index) => {
      // Anomaly 1: Extremely late arrival (more than 2 std deviations)
      if (row.lateBy > avgLateTime + (2 * stdLateTime)) {
        anomalies.push({
          id: `late-${index}`,
          type: 'late_spike',
          severity: row.lateBy > avgLateTime + (3 * stdLateTime) ? 'high' : 'medium',
          description: `${row.name} arrived ${row.lateBy} minutes late (${Math.round(row.lateBy - avgLateTime)} min above average)`,
          date: new Date().toISOString().split('T')[0],
          value: row.lateBy,
          expectedRange: [0, avgLateTime + stdLateTime],
          employee: row.name
        })
      }

      // Anomaly 2: Early departure pattern (if checkout time is unusually early)
      if (row.checkOut?.time && row.checkOut.time !== '-') {
        const checkoutHour = parseInt(row.checkOut.time.split(':')[0])
        if (checkoutHour < 16) { // Before 4 PM
          anomalies.push({
            id: `early-${index}`,
            type: 'early_departure',
            severity: checkoutHour < 14 ? 'high' : 'medium',
            description: `${row.name} checked out early at ${row.checkOut.time}`,
            date: new Date().toISOString().split('T')[0],
            value: checkoutHour,
            expectedRange: [16, 18],
            employee: row.name
          })
        }
      }
    })

    // Anomaly 3: Low attendance pattern
    if (totalEmployees < 10) { // Assuming normal attendance should be higher
      anomalies.push({
        id: 'attendance-drop',
        type: 'attendance_drop',
        severity: totalEmployees < 5 ? 'high' : 'medium',
        description: `Low attendance detected: only ${totalEmployees} employees present`,
        date: new Date().toISOString().split('T')[0],
        value: totalEmployees,
        expectedRange: [15, 25]
      })
    }

    return anomalies.slice(0, 10) // Limit to top 10 anomalies
  }, [data])

  useEffect(() => {
    setLoading(true)
    // Simulate analysis time
    setTimeout(() => {
      setPredictions(generatePredictions)
      setAnomalies(detectAnomalies)
      setLoading(false)
    }, 1500)
  }, [generatePredictions, detectAnomalies])

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  const getSeverityIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'attendance_drop': return 'tabler-trending-down'
      case 'late_spike': return 'tabler-clock-exclamation'
      case 'early_departure': return 'tabler-logout'
      case 'unusual_pattern': return 'tabler-alert-triangle'
      default: return 'tabler-info-circle'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Predictive Analytics & Anomaly Detection
          </Typography>
          <Box mt={2}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Analyzing patterns and detecting anomalies...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Predictive Analytics & Anomaly Detection
        </Typography>

        <Grid container spacing={3}>
          {/* Predictions Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                7-Day Attendance Prediction
              </Typography>
              
              {predictions.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value, name) => {
                        if (name === 'predicted') {
                          return [`${value} employees`, 'Predicted Attendance']
                        }
                        return [value, name]
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#8884d8" 
                      fillOpacity={0.3}
                      fill="#8884d8"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#82ca9d" 
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">No prediction data available</Typography>
              )}
            </Paper>
          </Grid>

          {/* Anomaly Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Anomaly Summary
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  {anomalies.length} anomalies detected
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip 
                    label={`${anomalies.filter(a => a.severity === 'high').length} High`}
                    color="error" 
                    size="small" 
                  />
                  <Chip 
                    label={`${anomalies.filter(a => a.severity === 'medium').length} Medium`}
                    color="warning" 
                    size="small" 
                  />
                  <Chip 
                    label={`${anomalies.filter(a => a.severity === 'low').length} Low`}
                    color="info" 
                    size="small" 
                  />
                </Box>
              </Box>

              {/* Prediction Confidence */}
              <Box mb={2}>
                <Typography variant="body2" gutterBottom>
                  Prediction Confidence
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={predictions.length > 0 ? predictions[0].confidence * 100 : 0}
                  color="success"
                />
                <Typography variant="caption" color="text.secondary">
                  {predictions.length > 0 ? Math.round(predictions[0].confidence * 100) : 0}% confidence for next day
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Anomaly Details */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Detected Anomalies
              </Typography>
              
              {anomalies.length > 0 ? (
                <List>
                  {anomalies.map((anomaly, index) => (
                    <React.Fragment key={anomaly.id}>
                      <ListItem>
                        <ListItemIcon>
                          <i className={getSeverityIcon(anomaly.type)} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {anomaly.description}
                              </Typography>
                              <Chip 
                                label={anomaly.severity.toUpperCase()}
                                color={getSeverityColor(anomaly.severity)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Date: {new Date(anomaly.date).toLocaleDateString()} | 
                              Expected: {anomaly.expectedRange[0]}-{anomaly.expectedRange[1]} | 
                              Actual: {anomaly.value}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < anomalies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="success">
                  No anomalies detected. All patterns appear normal.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PredictiveAnalytics
