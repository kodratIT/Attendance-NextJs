'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Component Imports
import OptionMenu from '@core/components/option-menu'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

interface DepartmentChartProps {
  data: {
    areas: string[]
    counts: number[]
    colors?: string[]
  }
  title?: string
  subheader?: string
}

const DepartmentChart = ({ 
  data, 
  title = "Distribusi per Cabang", 
  subheader = "Kehadiran Hari Ini" 
}: DepartmentChartProps) => {
  const theme = useTheme()

  const defaultColors = [
    'var(--mui-palette-primary-main)',
    'var(--mui-palette-success-main)',
    'var(--mui-palette-warning-main)',
    'var(--mui-palette-error-main)',
    'var(--mui-palette-info-main)',
    'var(--mui-palette-secondary-main)'
  ]

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    colors: data.colors || defaultColors,
    labels: data.areas,
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    },
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '13px',
      labels: { colors: 'var(--mui-palette-text-secondary)' },
      markers: { offsetY: 0, offsetX: theme.direction === 'rtl' ? 7 : -4 },
      itemMargin: { horizontal: 9 }
    },
    stroke: { width: 0 },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value: number) => `${value} orang`
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--mui-palette-text-primary)',
              formatter: () => {
                return data.counts.reduce((a, b) => a + b, 0).toString()
              }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--mui-palette-text-primary)'
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 1200,
        options: {
          chart: { height: 350 }
        }
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <OptionMenu
            options={['Hari Ini', 'Minggu Ini', 'Bulan Ini']}
          />
        }
      />
      <CardContent>
        <AppReactApexCharts
          type="donut"
          height={400}
          width="100%"
          series={data.counts}
          options={options}
        />
      </CardContent>
    </Card>
  )
}

export default DepartmentChart
