'use client'

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import { styled, keyframes } from '@mui/material/styles'

// Animation for number counting
const countUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const AnimatedBox = styled(Box)(({ theme }) => ({
  animation: `${countUp} 0.6s ease-out`
}))

interface EnhancedKPICardProps {
  title: string
  subtitle: string
  currentValue: number
  previousValue: number
  target?: number
  icon: string
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  format?: 'number' | 'percentage' | 'currency'
  suffix?: string
}

const EnhancedKPICard = ({
  title,
  subtitle,
  currentValue,
  previousValue,
  target,
  icon,
  color,
  format = 'number',
  suffix = ''
}: EnhancedKPICardProps) => {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate trend
  const trend = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0
  const isPositiveTrend = trend >= 0
  
  // Calculate progress towards target
  const progressPercentage = target ? Math.min((currentValue / target) * 100, 100) : 0

  // Format value based on type
  const formatValue = (value: number) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'currency':
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value)
      default:
        return `${value.toLocaleString()}${suffix}`
    }
  }

  // Animate number counting
  useEffect(() => {
    setIsAnimating(true)
    let start = 0
    const end = currentValue
    const duration = 1000 // 1 second
    const increment = end / (duration / 16) // 60fps

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        setIsAnimating(false)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [currentValue])

  const getTrendColor = () => {
    if (Math.abs(trend) < 1) return 'default'
    return isPositiveTrend ? 'success' : 'error'
  }

  const getTrendIcon = () => {
    if (Math.abs(trend) < 1) return 'tabler-minus'
    return isPositiveTrend ? 'tabler-trending-up' : 'tabler-trending-down'
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme => theme.shadows[8]
        }
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: `${color}.light`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${color}.main`
            }}
          >
            <i className={icon} style={{ fontSize: '1.5rem' }} />
          </Box>
        </Box>

        {/* Main Value */}
        <AnimatedBox>
          <Typography 
            variant="h3" 
            color={`${color}.main`}
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            {formatValue(displayValue)}
          </Typography>
        </AnimatedBox>

        {/* Trend Indicator */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Chip
            icon={<i className={getTrendIcon()} />}
            label={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
            size="small"
            color={getTrendColor()}
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            vs last period
          </Typography>
        </Box>

        {/* Progress towards target */}
        {target && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Target: {formatValue(target)}
              </Typography>
              <Typography variant="body2" color={`${color}.main`} fontWeight="medium">
                {progressPercentage.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              color={color}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme => theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default EnhancedKPICard
