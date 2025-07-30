'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

interface Metric {
  title: string
  value: number
  delta: number
  description: string
}

const metrics: Metric[] = [
  {
    title: 'Productivity',
    value: 92,
    delta: 2,
    description: 'Week on week improvement'
  },
  {
    title: 'Revenues',
    value: 480000,
    delta: 5,
    description: 'Monthly increase'
  },
  {
    title: 'Engagement',
    value: 79,
    delta: -1,
    description: 'Slight decrease in department C'
  }
]

const PerformanceMetrics = () => {
  return (
    <Card>
      <CardHeader
        title="Performance Metrics"
        subheader="Tracking key performance indicators"
      />
      <CardContent>
        <Grid container spacing={4}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Typography variant="h6">{metric.title}</Typography>
              <Typography variant="h4" color="primary">
                {metric.value}%
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                {metric.description}
              </Typography>
              <Typography
                variant="caption"
                color={metric.delta > 0 ? 'green' : 'red'}
              >
                {metric.delta > 0 ? '+' : ''}{metric.delta}%
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PerformanceMetrics

