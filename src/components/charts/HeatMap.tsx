'use client'

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Grid } from '@mui/material';
import type { AttendanceRowType } from '@/types/attendanceRowTypes';

interface HeatMapProps {
  attendanceData: AttendanceRowType[];
}

const HeatMap: React.FC<HeatMapProps> = ({ attendanceData }) => {
  // Generate heat map data berdasarkan jam dan hari
  const heatMapData = useMemo(() => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const data: { [key: string]: { [key: number]: number } } = {};
    
    days.forEach(day => {
      data[day] = {};
      hours.forEach(hour => {
        data[day][hour] = 0;
      });
    });

    // Populate data dari attendance
    attendanceData.forEach(record => {
      if (record.checkIn?.time && record.checkIn.time !== '-') {
        const checkInTime = new Date(`2024-01-01 ${record.checkIn.time}`);
        const hour = checkInTime.getHours();
        
        // Simulate day of week (untuk demo)
        const dayIndex = Math.floor(Math.random() * 7);
        const day = days[dayIndex];
        
        if (data[day] && data[day][hour] !== undefined) {
          data[day][hour]++;
        }
      }
    });

    return data;
  }, [attendanceData]);

  // Get color intensity based on attendance count
  const getColorIntensity = (count: number, maxCount: number) => {
    if (count === 0) return 'rgba(59, 130, 246, 0.1)'; // Light blue
    const intensity = count / maxCount;
    return `rgba(59, 130, 246, ${Math.min(intensity, 1)})`; // Blue with varying opacity
  };

  // Find max count for normalization
  const maxCount = useMemo(() => {
    let max = 0;
    Object.values(heatMapData).forEach(dayData => {
      Object.values(dayData).forEach(count => {
        max = Math.max(max, count);
      });
    });
    return max;
  }, [heatMapData]);

  return (
    <Card>
      <CardHeader 
        title="Peta Panas Kehadiran"
        subheader="Distribusi kehadiran berdasarkan hari dan jam"
      />
      <CardContent>
        <Box sx={{ overflowX: 'auto' }}>
          <Grid container spacing={0.5} sx={{ minWidth: 800 }}>
            {/* Header untuk jam */}
            <Grid item xs={1}>
              <Box sx={{ height: 30, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight="bold">Hari/Jam</Typography>
              </Box>
            </Grid>
            {Array.from({ length: 24 }, (_, hour) => (
              <Grid item xs={0.45} key={hour}>
                <Box sx={{ 
                  height: 30, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  {hour.toString().padStart(2, '0')}
                </Box>
              </Grid>
            ))}
            
            {/* Data rows */}
            {Object.entries(heatMapData).map(([day, hourData]) => (
              <React.Fragment key={day}>
                <Grid item xs={1}>
                  <Box sx={{ 
                    height: 30, 
                    display: 'flex', 
                    alignItems: 'center',
                    paddingLeft: 1
                  }}>
                    <Typography variant="caption" fontWeight="bold">
                      {day}
                    </Typography>
                  </Box>
                </Grid>
                {Object.entries(hourData).map(([hour, count]) => (
                  <Grid item xs={0.45} key={`${day}-${hour}`}>
                    <Box
                      sx={{
                        height: 30,
                        backgroundColor: getColorIntensity(count, maxCount),
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          '& .count-text': {
                            color: 'white'
                          }
                        }
                      }}
                      title={`${day} ${hour}:00 - ${count} kehadiran`}
                    >
                      {count > 0 && (
                        <Typography 
                          variant="caption" 
                          className="count-text"
                          sx={{ fontSize: '9px', color: count > maxCount * 0.7 ? 'white' : 'inherit' }}
                        >
                          {count}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </React.Fragment>
            ))}
          </Grid>
          
          {/* Legend */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption">Intensitas:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(0,0,0,0.1)' }} />
              <Typography variant="caption">Rendah</Typography>
              <Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(59, 130, 246, 0.5)', border: '1px solid rgba(0,0,0,0.1)' }} />
              <Typography variant="caption">Sedang</Typography>
              <Box sx={{ width: 20, height: 20, backgroundColor: 'rgba(59, 130, 246, 1)', border: '1px solid rgba(0,0,0,0.1)' }} />
              <Typography variant="caption">Tinggi</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HeatMap;
