'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

interface AttendanceChartProps {
  data: {
    dates: string[]
    onTime: number[]
    late: number[]
    absent: number[]
  }
  title?: string
  subheader?: string
}

const AttendanceChart = ({ data, title = "Tren Kehadiran", subheader = "7 Hari Terakhir" }: AttendanceChartProps) => {
  const theme = useTheme()

  const series = [
    {
      name: 'Tepat Waktu',
      data: data.onTime,
      color: 'var(--mui-palette-success-main)'
    },
    {
      name: 'Terlambat',
      data: data.late,
      color: 'var(--mui-palette-warning-main)'
    },
    {
      name: 'Tidak Hadir',
      data: data.absent,
      color: 'var(--mui-palette-error-main)'
    }
  ]

  const options: ApexOptions = {
    chart: {
      type: 'line',
      height: 300,
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['var(--mui-palette-success-main)', 'var(--mui-palette-warning-main)', 'var(--mui-palette-error-main)'],
    dataLabels: { enabled: false },
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '13px',
      labels: { colors: 'var(--mui-palette-text-secondary)' }
    },
    grid: {
      show: true,
      borderColor: 'var(--mui-palette-divider)',
      strokeDashArray: 2
    },
    xaxis: {
      categories: data.dates,
      labels: {
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'var(--mui-palette-text-disabled)',
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize as string
        }
      }
    },
    tooltip: {
      theme: 'dark',
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number) => `${value} orang`
      }
    },
    markers: {
      size: 4,
      hover: { size: 6 }
    }
  }

  // Calculate trend
  const currentTotal = data.onTime[data.onTime.length - 1] + data.late[data.late.length - 1] + data.absent[data.absent.length - 1]
  const previousTotal = data.onTime[data.onTime.length - 2] + data.late[data.late.length - 2] + data.absent[data.absent.length - 2]
  const trendPercentage = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0
  const isPositiveTrend = trendPercentage >= 0

  return (
    <Card>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <Chip
            size="small"
            variant="tonal"
            label={`${isPositiveTrend ? '+' : ''}${trendPercentage.toFixed(1)}%`}
            color={isPositiveTrend ? 'success' : 'error'}
          />
        }
      />
      <CardContent>
        <AppReactApexCharts
          type="line"
          height={300}
          width="100%"
          series={series}
          options={options}
        />
      </CardContent>
    </Card>
  )
}

export default AttendanceChart
