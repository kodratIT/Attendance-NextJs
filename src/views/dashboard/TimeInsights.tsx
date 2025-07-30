'use client'

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import { styled } from '@mui/material/styles'

const TimeSlot = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-2px)'
  }
}))

interface TimeSlotData {
  hour: string;
  checkIns: number;
  checkOuts: number;
  peak: boolean;
}

interface InsightData {
  peakHours: {
    checkIn: string;
    checkOut: string;
  };
  avgCheckInTime: string;
  avgCheckOutTime: string;
  totalHoursToday: number;
  lateArrivals: number;
}

const TimeInsights = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([])
  const [insights, setInsights] = useState<InsightData>({
    peakHours: {
      checkIn: '08:00',
      checkOut: '17:00'
    },
    avgCheckInTime: '08:15',
    avgCheckOutTime: '17:30',
    totalHoursToday: 8.5,
    lateArrivals: 3
  })

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Generate mock time slot data
  useEffect(() => {
    const generateTimeSlots = () => {
      const slots: TimeSlotData[] = []
      const hours = ['07:00', '08:00', '09:00', '12:00', '13:00', '17:00', '18:00']
      
      hours.forEach(hour => {
        slots.push({
          hour,
          checkIns: Math.floor(Math.random() * 20) + 1,
          checkOuts: Math.floor(Math.random() * 15) + 1,
          peak: ['08:00', '17:00'].includes(hour)
        })
      })
      
      setTimeSlots(slots)
    }

    generateTimeSlots()
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTimeSlotColor = (slot: TimeSlotData) => {
    if (slot.peak) return 'primary'
    if (slot.checkIns > 10) return 'success'
    return 'default'
  }

  return (
    <Grid container spacing={3}>
      {/* Current Time & Date */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Current Time" />
          <CardContent>
            <Box textAlign="center">
              <Typography variant="h3" color="primary" fontWeight="bold">
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="h6" color="text.secondary" mt={1}>
                {formatDate(currentTime)}
              </Typography>
              <Chip 
                label="WIB (UTC+7)" 
                size="small" 
                color="info" 
                sx={{ mt: 2 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Today's Insights */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Today's Insights" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'success.light', mx: 'auto', mb: 1 }}>
                    <i className="tabler-clock-hour-8" />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Avg Check-in
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {insights.avgCheckInTime}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'info.light', mx: 'auto', mb: 1 }}>
                    <i className="tabler-clock-hour-5" />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Avg Check-out
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {insights.avgCheckOutTime}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'warning.light', mx: 'auto', mb: 1 }}>
                    <i className="tabler-clock-exclamation" />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Late Arrivals
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {insights.lateArrivals}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Avatar sx={{ bgcolor: 'primary.light', mx: 'auto', mb: 1 }}>
                    <i className="tabler-hourglass" />
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Total Hours
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {insights.totalHoursToday}h
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Time Slots Activity */}
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title="Hourly Activity" 
            subheader="Check-in and check-out patterns throughout the day"
          />
          <CardContent>
            <Grid container spacing={2}>
              {timeSlots.map((slot, index) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                  <TimeSlot>
                    <Box textAlign="center">
                      <Typography variant="h6" fontWeight="bold" mb={1}>
                        {slot.hour}
                      </Typography>
                      
                      {slot.peak && (
                        <Chip 
                          label="Peak" 
                          size="small" 
                          color="primary" 
                          sx={{ mb: 1 }}
                        />
                      )}
                      
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Box>
                          <Typography variant="caption" color="success.main">
                            <i className="tabler-login" style={{ fontSize: '0.75rem' }} />
                            {slot.checkIns}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="info.main">
                            <i className="tabler-logout" style={{ fontSize: '0.75rem' }} />
                            {slot.checkOuts}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Activity bar */}
                      <Box
                        sx={{
                          height: 4,
                          bgcolor: 'grey.200',
                          borderRadius: 2,
                          mt: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${Math.min((slot.checkIns / 20) * 100, 100)}%`,
                            bgcolor: slot.peak ? 'primary.main' : 'success.main',
                            transition: 'width 0.3s ease-in-out'
                          }}
                        />
                      </Box>
                    </Box>
                  </TimeSlot>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TimeInsights
