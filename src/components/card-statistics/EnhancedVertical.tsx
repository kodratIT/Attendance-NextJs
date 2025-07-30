'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'
import type { ApexOptions } from 'apexcharts'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

export interface EnhancedCardStatsVerticalProps {
  title: string
  subtitle?: string
  stats: string
  avatarIcon: string
  avatarColor?: ThemeColor
  avatarSkin?: 'filled' | 'light' | 'light-static'
  avatarSize?: number
  avatarIconSize?: number
  chipText?: string
  chipColor?: ThemeColor
  trend?: {
    percentage: number
    isPositive: boolean
    previousValue?: number
  }
  chartData?: number[]
  chartColor?: ThemeColor
}

const EnhancedCardStatsVertical = (props: EnhancedCardStatsVerticalProps) => {
  // Props
  const {
    title,
    subtitle,
    stats,
    avatarIcon,
    avatarColor = 'primary',
    avatarSkin = 'light',
    avatarSize = 44,
    avatarIconSize = 28,
    chipText,
    chipColor = 'primary',
    trend,
    chartData,
    chartColor = 'primary'
  } = props

  // Hook
  const theme = useTheme()

  // Mini chart options
  const chartOptions: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    stroke: {
      width: 2,
      curve: 'smooth'
    },
    grid: {
      show: false,
      padding: { bottom: 5 }
    },
    colors: [theme.palette[chartColor].main],
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: { show: false }
  }

  return (
    <Card>
      <CardContent className='flex flex-col gap-4'>
        {/* Header with Avatar and Trend */}
        <div className='flex items-start justify-between'>
          <CustomAvatar
            variant='rounded'
            skin={avatarSkin}
            color={avatarColor}
            size={avatarSize}
          >
            <i className={classnames(avatarIcon, `text-[${avatarIconSize}px]`)} />
          </CustomAvatar>
          
          {trend && (
            <Box className='flex flex-col items-end'>
              <Typography 
                variant='caption' 
                className={`font-medium ${trend.isPositive ? 'text-success-main' : 'text-error-main'}`}
              >
                {trend.isPositive ? '+' : ''}{trend.percentage.toFixed(1)}%
              </Typography>
              {trend.previousValue && (
                <Typography variant='caption' color='text.disabled'>
                  vs {trend.previousValue}
                </Typography>
              )}
            </Box>
          )}
        </div>

        {/* Stats and Title */}
        <div className='flex flex-col gap-1'>
          <Typography variant='h4' color='text.primary' className='font-semibold'>
            {stats}
          </Typography>
          <Typography variant='body1' color='text.primary' className='font-medium'>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant='body2' color='text.disabled'>
              {subtitle}
            </Typography>
          )}
        </div>

        {/* Mini Chart */}
        {chartData && chartData.length > 0 && (
          <Box className='mt-2'>
            <AppReactApexCharts
              type='line'
              height={60}
              width='100%'
              series={[{ data: chartData }]}
              options={chartOptions}
            />
          </Box>
        )}

        {/* Chip */}
        {chipText && (
          <Box className='flex justify-start'>
            <Chip
              variant='tonal'
              size='small'
              label={chipText}
              color={chipColor}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default EnhancedCardStatsVertical
