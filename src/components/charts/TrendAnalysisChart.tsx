'use client'

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, Typography, Box, Tabs, Tab } from '@mui/material';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface TrendData {
  date: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  attendanceRate: number;
}

interface TrendAnalysisChartProps {
  data?: TrendData[];
  period?: 'week' | 'month' | 'quarter';
  title?: string;
}

// Generate sample trend data
const generateTrendData = (days: number): TrendData[] => {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  
  return eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
    const present = Math.floor(Math.random() * 50) + 30;
    const late = Math.floor(Math.random() * 15) + 5;
    const absent = Math.floor(Math.random() * 10) + 2;
    const total = present + late + absent;
    
    return {
      date: format(date, 'MMM dd'),
      present,
      late,
      absent,
      total,
      attendanceRate: Math.round((present + late) / total * 100)
    };
  });
};

const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({
  data,
  period = 'week',
  title = 'Trend Analisis Kehadiran'
}) => {
  const [chartType, setChartType] = React.useState<'line' | 'area'>('area');
  
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const chartData = data || generateTrendData(days);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          <Typography variant="body2" fontWeight="bold">{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
              {entry.dataKey === 'attendanceRate' && '%'}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'area') {
      return (
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="present"
            stackId="1"
            stroke="#4caf50"
            fill="#4caf50"
            fillOpacity={0.8}
            name="Hadir"
          />
          <Area
            type="monotone"
            dataKey="late"
            stackId="1"
            stroke="#ff9800"
            fill="#ff9800"
            fillOpacity={0.8}
            name="Terlambat"
          />
          <Area
            type="monotone"
            dataKey="absent"
            stackId="1"
            stroke="#f44336"
            fill="#f44336"
            fillOpacity={0.8}
            name="Tidak Hadir"
          />
        </AreaChart>
      );
    }

    return (
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#e0e0e0' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: '#e0e0e0' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="attendanceRate"
          stroke="#2196f3"
          strokeWidth={3}
          dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
          name="Tingkat Kehadiran (%)"
        />
        <Line
          type="monotone"
          dataKey="present"
          stroke="#4caf50"
          strokeWidth={2}
          dot={{ fill: '#4caf50', strokeWidth: 2, r: 3 }}
          name="Hadir"
        />
        <Line
          type="monotone"
          dataKey="late"
          stroke="#ff9800"
          strokeWidth={2}
          dot={{ fill: '#ff9800', strokeWidth: 2, r: 3 }}
          name="Terlambat"
        />
      </LineChart>
    );
  };

  return (
    <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={title}
        subheader={`Periode ${period === 'week' ? '7 hari' : period === 'month' ? '30 hari' : '90 hari'} terakhir`}
        action={
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={chartType}
              onChange={(_, value) => setChartType(value)}
            >
              <Tab label="Area" value="area" />
              <Tab label="Line" value="line" />
            </Tabs>
          </Box>
        }
      />
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrendAnalysisChart;
